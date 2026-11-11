import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
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
import { MBA_CATEGORIES, type ProgramDetail } from "@/api/mba";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { DEFAULT_COMPARE, comparePath } from "@/lib/mbaCompare";
import {
  ALL_COLLEGES,
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  LAST_VERIFIED,
  MBA_COUNSELLING_PATH,
  NIRF,
  breadcrumbJsonLd,
  describeMinimum,
  educationalOrganizationJsonLd,
  faqJsonLd,
  flagship,
  formatInr,
  formatLakh,
  institutePath,
  isPublished,
  mbaCrumbs,
  nirfFor,
  programsWithCutoffs,
  thresholdRows,
  type Faq,
} from "@/lib/mbaPublic";
import {
  MBA_EXAMS,
  MBA_PATHS,
  MBA_SPECIALISATIONS,
  PHASE1_PERCENTILES,
  cityPath,
  citySlugFor,
  collegesOffering,
  examPath,
  percentilePath,
  specialisationPath,
} from "@/lib/mbaRoutes.mjs";

const examShort = (id: string) => MBA_EXAMS.find((e) => e.id === id)?.short ?? id.toUpperCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function FactRow({
  label,
  value,
  note,
  source,
}: {
  label: string;
  value: string;
  note: string | null;
  source: ProgramDetail["feeSource"];
}) {
  return (
    <tr>
      <Td className="w-[170px] font-medium text-slate-600">{label}</Td>
      <Td>
        <span className="font-semibold tabular-nums text-[#0E1629]">{value}</span>
        {note && <span className="mt-1 block text-[12.5px] leading-5 text-slate-500">{note}</span>}
        {source && (
          <span className="mt-1 block">
            <Cite source={source} />
          </span>
        )}
      </Td>
    </tr>
  );
}

function ProgramFacts({ program }: { program: ProgramDetail }) {
  return (
    <div>
      <h3 className="mb-2 font-[Poppins] text-[16px] font-semibold">{program.name}</h3>
      <TableWrap caption={`${program.name} key facts`}>
        <tbody>
          <FactRow
            label="Duration"
            value={program.durationYears ? `${program.durationYears} years` : "Not published"}
            note={null}
            source={null}
          />
          <FactRow label="Total programme fee" value={formatInr(program.feeTotal)} note={program.feeNote} source={program.feeSource} />
          <FactRow
            label="Intake"
            value={program.intake === null ? "Not published" : `${program.intake} seats`}
            note={program.intakeNote}
            source={program.intakeSource}
          />
          <FactRow
            label={program.medianSalaryYear ? `Median salary (${program.medianSalaryYear})` : "Median salary"}
            value={program.medianSalary === null ? "Not published" : `${formatInr(program.medianSalary)} per year`}
            note={program.salaryNote}
            source={program.salarySource}
          />
        </tbody>
      </TableWrap>
    </div>
  );
}

/** The percentile page whose band holds this General overall minimum. */
function bandFor(overall: number | null): number | null {
  if (overall === null) return null;
  const bands = [...PHASE1_PERCENTILES].sort((a, b) => a - b).filter((p) => isPublished(percentilePath(p)));
  return bands.find((p) => p >= overall) ?? null;
}

/** The longest title that fits a SERP (≤ 47 characters + " | ProCounsel"). */
function profileTitle(short: string, acceptsCat: boolean): string {
  const options = acceptsCat
    ? [`${short} Cut-off, Fees & Placements`, `${short} Cut-off & Fees`, `${short} Fees & Placements`, short]
    : [`${short} Admission, Fees & Placements`, `${short} Fees & Placements`, `${short} Admission & Fees`, short];
  return options.find((t) => t.length <= 47) ?? short;
}

