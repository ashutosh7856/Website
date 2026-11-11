import { Link, Navigate, useParams } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import CollegeTable from "@/components/mba-public/CollegeTable";
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
import { SrcLink } from "@/components/mba-public/CollegeTable";
import { specialisationContent, type SpecialisationContent } from "@/content/mbaSpecialisations";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { LAST_VERIFIED_ISO, articleJsonLd, breadcrumbJsonLd, faqJsonLd, isPublished, itemListJsonLd, institutePath, mbaCrumbs } from "@/lib/mbaPublic";
import {
  MBA_PATHS,
  MBA_SPECIALISATIONS,
  collegesOffering,
  specialisationPath,
  unprofiledOffering,
  type MbaSpecialisationEntry,
} from "@/lib/mbaRoutes.mjs";

function Page({ spec, c }: { spec: MbaSpecialisationEntry; c: SpecialisationContent }) {
  const path = specialisationPath(spec.slug);
  const crumbs = mbaCrumbs({ name: "Specialisations", to: MBA_PATHS.specialisations }, { name: spec.name });
  const colleges = collegesOffering(MBA_SNAPSHOT, spec.slug);
  // specialisations.json entries: evidence for profiled colleges, and institutes we list without a profile.
  const listings = MBA_SNAPSHOT.specialisationListings.filter((l) => l.spec === spec.slug);
  const unprofiled = unprofiledOffering(MBA_SNAPSHOT, spec.slug);
  const allNames = [...colleges.map((x) => x.shortName), ...unprofiled.map((l) => l.institute)];
  const title = `MBA in ${spec.name}: Subjects, Careers and Colleges`;
  const description = `MBA in ${spec.name}: what you study, the roles it leads to, who it suits and ${allNames.length} colleges that offer it, from official data.`;
  const faqs = [
    ...c.faqs,
    {
      q: `Which colleges offer an MBA in ${spec.name}?`,
      a: `Among the institutes whose data we have verified, ${allNames.join(", ")} list ${spec.name.toLowerCase()} as a specialisation or programme. Many others offer it too; check each institute's programme page.`,
    },
  ];
  const siblings = MBA_SPECIALISATIONS.filter((s) => s.slug !== spec.slug && isPublished(specialisationPath(s.slug)));
  return (
    <>
      <PageSEO
        title={`MBA in ${spec.short ?? spec.name}: Careers & Colleges`}
        description={description}
        canonical={path}
        jsonLd={[
          articleJsonLd({ headline: title, description, path, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(crumbs, path),
          itemListJsonLd(`Colleges offering an MBA in ${spec.name}`, [
            ...colleges.map((x) => ({ name: x.name, path: institutePath(x.slug) })),
            ...unprofiled.map((l) => ({ name: l.institute })),
          ]),
          faqJsonLd(faqs),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} eyebrow="MBA specialisation" title={title} answer={<p>{c.answer}</p>} />
        <Container className="mt-8 space-y-12">
          <Section id="subjects" title={`What do you study in an MBA in ${spec.name}?`}>
            <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-[14.5px] leading-7 text-slate-700">
              {c.subjects.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Section>
          <Section id="careers" title={`What jobs can you get after an MBA in ${spec.name}?`}>
            <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-[14.5px] leading-7 text-slate-700">
              {c.roles.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="mt-3 max-w-3xl text-[13.5px] leading-6 text-slate-600">
              We do not quote salary ranges by specialisation: no official source publishes them consistently. For outcomes,
              read each institute&rsquo;s own placement report; our{" "}
              {isPublished(MBA_PATHS.placements) ? (
                <Link to={MBA_PATHS.placements} className="font-medium text-[#2F43F2] underline">
                  placements page
                </Link>
              ) : (
                "placements page"
              )}{" "}
              collects the medians they publish.
            </p>
          </Section>
          <Section id="fit" title={`Is an MBA in ${spec.name} right for you?`}>
            <p className="max-w-3xl text-[14.5px] leading-7 text-slate-700">{c.suits}</p>
          </Section>
          <Section
            id="colleges"
            title={`Which colleges offer an MBA in ${spec.name}?`}
            lead={<p>Institutes whose official programme data lists it. {c.choosing}</p>}
          >
            {colleges.length > 0 && (
              <CollegeTable colleges={colleges} caption={`Colleges offering an MBA in ${spec.name}`} columns={["city", "nirf", "fee", "salary"]} />
            )}
            {listings.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-[Poppins] text-[16px] font-semibold">What do the institutes&rsquo; own pages say?</h3>
                <TableWrap caption={`Official evidence that each institute offers ${spec.name}`}>
                  <thead>
                    <tr>
                      <Th>Institute</Th>
                      <Th>Programme</Th>
                      <Th>How it is offered</Th>
                      <Th>What the official page lists</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => (
                      <tr key={`${l.spec}-${l.slug}`}>
                        <Td>
                          {l.profileSlug ? (
                            <Link to={institutePath(l.profileSlug)} className="font-semibold text-[#2F43F2] hover:underline">
                              {l.institute}
                            </Link>
                          ) : (
                            <span className="font-semibold">{l.institute}</span>
                          )}
                        </Td>
                        <Td className="text-[13px]">{l.programme ?? "—"}</Td>
                        <Td className="whitespace-nowrap text-[12.5px] font-medium text-slate-700">{l.basis ? l.basis.charAt(0).toUpperCase() + l.basis.slice(1) : "—"}</Td>
                        <Td className="max-w-[460px] text-[12.5px] leading-5 text-slate-600">
                          {l.evidence ?? "Listed on the institute's programme page."}
                          <SrcLink url={l.source.url} label={`${l.institute} ${spec.name}`} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </Section>
          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>
          <SourcesList sources={[...listings.map((l) => l.source), ...colleges.flatMap((x) => x.sources.slice(0, 2))]} />
          {siblings.length > 0 && (
            <Section id="other" title="Other MBA specialisations">
              <LinkChips label="Other specialisations" items={siblings.map((s) => ({ to: specialisationPath(s.slug), label: `MBA in ${s.name}` }))} />
            </Section>
          )}
          <MbaConversion intent={`MBA in ${spec.name} enquiry`} formId="mba_specialisation_page" />
        </Container>
      </PageShell>
    </>
  );
}

export default function SpecialisationPage() {
  const { spec } = useParams<{ spec: string }>();
  const entry = MBA_SPECIALISATIONS.find((s) => s.slug === spec);
  const content = entry ? specialisationContent(entry.slug) : undefined;
  if (!entry || !content || !isPublished(specialisationPath(entry.slug))) return <Navigate to={MBA_PATHS.hub} replace />;
  return <Page spec={entry} c={content} />;
}
