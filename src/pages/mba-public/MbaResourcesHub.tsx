import PageSEO from "@/components/SEO/PageSEO";
import { Container, Hero, LinkCards, MbaConversion, PageShell, Section } from "@/components/mba-public/MbaPublicUi";
import { MBA_GUIDES } from "@/content/mbaGuides";
import { LAST_VERIFIED_ISO, articleJsonLd, breadcrumbJsonLd, isPublished, itemListJsonLd, mbaCrumbs } from "@/lib/mbaPublic";
import { MBA_PATHS, examPath, percentilePath } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.resources;
const CRUMBS = mbaCrumbs({ name: "Resources" });
const TITLE = "MBA Resources: Guides to Exams, Colleges and Admission";
const DESCRIPTION =
  "Free MBA and CAT guides: CAT preparation, syllabus, VARC, DILR and Quant, XAT, SNAP and NMAT, MBA vs PGDM, choosing a college and admission.";

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
  { to: MBA_PATHS.scoreCalculator, label: "CAT score calculator", detail: "Raw score by section, official marking" },
  { to: percentilePath(90), label: "MBA colleges by CAT percentile", detail: "Which published figures your percentile clears" },
  { to: MBA_PATHS.freeMocks, label: "Free CAT mock tests", detail: "Full-length and sectional, with solutions" },
  { to: MBA_PATHS.pyqPapers, label: "CAT previous year papers", detail: "Actual papers as free timed tests in the app" },
  { to: MBA_PATHS.compare, label: "Compare MBA colleges", detail: "Up to four institutes side by side" },
  { to: MBA_PATHS.roiCalculator, label: "MBA fees & ROI calculator", detail: "EMI, total cost and payback" },
  { to: MBA_PATHS.deadlines, label: "MBA admission deadlines 2027", detail: "Official application and exam dates" },
  { to: MBA_PATHS.eligibility, label: "MBA eligibility", detail: "Degree and marks each exam asks for" },
  { to: MBA_PATHS.courses, label: "MBA courses", detail: "MBA, PGDM, MMS and formats compared" },
];

export default function MbaResourcesHub() {
  const guides = MBA_GUIDES.filter((g) => isPublished(g.path));
  const prep = guides.filter((g) => g.group === "prep");
  const admission = guides.filter((g) => g.group !== "prep");
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
              Plain-language guides to preparing for CAT, XAT, SNAP and NMAT, and to the decisions behind an MBA — whether
              to do one, MBA or PGDM, which exams to take, how to choose and what admission involves — plus free tools and
              data pages built only from official documents. Start with the question you are stuck on.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          {prep.length > 0 && (
            <Section id="preparation" title="How do you prepare for CAT and other MBA exams?">
              <LinkCards label="Exam preparation guides" items={prep.map((g) => ({ to: g.path, label: g.h1, detail: g.cardDetail }))} />
            </Section>
          )}
          <Section id="guides" title="Which MBA questions do these guides answer?">
            <LinkCards label="MBA guides" items={admission.map((g) => ({ to: g.path, label: g.h1, detail: g.cardDetail }))} />
          </Section>
          <Section id="data" title="Which free tools and official data pages can you use?">
            <LinkCards label="MBA data pages" items={data} />
          </Section>
          <MbaConversion intent="MBA resources enquiry" formId="mba_resources_hub" />
        </Container>
      </PageShell>
    </>
  );
}
