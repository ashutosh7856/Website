import { useState } from "react";
import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Card,
  Container,
  FaqList,
  Hero,
  LinkChips,
  MbaConversion,
  MinimumsCaveat,
  PageShell,
  RelatedMbaPages,
  Section,
  TableWrap,
  Td,
  Th,
  ThresholdCell,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_CATEGORIES } from "@/api/mba";
import {
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  INSTITUTES_ON_LATEST_BATCH,
  LAST_VERIFIED,
  LAST_VERIFIED_ISO,
  MBA_INSTITUTES,
  POLICY_BATCHES,
  breadcrumbJsonLd,
  cutoffSources,
  faqJsonLd,
  institutePath,
  isPublished,
  joinNames,
  mbaCrumbs,
  overallRange,
  programsWithCutoffs,
  thresholdRows,
  type Faq,
} from "@/lib/mbaPublic";
import { absoluteUrl } from "@/lib/siteUrl.mjs";
import { MBA_PATHS, MBA_PERCENTILES, percentilePath } from "@/lib/mbaRoutes.mjs";

const COUNT = MBA_INSTITUTES.length;
const GENERAL = overallRange("General");
const SC = overallRange("SC");
const LATEST = joinNames(INSTITUTES_ON_LATEST_BATCH.map((i) => i.shortName));
const SOURCES = cutoffSources();
const NOTED = MBA_INSTITUTES.filter((i) => i.cutoffNotes);
const GENDERED = joinNames(MBA_INSTITUTES.filter((i) => i.cutoffs.some((c) => c.gender)).map((i) => i.shortName));

const CRUMBS = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: "IIM CAT cut-offs" });
const PERCENTILE_LINKS = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p))).map((p) => ({
  to: percentilePath(p),
  label: `MBA colleges at ${p} percentile`,
}));

const FAQS: Faq[] = [
  {
    q: "Which IIM has the highest minimum CAT percentile?",
    a: `Among the ${COUNT} IIMs listed, the highest overall minimum for a General, non-PwD candidate is ${GENERAL.max} (${joinNames(GENERAL.maxNames)}) and the lowest is ${GENERAL.min} (${joinNames(GENERAL.minNames)}). A higher minimum does not mean a harder interview call, because each IIM shortlists on its own composite score after this stage.`,
  },
  {
    q: "Are these the percentiles needed for an IIM interview call?",
    a: "No. They are the minimum eligibility thresholds each IIM publishes for its first, CAT-based shortlisting stage. Interview-call percentiles are usually much higher and are not officially published in a comparable form.",
  },
  {
    q: "Why do some IIMs show separate rows for men and women?",
    a: `${GENDERED} publish gender-specific minimums in their policies, so those rows carry the gender they apply to. Where a policy has no row for a group, the table says so rather than guessing.`,
  },
  {
    q: "How current is this table?",
    a: `Every row was checked against the IIM's own policy on ${LAST_VERIFIED}. Only ${LATEST} had published 2027-29 policies by then; the others show their latest official 2026-28 policy, and the batch is printed in every row.`,
  },
];

