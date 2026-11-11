import { Navigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import { Container, FaqList, Hero, LinkCards, MbaConversion, PageShell, Section } from "@/components/mba-public/MbaPublicUi";
import { specialisationContent } from "@/content/mbaSpecialisations";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { LAST_VERIFIED_ISO, articleJsonLd, breadcrumbJsonLd, faqJsonLd, isPublished, itemListJsonLd, mbaCrumbs, type Faq } from "@/lib/mbaPublic";
import { MBA_PATHS, MBA_SPECIALISATIONS, collegesOffering, specialisationPath, unprofiledOffering } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.specialisations;
const CRUMBS = mbaCrumbs({ name: "Specialisations" });
const TITLE = "MBA Specialisations: Which One Should You Choose?";
const DESCRIPTION =
  "MBA specialisations explained: finance, marketing, HR, business analytics, operations, supply chain and more: what each covers and who offers it.";

const FAQS: Faq[] = [
  {
    q: "Which MBA specialisation is best?",
    a: "None is best for everyone. Choose the one whose day-to-day work you would enjoy and where your background gives you an edge, then check which colleges are strong in it.",
  },
  {
    q: "When do you choose an MBA specialisation?",
    a: "In most two-year programmes you choose electives in the second year, after a common first year. Some institutes run separate programmes, such as HR or agribusiness, that you choose at admission.",
  },
  {
    q: "Can I take two specialisations in an MBA?",
    a: "Many programmes allow a major and a minor, or a dual specialisation, through the electives you pick. Check each institute's rules.",
  },
];

export default function SpecialisationsHub() {
  if (!isPublished(PATH)) return <Navigate to={MBA_PATHS.hub} replace />;
  const live = MBA_SPECIALISATIONS.filter((s) => isPublished(specialisationPath(s.slug)));
  return (
    <>
      <PageSEO
        title="MBA Specialisations: How to Choose"
        description={DESCRIPTION}
        canonical={PATH}
        jsonLd={[
          articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: PATH, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(CRUMBS, PATH),
          itemListJsonLd("MBA specialisations", live.map((s) => ({ name: `MBA in ${s.name}`, path: specialisationPath(s.slug) }))),
          faqJsonLd(FAQS),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA specialisations"
          title={TITLE}
          answer={
            <p>
              Most two-year MBAs give you a common first year and let you specialise in the second, through electives in
              areas like finance, marketing, HR, business analytics, operations and supply chain. Choose by the work you
              want to do and the institute&rsquo;s strength in that area, not by which specialisation is said to pay most.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Section id="list" title="What does each MBA specialisation cover?">
            <LinkCards
              label="MBA specialisations"
              items={live.map((s) => ({
                to: specialisationPath(s.slug),
                label: `MBA in ${s.name}`,
                detail: `${specialisationContent(s.slug)?.subjects.slice(0, 3).join(", ") ?? ""} · ${collegesOffering(MBA_SNAPSHOT, s.slug).length + unprofiledOffering(MBA_SNAPSHOT, s.slug).length} verified colleges`,
              }))}
            />
          </Section>
          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>
          <MbaConversion intent="MBA specialisations enquiry" formId="mba_specialisations_hub" />
        </Container>
      </PageShell>
    </>
  );
}
