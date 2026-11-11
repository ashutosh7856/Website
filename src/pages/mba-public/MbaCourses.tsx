import { Link, Navigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
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
import type { ProgramDetail } from "@/api/mba";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import {
  ALL_COLLEGES,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  formatLakh,
  institutePath,
  isPublished,
  itemListJsonLd,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_PATHS, MBA_SPECIALISATIONS, specialisationPath } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.courses;
const CRUMBS = mbaCrumbs({ name: "MBA resources", to: MBA_PATHS.resources }, { name: "MBA courses" });

type Kind = "MBA" | "PGDM" | "MMS" | "Other";

/** The award a programme leads to, read from its official name. */
function programmeKind(name: string): Kind {
  if (/\bMMS\b|Master of Management Studies/i.test(name)) return "MMS";
  if (/\bMBA\b|Master of Business Administration/i.test(name)) return "MBA";
  if (/\bPGDM\b|Post ?Graduate Diploma in Management/i.test(name)) return "PGDM";
  return "Other";
}

const KIND_INFO: Record<Kind, { label: string; what: string }> = {
  MBA: {
    label: "MBA (degree)",
    what: "A master's degree. The IIMs award it under the IIM Act, 2017; universities and deemed universities award it too. Several IIMs still call the course a PGP.",
  },
  PGDM: {
    label: "PGDM (diploma)",
    what: "A postgraduate diploma from an autonomous, AICTE-approved institute such as XLRI, MDI, SPJIMR or IMT. The curriculum is the institute's own.",
  },
  MMS: {
    label: "MMS (degree)",
    what: "Master of Management Studies, a two-year management degree offered by Mumbai University institutes such as JBIMS, admitted through Maharashtra's CAP.",
  },
  Other: {
    label: "Other management master's",
    what: "A related master's programme, such as an MA in human resource management, admitted through an MBA entrance exam.",
  },
};

interface Entry {
  college: MbaCollege;
  program: ProgramDetail;
  kind: Kind;
}

const ENTRIES: Entry[] = ALL_COLLEGES.flatMap((college) => college.programs.map((program) => ({ college, program, kind: programmeKind(program.name) })));
const KINDS: Kind[] = (["MBA", "PGDM", "MMS", "Other"] as Kind[]).filter((k) => ENTRIES.some((e) => e.kind === k));
const byKind = (k: Kind) => ENTRIES.filter((e) => e.kind === k);
const twoYear = ENTRIES.filter((e) => e.program.durationYears === 2);
const oneYear = ENTRIES.filter((e) => e.program.durationYears === 1);
const noDuration = ENTRIES.filter((e) => e.program.durationYears === null);
const feeRange = (list: Entry[]) => {
  const fees = list.filter((e) => e.program.feeTotal !== null && e.program.feeSource).map((e) => e.program.feeTotal!);
  return fees.length ? { lo: Math.min(...fees), hi: Math.max(...fees), n: fees.length } : null;
};
const ALL_FEES = feeRange(ENTRIES);
const SPECS = MBA_SPECIALISATIONS.filter((s) => isPublished(specialisationPath(s.slug)));
const label = (e: Entry) => (e.college.programs.length > 1 ? `${e.college.shortName} (${e.program.code})` : e.college.shortName);

const FAQS: Faq[] = [
  {
    q: "What is the difference between an MBA and a PGDM?",
    a: "An MBA is a degree awarded by a university or an IIM; a PGDM is a diploma awarded by an autonomous AICTE-approved institute. For jobs and further study, what counts is the institute's standing and the programme's recognition, not the label. Our MBA vs PGDM guide covers it in detail.",
  },
  {
    q: "How long is an MBA in India?",
    a: `The standard full-time MBA or PGDM runs two years: ${twoYear.length} of the ${ENTRIES.length} programmes we have verified state a two-year duration. One-year programmes exist for experienced professionals at some institutes; their terms are on each institute's site.`,
  },
  {
    q: "What does a full-time MBA cost?",
    a: ALL_FEES
      ? `Among the ${ALL_FEES.n} programmes with an official total fee, fees run from ${formatLakh(ALL_FEES.lo)} to ${formatLakh(ALL_FEES.hi)} for the whole programme. What the fee includes varies; the MBA fees page has each institute's note.`
      : "Each institute states its own fee; see the MBA fees page.",
  },
  {
    q: "Is an executive or online MBA the same as a full-time MBA?",
    a: "No. Executive MBAs are for working professionals, usually with several years' experience, and are often taught at weekends or in modules; online MBAs are taught remotely. Admission routes, recognition and outcomes differ from the full-time programmes on this page, so check each programme's approvals and placement support before applying.",
  },
  {
    q: "Which entrance exam do I need for an MBA course?",
    a: "It depends on the institute: IIMs use CAT, XLRI uses XAT, Symbiosis institutes use SNAP, NMIMS uses NMAT, and Maharashtra's MBA/MMS seats use MAH-MBA/MMS CET. Many private institutes accept several exams.",
  },
];

function Page() {
  const title = "MBA Courses in India: Full-Time, One-Year, Executive, Online";
  const description = `Types of MBA courses in India: MBA vs PGDM vs MMS, two-year, one-year, executive and online formats, with the official duration and fee of ${ENTRIES.length} programmes.`;
  const sources = ENTRIES.map((e) => e.program.feeSource).filter((s) => !!s).map((s) => s!);
  return (
    <>
      <PageSEO
        title="MBA Courses: Types, Duration, Fees"
        description={description.length > 155 ? `${description.slice(0, 152)}…` : description}
        canonical={PATH}
        jsonLd={[
          articleJsonLd({ headline: title, description, path: PATH, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(CRUMBS, PATH),
          itemListJsonLd("MBA programmes with verified data", ENTRIES.map((e) => ({ name: `${e.college.shortName}: ${e.program.name}`, path: institutePath(e.college.slug) }))),
          faqJsonLd(FAQS),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA courses · types and formats"
          title={title}
          answer={
            <p>
              Most MBA courses in India are two-year, full-time programmes leading to an MBA degree, a PGDM diploma or, in
              Maharashtra, an MMS. Of the {ENTRIES.length} programmes we have verified, {KINDS.map((k) => `${byKind(k).length} ${k === "Other" ? "other" : k}`).join(", ")}
              {ALL_FEES ? `; official total fees run from ${formatLakh(ALL_FEES.lo)} to ${formatLakh(ALL_FEES.hi)}` : ""}. One-year,
              executive and online MBAs are separate formats for different students.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Section
            id="types"
            title="What types of MBA programmes are there?"
            lead={<p>The award each verified programme leads to, read from its official name, and the range of its official total fees.</p>}
          >
            <TableWrap caption="MBA programme types">
              <thead>
                <tr>
                  <Th>Type</Th>
                  <Th>What it is</Th>
                  <Th className="text-right">Verified programmes</Th>
                  <Th className="text-right">Total fee range</Th>
                </tr>
              </thead>
              <tbody>
                {KINDS.map((k) => {
                  const range = feeRange(byKind(k));
                  return (
                    <tr key={k}>
                      <Td className="font-semibold">{KIND_INFO[k].label}</Td>
                      <Td className="max-w-[420px] text-[13px] leading-6 text-slate-700">{KIND_INFO[k].what}</Td>
                      <Td className="text-right tabular-nums">{byKind(k).length}</Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {range ? (range.lo === range.hi ? formatLakh(range.lo) : `${formatLakh(range.lo)} – ${formatLakh(range.hi)}`) : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
            <p className="mt-3 text-[13.5px] text-slate-600">
              Does the label matter? Read{" "}
              <Link to="/mba-resources/mba-vs-pgdm" className="font-medium text-[#2F43F2] underline">
                MBA vs PGDM: what is the difference
              </Link>
              .
            </p>
          </Section>

          <Section id="formats" title="How long is an MBA, and which formats are there?">
            <TableWrap caption="MBA formats">
              <thead>
                <tr>
                  <Th>Format</Th>
                  <Th>Who it is for</Th>
                  <Th>In our verified data</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td className="font-semibold">Full-time, two years</Td>
                  <Td className="text-[13px]">Graduates with or without work experience; admission through CAT, XAT, SNAP, NMAT, CMAT or MAH-CET</Td>
                  <Td className="text-[13px]">
                    {twoYear.length} programmes state two years{noDuration.length ? `; ${noDuration.length} state no duration` : ""}
                  </Td>
                </tr>
                <tr>
                  <Td className="font-semibold">Full-time, one year</Td>
                  <Td className="text-[13px]">Professionals with several years of experience, often admitted through GMAT or GRE</Td>
                  <Td className="text-[13px]">{oneYear.length ? `${oneYear.length} programmes` : "None verified yet; terms are on each institute's site"}</Td>
                </tr>
                <tr>
                  <Td className="font-semibold">Executive / part-time</Td>
                  <Td className="text-[13px]">Working managers who study alongside their job, often at weekends or in modules</Td>
                  <Td className="text-[13px]">None verified yet</Td>
                </tr>
                <tr>
                  <Td className="font-semibold">Online / distance</Td>
                  <Td className="text-[13px]">Learners who need to study remotely; check UGC/AICTE approval of the specific programme</Td>
                  <Td className="text-[13px]">None verified yet</Td>
                </tr>
              </tbody>
            </TableWrap>
          </Section>

          <Section
            id="programmes"
            title="Which full-time programmes have we verified?"
            lead={<p>Each institute&rsquo;s programmes as it names them, with duration and official total fee.</p>}
          >
            <TableWrap caption="Verified MBA programmes">
              <thead>
                <tr>
                  <Th>Institute</Th>
                  <Th>Programme</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Duration</Th>
                  <Th className="text-right">Total fee</Th>
                </tr>
              </thead>
              <tbody>
                {ENTRIES.map((e) => (
                  <tr key={`${e.college.slug}-${e.program.code}`}>
                    <Td>
                      <Link to={institutePath(e.college.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                        {label(e)}
                      </Link>
                    </Td>
                    <Td className="max-w-[360px] text-[13px]">{e.program.name}</Td>
                    <Td className="text-[13px]">{e.kind}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">{e.program.durationYears ? `${e.program.durationYears} years` : "—"}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {e.program.feeTotal !== null && e.program.feeSource ? formatLakh(e.program.feeTotal) : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-2 text-[12.5px] text-slate-500">
              Fee sources and what each fee includes are on the{" "}
              <Link to={MBA_PATHS.fees} className="font-medium text-[#2F43F2] underline">
                MBA fees
              </Link>{" "}
              page and each institute&rsquo;s profile.
            </p>
          </Section>

          {SPECS.length > 0 && (
            <Section id="specialisations" title="Which MBA specialisations can you choose?">
              <LinkChips label="MBA specialisations" items={SPECS.map((s) => ({ to: specialisationPath(s.slug), label: `MBA in ${s.name}` }))} />
            </Section>
          )}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <SourcesList sources={sources} />

          <RelatedMbaPages current={PATH} />

          <MbaConversion intent="MBA courses enquiry" formId="mba_courses_page" />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaCourses() {
  if (!isPublished(PATH)) return <Navigate to={MBA_PATHS.resources} replace />;
  return <Page />;
}
