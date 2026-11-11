import PageSEO from "@/components/SEO/PageSEO";
import { Container, Hero, LinkCards, MbaConversion, PageShell, Section } from "@/components/mba-public/MbaPublicUi";
import { MBA_GUIDES } from "@/content/mbaGuides";
import { LAST_VERIFIED_ISO, articleJsonLd, breadcrumbJsonLd, isPublished, itemListJsonLd, mbaCrumbs } from "@/lib/mbaPublic";
import { MBA_PATHS, examPath } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.resources;
const CRUMBS = mbaCrumbs({ name: "Resources" });
const TITLE = "MBA Resources: Guides to Exams, Colleges and Admission";
const DESCRIPTION =
  "Free MBA guides from ProCounsel: MBA vs PGDM, choosing a college, MBA without CAT, the admission process, fees and placements, with official data.";

const DATA_PAGES = [
  { to: MBA_PATHS.hub, label: "MBA Admission Guide 2027", detail: "Exams, dates, colleges and the process" },
  { to: MBA_PATHS.colleges, label: "Best MBA colleges in India", detail: "NIRF ranking and verified profiles" },
  { to: MBA_PATHS.iimCutoffs, label: "IIM CAT cut-offs", detail: "Official minimums by category" },
  { to: MBA_PATHS.fees, label: "MBA fees compared", detail: "From each institute's fee document" },
  { to: MBA_PATHS.placements, label: "MBA placements compared", detail: "Median salaries from official reports" },
  { to: MBA_PATHS.exams, label: "MBA entrance exams", detail: "CAT, XAT, SNAP, NMAT and more" },
  { to: examPath("cat"), label: "CAT exam pattern and dates", detail: "From the CAT Centre's notices" },
  { to: MBA_PATHS.specialisations, label: "MBA specialisations", detail: "What each covers and where it is offered" },
  { to: MBA_PATHS.predictor, label: "CAT college predictor", detail: "Your percentile against IIM minimums" },
  { to: MBA_PATHS.compare, label: "Compare MBA colleges", detail: "Up to four institutes side by side" },
  { to: MBA_PATHS.roiCalculator, label: "MBA fees & ROI calculator", detail: "EMI, total cost and payback" },
  { to: MBA_PATHS.deadlines, label: "MBA admission deadlines 2027", detail: "Official application and exam dates" },
  { to: MBA_PATHS.eligibility, label: "MBA eligibility", detail: "Degree and marks each exam asks for" },
  { to: MBA_PATHS.courses, label: "MBA courses", detail: "MBA, PGDM, MMS and formats compared" },
];

export default function MbaResourcesHub() {
  const guides = MBA_GUIDES.filter((g) => isPublished(g.path));
  const data = DATA_PAGES.filter((d) => isPublished(d.to));
  return (
    <>
      <PageSEO
        title="MBA Resources: Free Guides and Official Data"
        description={DESCRIPTION}
        canonical={PATH}
        jsonLd={[
          articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: PATH, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(CRUMBS, PATH),
          itemListJsonLd("MBA guides", guides.map((g) => ({ name: g.h1, path: g.path }))),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA resources"
          title={TITLE}
          officialData={false}
          answer={
            <p>
              Plain-language guides to the decisions behind an MBA — whether to do one, MBA or PGDM, which exams to take,
              how to choose and what admission involves — and data pages built only from official documents: cut-offs,
              fees, placements and exam patterns. Start with the question you are stuck on.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Section id="guides" title="Which MBA questions do these guides answer?">
            <LinkCards label="MBA guides" items={guides.map((g) => ({ to: g.path, label: g.h1, detail: g.cardDetail }))} />
          </Section>
          <Section id="data" title="Where can you check official MBA data?">
            <LinkCards label="MBA data pages" items={data} />
          </Section>
          <MbaConversion intent="MBA resources enquiry" formId="mba_resources_hub" />
        </Container>
      </PageShell>
    </>
  );
}