function buildFaqs(inst: MbaCollege): Faq[] {
  const main = flagship(inst);
  const general = programsWithCutoffs(inst).length ? thresholdRows(inst, "General", false)[0] : undefined;
  const generalText = general && general.records.length ? describeMinimum(general.records) : null;
  const nirf = nirfFor(inst);
  const faqs: Faq[] = [];
  if (generalText) {
    faqs.push({
      q: `What is the minimum CAT percentile for ${inst.shortName}?`,
      a: `For a General, non-PwD candidate, ${inst.shortName}'s ${general!.policyBatch} admission policy sets a minimum of ${generalText}. This is the threshold to be considered at the first shortlisting stage, not the percentile at which interview calls close, which is usually higher.`,
    });
  } else if (inst.cutoffNotes) {
    faqs.push({ q: `What is the minimum CAT percentile for ${inst.shortName}?`, a: inst.cutoffNotes });
  }
  if (inst.acceptedExams.length) {
    faqs.push({
      q: `Which entrance exams does ${inst.shortName} accept?`,
      a: `${inst.shortName}'s official admission documents list ${inst.acceptedExams.map(examShort).join(" and ")} for its ${main?.code ?? "MBA"} admissions. Check the current year's admission policy before applying, as accepted exams can change.`,
    });
  }
  if (main?.feeTotal) {
    faqs.push({
      q: `What is the fee for the ${main.code} at ${inst.shortName}?`,
      a: `${inst.shortName} states a total programme fee of ${formatInr(main.feeTotal)} (${formatLakh(main.feeTotal)}).${main.feeNote ? ` ${main.feeNote}` : ""}`,
    });
  }
  if (main?.medianSalary) {
    faqs.push({
      q: `What is the median salary at ${inst.shortName}?`,
      a: `${formatInr(main.medianSalary)} per year${main.medianSalaryYear ? ` for the ${main.medianSalaryYear} graduating class` : ""}, from the institute's official report. Past placements do not guarantee future outcomes.`,
    });
  }
  if (nirf && NIRF) {
    faqs.push({
      q: `What is ${inst.shortName}'s NIRF ranking?`,
      a: `${inst.shortName} is ranked ${nirf.rank} in the NIRF ${NIRF.year} Management ranking (${NIRF.edition ?? "India Rankings"}, Ministry of Education)${nirf.score !== null ? ` with a score of ${nirf.score} out of 100` : ""}.`,
    });
  }
  return faqs;
}

