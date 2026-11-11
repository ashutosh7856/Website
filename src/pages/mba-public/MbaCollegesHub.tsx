import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import CollegeTable from "@/components/mba-public/CollegeTable";
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
import {
  ALL_COLLEGES,
  IIM_CUTOFFS_PATH,
  LAST_VERIFIED_ISO,
  MBA_INSTITUTES,
  NIRF,
  breadcrumbJsonLd,
  faqJsonLd,
  formatDay,
  institutePath,
  isPublished,
  itemListJsonLd,
  joinNames,
  mbaCrumbs,
  nirfFor,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_CITIES, MBA_PATHS, MBA_PERCENTILES, cityPath, percentilePath } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.colleges;
const CRUMBS = mbaCrumbs({ name: "MBA colleges" });

/** NIRF row → our profile slug, when we have a published one. */
const PROFILE_BY_RANK = new Map(
  ALL_COLLEGES.map((c) => [nirfFor(c), c] as const).filter(([row]) => row !== null).map(([row, c]) => [row!.rank + "|" + row!.name, c]),
);

export default function MbaCollegesHub() {
  const rows = NIRF?.rankings ?? [];
  const top5 = rows.slice(0, 5).map((r) => r.name);
  const profileFor = (r: (typeof rows)[number]) => PROFILE_BY_RANK.get(`${r.rank}|${r.name}`);
  const iimRanked = MBA_INSTITUTES.filter((i) => nirfFor(i)).length;
  const percentileLinks = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p))).map((p) => ({
    to: percentilePath(p),
    label: `MBA colleges at ${p} percentile`,
  }));
  const cityLinks = MBA_CITIES.filter((c) => isPublished(cityPath(c.slug))).map((c) => ({
    to: cityPath(c.slug),
    label: `MBA colleges in ${c.name}`,
  }));
  const year = NIRF?.year ?? "";

  const faqs: Faq[] = [
    ...(NIRF && top5.length
      ? [
          {
            q: "Which is the best MBA college in India?",
            a: `In the latest official NIRF Management ranking (${NIRF.edition ?? `India Rankings ${year}`}), ${top5[0]} is ranked first, followed by ${joinNames(top5.slice(1))}. The best college for you also depends on fees, specialisation, location and your profile.`,
          },
        ]
      : []),
    {
      q: "How does NIRF rank management institutes?",
      a: "NIRF, run by the Ministry of Education, scores institutes on five parameter groups: Teaching, Learning and Resources; Research and Professional Practice; Graduation Outcomes; Outreach and Inclusivity; and Perception. The score is out of 100.",
    },
    {
      q: "Are all IIMs in the NIRF top 100?",
      a: `${iimRanked} of the ${MBA_INSTITUTES.length} IIMs we track appear in the NIRF ${year} Management top 100. Institutes that do not take part, or rank below 100, are not listed in it.`,
    },
    {
      q: "Is the NIRF 2026 management ranking out?",
      a: `Not as of ${formatDay(LAST_VERIFIED_ISO)}. The table here is NIRF ${year}${NIRF?.releasedOn ? `, released on ${formatDay(NIRF.releasedOn)}` : ""}; we will update it when the next edition is published.`,
    },
  ];

  const description = `Best MBA colleges in India: the NIRF ${year} Management top ${rows.length} with scores, plus ${ALL_COLLEGES.length} verified profiles with fees, cut-offs and placements.`;

  return (
    <>
      <PageSEO
        title={`Best MBA Colleges in India: NIRF ${year} Ranking`}
        description={description}
        canonical={PATH}
        jsonLd={[
          breadcrumbJsonLd(CRUMBS, PATH),
          itemListJsonLd(
            `NIRF ${year} Management ranking`,
            rows.map((r) => {
              const p = profileFor(r);
              return { name: r.name, path: p ? institutePath(p.slug) : null };
            }),
          ),
          faqJsonLd(faqs),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow={`NIRF ${year} · verified profiles`}
          title="Best MBA Colleges in India: NIRF Ranking and Verified Profiles"
          answer={
            <p>
              {NIRF && top5.length ? (
                <>
                  By the latest official NIRF Management ranking ({NIRF.edition ?? `India Rankings ${year}`}, Ministry of
                  Education), the top five are {joinNames(top5)}.{" "}
                </>
              ) : null}
              Below is the full top {rows.length}, followed by the {ALL_COLLEGES.length} institutes whose fees, cut-offs and
              placements we have checked against their own documents. A rank is a starting point; fit, fees and your
              profile decide the right college.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          {rows.length > 0 && NIRF && (
            <Section
              id="nirf"
              title={`Which are the top MBA colleges in India according to NIRF ${year}?`}
              lead={
                <p>
                  Rank, name, city and score (out of 100) exactly as NIRF publishes them. Institutes with a ProCounsel
                  profile are linked. <Cite source={NIRF.source} />
                </p>
              }
            >
              <TableWrap caption={`NIRF ${year} Management ranking, top ${rows.length}`}>
                <thead>
                  <tr>
                    <Th className="w-[70px]">Rank</Th>
                    <Th>Institute</Th>
                    <Th>City</Th>
                    <Th className="text-right">Score</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const p = profileFor(r);
                    return (
                      <tr key={`${r.rank}-${r.name}`}>
                        <Td className="tabular-nums">{r.rank}</Td>
                        <Td>
                          {p ? (
                            <Link to={institutePath(p.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                              {r.name}
                            </Link>
                          ) : (
                            r.name
                          )}
                        </Td>
                        <Td>{[r.city, r.state].filter(Boolean).join(", ")}</Td>
                        <Td className="text-right tabular-nums">{r.score ?? "—"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </Section>
          )}

          <Section
            id="profiles"
            title="Which MBA colleges have verified fees, cut-offs and placements?"
            lead={<p>Flagship programme of each institute; every figure links to the institute&rsquo;s own document.</p>}
          >
            <CollegeTable colleges={ALL_COLLEGES} caption="MBA colleges with verified data" columns={["city", "nirf", "exams", "fee", "salary"]} />
            {isPublished(MBA_PATHS.compare) && (
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.compare} className="font-medium text-[#2F43F2] hover:underline">
                  Compare up to four of these colleges side by side
                </Link>
              </p>
            )}
          </Section>

          <Section id="by-percentile" title="Which colleges can you target at your CAT percentile?">
            <LinkChips label="MBA colleges by CAT percentile" items={percentileLinks} />
            <p className="mt-3 text-[13.5px]">
              <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] hover:underline">
                IIM CAT cut-offs by category
              </Link>
            </p>
          </Section>

          {cityLinks.length > 0 && (
            <Section id="by-city" title="Which cities have the most MBA colleges?">
              <LinkChips label="MBA colleges by city" items={cityLinks} />
            </Section>
          )}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>

          <SourcesList
            sources={[
              ...(NIRF ? [NIRF.source, ...(NIRF.releaseSource ? [NIRF.releaseSource] : [])] : []),
              ...ALL_COLLEGES.flatMap((c) => [c.programs[0]?.feeSource, c.programs[0]?.salarySource]).filter((s) => !!s).map((s) => s!),
            ]}
          />

          <MbaConversion intent="Best MBA colleges enquiry" formId="mba_colleges_hub" />
        </Container>
      </PageShell>
    </>
  );
}
