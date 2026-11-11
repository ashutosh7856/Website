import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Cite,
  Container,
  FaqList,
  Hero,
  LinkChips,
  MbaConversion,
  MinimumsCaveat,
  PageShell,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
  ThresholdCell,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_CATEGORIES, type MbaCategory } from "@/api/mba";
import {
  CAT_PATTERN_PATH,
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  MBA_INSTITUTES,
  MBA_SNAPSHOT_NOT_PUBLISHED,
  bandStatus,
  breadcrumbJsonLd,
  faqJsonLd,
  institutePath,
  isPublished,
  itemListJsonLd,
  joinNames,
  mbaCrumbs,
  percentileRows,
  type Faq,
  CUTOFF_KIND_LABEL,
  type PercentileRow,
} from "@/lib/mbaPublic";
import { MBA_PATHS, MBA_PERCENTILES, percentilePath } from "@/lib/mbaRoutes.mjs";

const KIND_LABEL = CUTOFF_KIND_LABEL;

function RowName({ row }: { row: PercentileRow }) {
  return row.slug ? (
    <Link to={institutePath(row.slug)} className="font-semibold text-[#2F43F2] hover:underline">
      {row.name}
    </Link>
  ) : (
    <span className="font-semibold">{row.name}</span>
  );
}

function BandTable({ rows, caption }: { rows: PercentileRow[]; caption: string }) {
  return (
    <TableWrap caption={caption}>
      <thead>
        <tr>
          <Th>Institute</Th>
          <Th>Overall · VARC / DILR / QA</Th>
          <Th>What the figure is</Th>
          <Th>Batch</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <Td>
              <RowName row={r} />
            </Td>
            <Td>
              <ThresholdCell records={r.records} />
            </Td>
            <Td className="text-[13px]">
              <strong className="font-semibold text-slate-700">{KIND_LABEL[r.kind]}</strong>
              {r.notes && <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{r.notes}</span>}
              <span className="block">
                <Cite source={r.source} />
              </span>
            </Td>
            <Td className="text-[13px]">{r.batch || "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

const pctWord = (p: number) => `${p} percentile`;

export default function PercentileColleges({ p }: { p: number }) {
  const path = percentilePath(p);
  const crumbs = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: `At ${pctWord(p)}` });

  const general = percentileRows("General");
  const meets = general.filter((r) => bandStatus(r, p) === "meets");
  const below = general.filter((r) => bandStatus(r, p) === "below");
  const noOverall = general.filter((r) => bandStatus(r, p) === "no-overall");
  const iimMeets = meets.filter((r) => r.isIim);
  const iimNames = [...new Set(iimMeets.map((r) => r.name.replace(/ \(.*\)$/, "")))];
  const otherMeets = meets.filter((r) => !r.isIim);
  const iimCount = MBA_INSTITUTES.length;
  const institutesMeeting = new Set(meets.map((r) => r.slug ?? r.key.split(":")[0])).size;

  const byCategory = MBA_CATEGORIES.map((c) => {
    const rows = percentileRows(c.id as MbaCategory);
    const ok = rows.filter((r) => bandStatus(r, p) === "meets");
    return { category: c.label, total: rows.length, ok };
  });

  const siblings = MBA_PERCENTILES.filter((x) => x !== p && isPublished(percentilePath(x)));
  const sources = [...meets, ...below, ...noOverall].map((r) => r.source);

  const answer = (
    <p>
      At {pctWord(p)} in CAT, a General-category, non-PwD candidate is at or above the published overall minimum of{" "}
      {iimMeets.length === 0 ? "none" : `${iimNames.length}`} of the {iimCount} IIMs
      {iimNames.length > 0 && iimNames.length <= 6 ? ` (${joinNames(iimNames)})` : ""}
      {otherMeets.length > 0 ? `, and the published figure of ${otherMeets.length} other programme${otherMeets.length === 1 ? "" : "s"}` : ""}{" "}
      — {institutesMeeting} institutes in all. Sectional minimums still apply, and a published minimum or shortlisting
      figure is not admission: final selection uses a composite of academics, work experience and WAT/PI.
    </p>
  );

  const faqs: Faq[] = [
    {
      q: `Can I get into an IIM with ${pctWord(p)}?`,
      a:
        iimMeets.length > 0
          ? `${pctWord(p)} clears the General overall minimum at ${iimNames.length} IIMs (${joinNames(iimNames)}), provided you also meet their sectional minimums. Clearing a minimum only makes you eligible to be considered; each IIM then ranks applicants on a composite of CAT, academics, work experience and diversity, and the percentile at which calls actually go out is usually higher.`
          : `No IIM's published General overall minimum is at or below ${pctWord(p)}. Reserved-category minimums are lower — see the category table on this page — and other MBA colleges and exams may suit a ${p} percentile better.`,
    },
    {
      q: `Is ${pctWord(p)} a good CAT score?`,
      a: `A ${p} percentile means you scored higher than about ${p}% of the candidates who took the test. Whether it is "good" depends on your category, sectional scores and the colleges you want: compare it with the official minimums below and with your academic and work-experience profile rather than with a single number.`,
    },
    {
      q: "Are these the actual cut-offs for an interview call?",
      a: "No. Most figures here are minimum eligibility thresholds that institutes publish in their admission policies. Institutes say the percentile needed for a call is usually higher and changes every year with the applicant pool. Where a source calls a figure a shortlisting or closing cut-off, the table says so.",
    },
  ];

  const description = `MBA colleges at ${pctWord(p)} in CAT: which IIMs' official minimums ${p} clears, by category, with sources. Minimums are not cut-offs.`;

  return (
    <>
      <PageSEO
        title={`MBA Colleges at ${p} Percentile in CAT`}
        description={description}
        canonical={path}
        jsonLd={[
          breadcrumbJsonLd(crumbs, path),
          itemListJsonLd(
            `Programmes whose General overall CAT minimum is at or below ${p}`,
            meets.map((r) => ({ name: r.name, path: r.slug ? institutePath(r.slug) : null })),
          ),
          faqJsonLd(faqs),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} eyebrow="CAT percentile · college options" title={`MBA Colleges at ${p} Percentile in CAT`} answer={answer}>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={ELIGIBILITY_TOOL_PATH}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#2335d0]"
            >
              Check your exact percentile and sectionals
            </Link>
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section
            id="meets"
            title={`Which MBA programmes' minimums does ${pctWord(p)} clear?`}
            lead={
              <p>
                General category, non-PwD. Each row is the latest official figure we hold; the overall value is in bold,
                then the sectional minimums. You must clear every one of them, not only the overall.
              </p>
            }
          >
            {meets.length ? (
              <BandTable rows={meets} caption={`Programmes whose General overall CAT figure is at or below ${p}`} />
            ) : (
              <p className="text-[14px] text-slate-700">
                None of the programmes we hold official figures for sets a General overall minimum at or below {p}.
              </p>
            )}
          </Section>

          {below.length > 0 && (
            <Section
              id="above"
              title={`Which programmes need more than ${pctWord(p)}?`}
              lead={<p>Their published General overall figure is above {p}, so this percentile is below their minimum.</p>}
            >
              <BandTable rows={below} caption={`Programmes whose General overall CAT figure is above ${p}`} />
            </Section>
          )}

          {noOverall.length > 0 && (
            <Section
              id="sectional-only"
              title="Which programmes set only sectional minimums?"
              lead={<p>These publish no General overall minimum, so eligibility depends on your sectional percentiles.</p>}
            >
              <BandTable rows={noOverall} caption="Programmes with sectional minimums only" />
            </Section>
          )}

          <Section id="how-to-read" title="What do these percentiles mean for your admission?">
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
              <li>
                <strong>A published minimum or shortlisting figure is not admission.</strong> It decides only whether your
                application is considered or called for the next round.
              </li>
              <li>
                <strong>Final selection uses a composite score.</strong> Institutes combine the CAT score with Class X/XII
                and graduation marks, work experience, diversity factors and the written test (WAT) and personal
                interview (PI), each with its own published weights.
              </li>
              <li>
                <strong>Sectional minimums apply.</strong> Where an institute sets VARC, DILR or QA minimums, you must
                clear each one as well as the overall figure.
              </li>
              <li>
                <strong>The stage matters.</strong> Each row says whether the figure is a minimum to apply, a
                shortlisting cut-off or last year&rsquo;s final cut-off; they are not interchangeable.
              </li>
            </ul>
          </Section>

          {MBA_SNAPSHOT_NOT_PUBLISHED.length > 0 && (
            <Section
              id="no-official-cutoff"
              title="Which well-known schools publish no official CAT cut-off?"
              lead={
                <p>
                  We checked these institutes&rsquo; own documents and found no published CAT percentile cut-off, so they
                  are not placed in any band. They shortlist on their own composite criteria.
                </p>
              }
            >
              <ul className="flex flex-wrap gap-2 text-[13px]">
                {MBA_SNAPSHOT_NOT_PUBLISHED.map((x) => (
                  <li key={x.slug}>
                    {x.profileSlug && isPublished(institutePath(x.profileSlug)) ? (
                      <Link
                        to={institutePath(x.profileSlug)}
                        className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-[#2F43F2] hover:border-[#2F43F2]/40"
                      >
                        {x.name}
                      </Link>
                    ) : (
                      <span className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600">{x.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            id="by-category"
            title={`How does ${pctWord(p)} compare for reserved categories?`}
            lead={<p>Count of programmes whose overall minimum for the category (non-PwD) is at or below {p}.</p>}
          >
            <TableWrap caption={`Programmes within reach at ${p} percentile, by category`}>
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th className="text-right">Programmes at or below {p}</Th>
                  <Th>Institutes</Th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.category}>
                    <Td className="font-medium">{c.category}</Td>
                    <Td className="text-right tabular-nums">
                      {c.ok.length} of {c.total}
                    </Td>
                    <Td className="text-[13px]">{c.ok.length ? c.ok.map((r) => r.name).join(", ") : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-3 text-[13.5px] text-slate-600">
              Full category and PwD tables for every IIM:{" "}
              <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] underline">
                IIM CAT cut-offs
              </Link>
              .
            </p>
            <div className="mt-4">
              <MinimumsCaveat />
            </div>
          </Section>

          <Section id="other-percentiles" title="What about other percentiles?">
            <LinkChips
              label="Other percentile bands"
              items={siblings.map((x) => ({ to: percentilePath(x), label: `MBA colleges at ${x} percentile` }))}
            />
            <p className="mt-4 text-[13.5px] text-slate-600">
              Still preparing? The{" "}
              <Link to={CAT_PATTERN_PATH} className="font-medium text-[#2F43F2] underline">
                CAT exam pattern
              </Link>{" "}
              and the{" "}
              <Link to={MBA_PATHS.colleges} className="font-medium text-[#2F43F2] underline">
                list of MBA colleges
              </Link>{" "}
              are good next reads.
            </p>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>

          <SourcesList sources={sources} />

          <MbaConversion intent={`MBA colleges at ${p} percentile`} formId="mba_percentile_page" />
        </Container>
      </PageShell>
    </>
  );
}