function Page({ inst }: { inst: MbaCollege }) {
  const path = institutePath(inst.slug);
  const isIim = inst.group === "IIM";
  const crumbs = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: inst.shortName });
  const codes = programsWithCutoffs(inst);
  const main = flagship(inst);
  const general = codes.length ? thresholdRows(inst, "General", false)[0] : undefined;
  const generalText = general && general.records.length ? describeMinimum(general.records) : null;
  const generalOverall = general ? Math.min(...general.records.map((r) => r.overall ?? Infinity)) : null;
  const band = bandFor(Number.isFinite(generalOverall ?? NaN) ? generalOverall : null);
  const nirf = nirfFor(inst);
  const faqs = buildFaqs(inst);
  const batch = general?.policyBatch ?? inst.cutoffs[0]?.policyBatch;
  const citySlug = citySlugFor(inst.city);
  const cityLive = citySlug && isPublished(cityPath(citySlug)) ? citySlug : null;
  const acceptsCat = inst.acceptedExams.includes("cat");
  const specs = MBA_SPECIALISATIONS.filter(
    (s) => isPublished(specialisationPath(s.slug)) && collegesOffering(MBA_SNAPSHOT, s.slug).some((c) => c.slug === inst.slug),
  );
  const siblings = ALL_COLLEGES.filter((c) => c.slug !== inst.slug && (isIim ? c.group === "IIM" : citySlugFor(c.city) === citySlug || c.group === "Other"));

  const answer = (
    <p>
      {generalText ? (
        <>
          {inst.shortName}&rsquo;s {batch} admission policy sets a minimum CAT percentile of {generalText} for General,
          non-PwD candidates.{" "}
        </>
      ) : inst.acceptedExams.length ? (
        <>{inst.shortName} admits students to its {main?.code ?? "MBA"} through {inst.acceptedExams.map(examShort).join(" or ")}. </>
      ) : null}
      {nirf && NIRF ? `It is ranked ${nirf.rank} in the NIRF ${NIRF.year} Management ranking. ` : ""}
      {main?.feeTotal ? `Its ${main.code} fee is ${formatInr(main.feeTotal)} for the whole programme. ` : ""}
      {main?.medianSalary
        ? `The reported median salary${main.medianSalaryYear ? ` for the ${main.medianSalaryYear} graduating class` : ""} was ${formatInr(main.medianSalary)} a year. `
        : ""}
      Every figure below links to the institute&rsquo;s own document.
    </p>
  );

  const description = [
    generalText ? `${inst.shortName} CAT cut-off (${batch}, General minimum): ${generalText}.` : `${inst.shortName} admission, fees and placements.`,
    main?.feeTotal ? `Fee ${formatInr(main.feeTotal)}.` : "",
    main?.medianSalary ? `Median salary ${formatInr(main.medianSalary)}.` : "",
    `Official sources.`,
  ]
    .filter(Boolean)
    .join(" ");

  const examLinks = inst.acceptedExams
    .filter((id) => isPublished(examPath(id)))
    .map((id) => ({ to: examPath(id), label: `${examShort(id)} exam guide` }));

  return (
    <>
      <PageSEO
        title={profileTitle(inst.shortName, acceptsCat)}
        description={description.length > 155 ? `${description.slice(0, 152)}…` : description}
        canonical={path}
        jsonLd={[educationalOrganizationJsonLd(inst), breadcrumbJsonLd(crumbs, path), ...(faqs.length ? [faqJsonLd(faqs)] : [])]}
      />
      <PageShell>
        <Hero
          crumbs={crumbs}
          eyebrow={[inst.city, inst.state].filter(Boolean).join(", ") || inst.name}
          title={`${inst.shortName}: ${acceptsCat ? "CAT Cut-off" : "Admission"}, Fees and Placements`}
          answer={answer}
        >
          <div className="mt-6 flex flex-wrap gap-3">
            {isIim && (
              <Link
                to={ELIGIBILITY_TOOL_PATH}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#2335d0]"
              >
                Check your percentile against {inst.shortName}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link
              to={MBA_COUNSELLING_PATH}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
            >
              Talk to an MBA counsellor
            </Link>
            {isPublished(MBA_PATHS.compare) && (
              <Link
                to={comparePath([inst.slug, ...DEFAULT_COMPARE.filter((x) => x !== inst.slug)].slice(0, 3))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
              >
                Compare {inst.shortName} with other colleges
              </Link>
            )}
            {inst.website && (
              <a
                href={inst.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-3 text-[13.5px] font-medium text-slate-600 hover:text-[#2F43F2]"
              >
                Official website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section
            id="overview"
            title={`What should you know about ${inst.shortName} at a glance?`}
          >
            <TableWrap caption={`${inst.shortName} at a glance`}>
              <tbody>
                <tr>
                  <Td className="w-[190px] font-medium text-slate-600">Full name</Td>
                  <Td>{inst.name}</Td>
                </tr>
                {inst.city && (
                  <tr>
                    <Td className="font-medium text-slate-600">Location</Td>
                    <Td>
                      {[inst.city, inst.state].filter(Boolean).join(", ")}
                      {cityLive && (
                        <Link to={cityPath(cityLive)} className="ml-2 text-[13px] font-medium text-[#2F43F2] hover:underline">
                          More MBA colleges in {inst.city}
                        </Link>
                      )}
                    </Td>
                  </tr>
                )}
                {inst.ownership && (
                  <tr>
                    <Td className="font-medium text-slate-600">Type</Td>
                    <Td>{cap(inst.ownership)}</Td>
                  </tr>
                )}
                {inst.acceptedExams.length > 0 && (
                  <tr>
                    <Td className="font-medium text-slate-600">Exams accepted</Td>
                    <Td>{inst.acceptedExams.map(examShort).join(", ")}</Td>
                  </tr>
                )}
                {inst.specialisations.length > 0 && (
                  <tr>
                    <Td className="font-medium text-slate-600">Specialisations listed</Td>
                    <Td>{inst.specialisations.join(", ")}</Td>
                  </tr>
                )}
                {nirf && NIRF && (
                  <tr>
                    <Td className="font-medium text-slate-600">NIRF {NIRF.year} (Management)</Td>
                    <Td>
                      Rank {nirf.rank}
                      {nirf.score !== null ? `, score ${nirf.score}` : ""}
                      <span className="mt-1 block">
                        <Cite source={NIRF.source} />
                      </span>
                    </Td>
                  </tr>
                )}
                {inst.facts.map((f) => (
                  <tr key={f.label}>
                    <Td className="font-medium text-slate-600">{f.label}</Td>
                    <Td>
                      <span className="font-semibold text-[#0E1629]">{f.value}</span>
                      {f.note && <span className="mt-1 block text-[12.5px] leading-5 text-slate-500">{f.note}</span>}
                      <span className="mt-1 block">
                        <Cite source={f.source} />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>

          {codes.length > 0 && (
            <Section
              id="minimums"
              title={`What CAT percentile does ${inst.shortName} require, by category?`}
              lead={
                <p>
                  Minimum percentiles from the {batch} policy for the first, CAT-based shortlisting stage. Each cell is the
                  overall minimum in bold, then VARC / DILR / QA (&ldquo;—&rdquo; = none set).
                  {band && (
                    <>
                      {" "}
                      See every college whose minimum is within reach at{" "}
                      <Link to={percentilePath(band)} className="font-medium text-[#2F43F2] underline">
                        {band} percentile
                      </Link>
                      .
                    </>
                  )}
                </p>
              }
            >
              <div className="space-y-6">
                {codes.map((code) => {
                  const nonPwd = MBA_CATEGORIES.map((c) => thresholdRows(inst, c.id, false).find((r) => r.programCode === code)!);
                  const pwdRows = MBA_CATEGORIES.map((c) => thresholdRows(inst, c.id, true).find((r) => r.programCode === code)!);
                  const program = inst.programs.find((p) => p.code === code);
                  const latest = nonPwd[0];
                  const notes = [
                    ...new Set(
                      inst.cutoffs
                        .filter((c) => c.programCode === code && c.policyBatch === latest.policyBatch && c.notes)
                        .map((c) => c.notes as string),
                    ),
                  ];
                  return (
                    <div key={code}>
                      {codes.length > 1 && <h3 className="mb-2 font-[Poppins] text-[16px] font-semibold">{program?.name ?? code}</h3>}
                      <TableWrap caption={`${inst.shortName} ${code} minimum CAT percentiles by category`}>
                        <thead>
                          <tr>
                            <Th>Category</Th>
                            <Th>Non-PwD</Th>
                            <Th>PwD</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {MBA_CATEGORIES.map((c, i) => (
                            <tr key={c.id}>
                              <Td className="font-medium">{c.label}</Td>
                              <Td>
                                <ThresholdCell records={nonPwd[i].records} />
                              </Td>
                              <Td>
                                <ThresholdCell records={pwdRows[i].records} />
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </TableWrap>
                      <p className="mt-2 text-[12.5px] text-slate-500">
                        Policy batch {latest.policyBatch}. <Cite source={latest.source} />
                      </p>
                      {notes.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-6 text-slate-600">
                          {notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
                {inst.cutoffNotes && <p className="text-[13px] leading-6 text-slate-600">{inst.cutoffNotes}</p>}
                <MinimumsCaveat />
                {isIim && (
                  <p className="text-[13.5px] text-slate-600">
                    Compare with every IIM in the{" "}
                    <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] underline">
                      IIM CAT cut-offs table
                    </Link>
                    .
                  </p>
                )}
              </div>
            </Section>
          )}

          {inst.selectionProcess.length > 0 && (
            <Section id="selection" title={`How does ${inst.shortName} select students?`}>
              <ol className="space-y-3">
                {inst.selectionProcess.map((st) => (
                  <li key={st.stage} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="font-[Poppins] text-[15.5px] font-semibold">
                      Stage {st.stage}: {st.name}
                    </h3>
                    {st.weightage && <p className="mt-1 text-[13px] font-medium text-slate-700">Weightage: {st.weightage}</p>}
                    {st.detail && <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600">{st.detail}</p>}
                  </li>
                ))}
              </ol>
              <p className="mt-2">
                <Cite source={inst.selectionSource} />
              </p>
            </Section>
          )}

          <Section id="programmes" title={`What does ${inst.shortName} cost, and what do graduates earn?`}>
            <div className="space-y-6">
              {inst.programs.map((p) => (
                <ProgramFacts key={p.code} program={p} />
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">
              Compare fees and salaries across colleges on the{" "}
              {isPublished(MBA_PATHS.fees) ? (
                <Link to={MBA_PATHS.fees} className="font-medium text-[#2F43F2] underline">
                  MBA fees
                </Link>
              ) : (
                "MBA fees"
              )}{" "}
              and{" "}
              {isPublished(MBA_PATHS.placements) ? (
                <Link to={MBA_PATHS.placements} className="font-medium text-[#2F43F2] underline">
                  MBA placements
                </Link>
              ) : (
                "MBA placements"
              )}{" "}
              pages.
            </p>
          </Section>

          {(examLinks.length > 0 || specs.length > 0) && (
            <Section id="related" title={`Which exams and specialisations lead to ${inst.shortName}?`}>
              <LinkChips
                label="Exams and specialisations"
                items={[
                  ...examLinks,
                  ...specs.map((s) => ({ to: specialisationPath(s.slug), label: `MBA in ${s.name}` })),
                ]}
              />
            </Section>
          )}

          {faqs.length > 0 && (
            <Section id="faq" title="Frequently asked questions">
              <FaqList faqs={faqs} />
            </Section>
          )}

          <SourcesList
            sources={[...inst.sources, ...(nirf && NIRF ? [NIRF.source] : [])]}
            intro={<>Official documents used on this page, all checked on {LAST_VERIFIED}. ProCounsel is not affiliated with {inst.shortName}.</>}
          />

          {siblings.length > 0 && (
            <Section id="other-colleges" title={isIim ? "Other IIMs" : "Other MBA colleges with verified data"}>
              <LinkChips label="Other colleges" items={siblings.map((o) => ({ to: institutePath(o.slug), label: o.shortName }))} />
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.colleges} className="font-medium text-[#2F43F2] hover:underline">
                  All MBA colleges and the NIRF ranking
                </Link>
              </p>
            </Section>
          )}

          <MbaConversion
            intent={`${inst.shortName} admission enquiry`}
            formId="mba_college_profile"
            heading={`Planning to apply to ${inst.shortName}?`}
            subheading="A ProCounsel MBA counsellor can review your score, academics and work experience with you and help you build a realistic shortlist. Free call, no login needed. We do not promise admission — the institute decides."
          />
        </Container>
      </PageShell>
    </>
  );
}

export default function CollegeProfile({ inst }: { inst: MbaCollege }) {
  return <Page inst={inst} />;
}