export default function IimCutoffs() {
  const [pwd, setPwd] = useState(false);

  const jsonLd = [
    breadcrumbJsonLd(CRUMBS, IIM_CUTOFFS_PATH),
    faqJsonLd(FAQS),
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Minimum CAT percentiles published by IIMs, by category",
      description: `Overall and sectional (VARC, DILR, QA) minimum CAT percentiles that ${COUNT} Indian Institutes of Management publish for their first shortlisting stage, by reservation category, PwD status and, where applicable, gender. Policy batches ${POLICY_BATCHES.join(" and ")}. Taken only from each institute's official admission policy.`,
      url: absoluteUrl(IIM_CUTOFFS_PATH),
      creator: { "@type": "Organization", name: "ProCounsel", url: absoluteUrl("/") },
      isBasedOn: SOURCES.map((s) => s.url),
      ...(LAST_VERIFIED_ISO ? { dateModified: LAST_VERIFIED_ISO } : {}),
      inLanguage: "en-IN",
      isAccessibleForFree: true,
    },
  ];

  return (
    <>
      <PageSEO
        title="IIM CAT Cut-offs: Official Minimum Percentiles"
        description={`Official minimum CAT percentiles of all ${COUNT} IIMs for General, EWS, NC-OBC, SC and ST, overall and sectional, with batch and source. Verified ${LAST_VERIFIED}.`}
        canonical={IIM_CUTOFFS_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow={`Official data · ${POLICY_BATCHES.join(" / ")} policies`}
          title="IIM CAT Cut-offs: Minimum Percentiles by Category"
          answer={
            <p>
              The {COUNT} IIMs below publish minimum CAT percentiles for their first shortlisting stage. For a General,
              non-PwD candidate the overall minimum ranges from {GENERAL.min} ({joinNames(GENERAL.minNames)}) to{" "}
              {GENERAL.max} ({joinNames(GENERAL.maxNames)}); for SC candidates it ranges from {SC.min} to {SC.max}.
              These are entry thresholds, not closing cut-offs, and every row links to the policy it comes from.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          <Section
            id="table"
            title="What is the minimum CAT percentile for each IIM, by category?"
            lead={
              <p>
                Each cell shows the overall minimum in bold, then the VARC / DILR / QA minimums (&ldquo;—&rdquo; = none
                set). Where an IIM sets separate minimums by gender, each gender has its own line. Want a yes/no answer
                for your own percentile? Use the{" "}
                <Link to={ELIGIBILITY_TOOL_PATH} className="font-medium text-[#2F43F2] underline">
                  CAT college predictor
                </Link>
                .
              </p>
            }
          >
            <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="PwD status">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={pwd === v}
                  onClick={() => setPwd(v)}
                  className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${pwd === v ? "bg-[#2F43F2] text-white" : "text-slate-600"}`}
                >
                  {v ? "PwD candidates" : "Non-PwD candidates"}
                </button>
              ))}
            </div>
            <TableWrap caption={`Minimum CAT percentiles by category, ${pwd ? "PwD" : "non-PwD"} candidates`}>
              <thead>
                <tr>
                  <Th>Institute</Th>
                  <Th>Batch</Th>
                  {MBA_CATEGORIES.map((c) => (
                    <Th key={c.id}>{c.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MBA_INSTITUTES.flatMap((inst) =>
                  programsWithCutoffs(inst).map((code, i, codes) => {
                    const byCategory = MBA_CATEGORIES.map(
                      (c) => thresholdRows(inst, c.id, pwd).find((r) => r.programCode === code)!,
                    );
                    const first = byCategory[0];
                    return (
                      <tr key={`${inst.slug}-${code}`}>
                        <Td>
                          <Link to={institutePath(inst.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                            {inst.shortName}
                          </Link>
                          {codes.length > 1 && <span className="block text-[12px] text-slate-500">{code}</span>}
                          {i === 0 && (
                            <a
                              href={first.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={first.source.title}
                              className="mt-0.5 block text-[11.5px] text-slate-500 underline decoration-dotted underline-offset-2"
                            >
                              Official policy
                            </a>
                          )}
                        </Td>
                        <Td>{first.policyBatch}</Td>
                        {byCategory.map((row, ci) => (
                          <Td key={MBA_CATEGORIES[ci].id}>
                            <ThresholdCell records={row.records} />
                          </Td>
                        ))}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </TableWrap>
            {NOTED.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-[13px] leading-6 text-slate-600">
                {NOTED.map((i) => (
                  <li key={i.slug}>
                    <strong className="text-slate-700">{i.shortName}:</strong> {i.cutoffNotes}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <MinimumsCaveat>
                Academic minimums (Class X/XII, graduation) and the positive-raw-score rules some IIMs add are on each
                institute&rsquo;s page.
              </MinimumsCaveat>
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          {PERCENTILE_LINKS.length > 0 && (
            <Section id="by-percentile" title="Which colleges can you target at your percentile?">
              <LinkChips label="MBA colleges by CAT percentile" items={PERCENTILE_LINKS} />
            </Section>
          )}

          <Section id="sources" title="Sources">
            <Card>
              <p className="text-[14px] leading-7 text-slate-700">
                Only the IIMs&rsquo; own admission policies, checked on {LAST_VERIFIED}. No coaching or aggregator site
                is used.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-6">
                {SOURCES.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 wrap-anywhere underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          <RelatedMbaPages current={IIM_CUTOFFS_PATH} />

          <MbaConversion intent="IIM CAT cut-offs enquiry" formId="iim_cutoffs_page" />
        </Container>
      </PageShell>
    </>
  );
}
