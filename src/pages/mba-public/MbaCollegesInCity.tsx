import { Link, Navigate, useParams } from "react-router-dom";
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
import {
  ALL_COLLEGES,
  NIRF,
  breadcrumbJsonLd,
  faqJsonLd,
  getInstitute,
  institutePath,
  isPublished,
  itemListJsonLd,
  joinNames,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { CAP_META, capInstitutes } from "@/lib/mahCap";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { MBA_CITIES, MBA_PATHS, cityPath, citySlugFor, examPath, institutesInCity } from "@/lib/mbaRoutes.mjs";

function CityPage({ slug }: { slug: string }) {
  const city = MBA_CITIES.find((c) => c.slug === slug)!;
  const path = cityPath(slug);
  const crumbs = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: `In ${city.name}` });
  const listed = institutesInCity(MBA_SNAPSHOT, slug);
  const ranked = listed.filter((x) => x.nirf).sort((a, b) => a.nirf!.rank - b.nirf!.rank);
  const profiles = ALL_COLLEGES.filter((c) => citySlugFor(c.city) === slug);
  const capNames = capInstitutes(slug);
  const hasCap = capNames.length > 0 && CAP_META;
  const others = MBA_CITIES.filter((c) => c.slug !== slug && isPublished(cityPath(c.slug)));
  const year = NIRF?.year ?? "";

  const answer = (
    <p>
      {ranked.length > 0 ? (
        <>
          {city.name} has {ranked.length} institute{ranked.length === 1 ? "" : "s"} in the NIRF {year} Management top 100
          {ranked[0] ? `, led by ${ranked[0].name} (rank ${ranked[0].nirf!.rank})` : ""}.{" "}
        </>
      ) : null}
      {profiles.length > 0 ? `We have verified fees and placements for ${profiles.length} of them. ` : ""}
      {hasCap
        ? `${capNames.length} institutes in ${city.name} also fill MBA/MMS seats through Maharashtra's CAP counselling, admitting on MAH-CET (or CAT) scores; their official closing percentiles are below.`
        : "Compare each institute's fees, cut-offs and placements before you shortlist."}
    </p>
  );

  const faqs: Faq[] = [
    ...(ranked.length
      ? [
          {
            q: `Which is the best MBA college in ${city.name}?`,
            a: `By the NIRF ${year} Management ranking, the highest-ranked institute in ${city.name} is ${ranked[0].name} (rank ${ranked[0].nirf!.rank})${ranked.length > 1 ? `, followed by ${joinNames(ranked.slice(1, 3).map((r) => r.name))}` : ""}. The best choice for you also depends on fees, specialisation and your score.`,
          },
        ]
      : []),
    ...(hasCap
      ? [
          {
            q: `How do I get MBA admission in ${city.name} through MAH-CET?`,
            a: `Most MBA/MMS seats in ${city.name}'s state-approved institutes are filled through the Centralised Admission Process (CAP) run by the State CET Cell, Maharashtra, using MAH-MBA/MMS CET scores (and, for some seats, CAT and other national exams). You register for CAP, fill an option form and are allotted a seat by merit in rounds.`,
          },
          {
            q: "Are the CAP closing percentiles CAT percentiles?",
            a: "No. They are MAH-MBA/MMS CET percentiles of the last candidate allotted a seat in each column in that round. Do not compare them with CAT percentiles.",
          },
        ]
      : []),
    {
      q: `Should I choose an MBA college in ${city.name} for placements?`,
      a: "Being near industry helps with internships and live projects, but placements depend most on the institute itself. Read each institute's official placement report for the median salary and the share of the batch placed.",
    },
  ];

  const description = `MBA colleges in ${city.name}: NIRF ${year}-ranked institutes, verified fees and placements${hasCap ? ", and official MAH-CET CAP closing percentiles" : ""}, with sources.`;

  return (
    <>
      <PageSEO
        title={`MBA Colleges in ${city.name}: Fees & Cut-offs`}
        description={description.length > 155 ? `${description.slice(0, 152)}…` : description}
        canonical={path}
        jsonLd={[
          breadcrumbJsonLd(crumbs, path),
          itemListJsonLd(
            `MBA colleges in ${city.name}`,
            listed.map((x) => ({ name: x.slug ? getInstitute(x.slug)?.shortName ?? x.name : x.name, path: x.slug ? institutePath(x.slug) : null })),
          ),
          faqJsonLd(faqs),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} eyebrow={`MBA colleges · ${city.name}`} title={`MBA Colleges in ${city.name}`} answer={answer} />

        <Container className="mt-8 space-y-12">
          {ranked.length > 0 && NIRF && (
            <Section
              id="nirf"
              title={`Which MBA colleges in ${city.name} are NIRF-ranked?`}
              lead={
                <p>
                  NIRF {year} Management ranking, as published. <Cite source={NIRF.source} />
                </p>
              }
            >
              <TableWrap caption={`NIRF ${year}-ranked management institutes in ${city.name}`}>
                <thead>
                  <tr>
                    <Th className="w-[80px]">NIRF rank</Th>
                    <Th>Institute</Th>
                    <Th className="text-right">Score</Th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((x) => (
                    <tr key={x.name}>
                      <Td className="tabular-nums">{x.nirf!.rank}</Td>
                      <Td>
                        {x.slug ? (
                          <Link to={institutePath(x.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                            {x.nirf!.name}
                          </Link>
                        ) : (
                          x.nirf!.name
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">{x.nirf!.score ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Section>
          )}

          {profiles.length > 0 && (
            <Section
              id="profiles"
              title={`What do MBA colleges in ${city.name} cost, and what do graduates earn?`}
              lead={<p>Flagship programme figures from each institute&rsquo;s own documents.</p>}
            >
              <CollegeTable colleges={profiles} caption={`MBA colleges in ${city.name} with verified data`} columns={["nirf", "exams", "fee", "salary"]} />
            </Section>
          )}

          {hasCap && (
            <Section
              id="cap-cutoffs"
              title={`What MAH-CET percentile do ${city.name} MBA colleges close at?`}
              lead={
                <p>
                  Official closing figures from Maharashtra&rsquo;s CAP counselling for MBA/MMS courses in {city.name}. These
                  are <strong>MAH-MBA/MMS CET percentiles, not CAT percentiles</strong>. The full statewide list is on the{" "}
                  <Link to={examPath("mah-mba-cet")} className="font-medium text-[#2F43F2] underline">
                    MAH-CET page
                  </Link>
                  .
                </p>
              }
            >
              <CapCutoffTable citySlug={slug} />
            </Section>
          )}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>

          <SourcesList
            sources={[
              ...(NIRF ? [NIRF.source] : []),
              ...(hasCap && CAP_META ? [CAP_META.source] : []),
              ...profiles.flatMap((c) => [c.programs[0]?.feeSource, c.programs[0]?.salarySource]).filter((s) => !!s).map((s) => s!),
            ]}
          />

          {others.length > 0 && (
            <Section id="other-cities" title="MBA colleges in other cities">
              <LinkChips label="Other cities" items={others.map((c) => ({ to: cityPath(c.slug), label: `MBA colleges in ${c.name}` }))} />
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.colleges} className="font-medium text-[#2F43F2] hover:underline">
                  All MBA colleges in India
                </Link>
              </p>
            </Section>
          )}

          <MbaConversion intent={`MBA colleges in ${city.name} enquiry`} formId="mba_city_page" exam={hasCap ? "MAH-CET" : "CAT"} />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaCollegesInCity() {
  const { city } = useParams<{ city: string }>();
  if (!city || !isPublished(cityPath(city))) return <Navigate to={MBA_PATHS.colleges} replace />;
  return <CityPage slug={city} />;
}
