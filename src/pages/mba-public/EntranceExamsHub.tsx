import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Container,
  FaqList,
  Hero,
  LinkCards,
  MbaConversion,
  PageShell,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_EXAM_OVERVIEW } from "@/content/mbaExamsOverview";
import {
  CAT_2026_KEY_DATES,
  CAT_LATEST,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  examInfo,
  faqJsonLd,
  isPublished,
  itemListJsonLd,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_EXAMS, MBA_PATHS, examPath } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.exams;
const CRUMBS = mbaCrumbs({ name: "Entrance exams" });
const TITLE = "MBA Entrance Exams 2027: CAT, XAT, SNAP, NMAT and More";
const DESCRIPTION =
  "MBA entrance exams for 2027 admission: CAT, XAT, SNAP, NMAT, CMAT, MAH-CET, MAT and GMAT — who conducts each, exam dates and which colleges use them.";

/** "Exam date" or the first date that looks like the test itself. */
function examDay(id: string): string | null {
  if (id === "cat") return CAT_2026_KEY_DATES.find((d) => d.label === "Exam date")?.value.split(",").slice(0, 2).join(",") ?? null;
  const e = examInfo(id);
  const d = e?.dates.find((x) => /exam|test date|test window|slot/i.test(x.label) && !/admit|registration/i.test(x.label));
  return d ? `${d.value}${d.tentative ? " (tentative)" : ""}` : null;
}

const FAQS: Faq[] = [
  {
    q: "Which is the most important MBA entrance exam in India?",
    a: "CAT. All the IIMs and most top B-schools use it. The other exams matter for the specific institutes that rely on them — XAT for XLRI, SNAP for Symbiosis, NMAT for NMIMS and MAH-CET for MBA/MMS seats in Maharashtra.",
  },
  {
    q: "How many MBA entrance exams should I take?",
    a: "Usually two or three: CAT plus the exams your shortlisted colleges use. Taking every exam spreads your preparation thin, and the scores only help if you would join the colleges that read them.",
  },
  {
    q: "Can I use one exam score for many colleges?",
    a: "Yes. A CAT score is accepted by the IIMs and by many other institutes, and CMAT and MAT scores are accepted widely by AICTE-approved and private colleges. Each college still runs its own application and selection.",
  },
];

export default function EntranceExamsHub() {
  const published = MBA_EXAMS.filter((e) => isPublished(examPath(e.id)));
  const jsonLd = [
    articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: PATH, dateModified: LAST_VERIFIED_ISO }),
    breadcrumbJsonLd(CRUMBS, PATH),
    itemListJsonLd("MBA entrance exams", published.map((e) => ({ name: `${e.short} — ${e.name}`, path: examPath(e.id) }))),
    faqJsonLd(FAQS),
  ];
  const sources = [CAT_LATEST.source, ...MBA_EXAMS.flatMap((e) => examInfo(e.id)?.sources.slice(0, 1) ?? [])];

  return (
    <>
      <PageSEO title="MBA Entrance Exams 2027: CAT, XAT, SNAP, NMAT" description={DESCRIPTION} canonical={PATH} jsonLd={jsonLd} />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA entrance exams"
          title={TITLE}
          answer={
            <p>
              Eight entrance exams cover almost every MBA seat in India. CAT is the one the IIMs and most top B-schools use;
              XAT, SNAP and NMAT lead to XLRI, Symbiosis and NMIMS; CMAT and MAT are accepted by many AICTE-approved and
              private colleges; MAH-CET fills Maharashtra&rsquo;s MBA/MMS seats; GMAT covers international and some Indian
              programmes. Choose by the colleges you want.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          <Section id="compare" title="How do the MBA entrance exams compare?">
            <TableWrap caption="MBA entrance exams compared">
              <thead>
                <tr>
                  <Th>Exam</Th>
                  <Th>Conducted by</Th>
                  <Th>Next test</Th>
                  <Th>Used for</Th>
                </tr>
              </thead>
              <tbody>
                {MBA_EXAMS.map((e) => {
                  const o = MBA_EXAM_OVERVIEW.find((x) => x.id === e.id);
                  return (
                    <tr key={e.id}>
                      <Td>
                        {isPublished(examPath(e.id)) ? (
                          <Link to={examPath(e.id)} className="font-semibold text-[#2F43F2] hover:underline">
                            {e.short}
                          </Link>
                        ) : (
                          <strong>{e.short}</strong>
                        )}
                        <span className="block text-[12px] text-slate-500">{e.name}</span>
                      </Td>
                      <Td className="text-[13px]">{o?.conductedBy}</Td>
                      <Td className="text-[13px]">{examDay(e.id) ?? "See the official site"}</Td>
                      <Td className="text-[13px]">{o?.usedFor}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
            <p className="mt-2 text-[12.5px] text-slate-500">Test dates are from each exam body&rsquo;s official notice, linked on the exam&rsquo;s page.</p>
          </Section>

          <Section id="which" title="Which MBA entrance exam should you take?">
            <ul className="max-w-3xl space-y-2 text-[14px] leading-7 text-slate-700">
              {MBA_EXAM_OVERVIEW.map((o) => {
                const e = MBA_EXAMS.find((x) => x.id === o.id)!;
                return (
                  <li key={o.id}>
                    <strong>{e.short}:</strong> {o.whenToConsider}
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section id="guides" title="What should you read next?">
            <LinkCards
              label="Exam guides"
              items={[
                ...published.map((e) => ({ to: examPath(e.id), label: `${e.short} exam guide`, detail: e.name })),
                { to: "/mba-resources/cat-vs-xat-vs-snap-vs-nmat", label: "CAT vs XAT vs SNAP vs NMAT", detail: "Which exams to take" },
                { to: "/mba-without-cat", label: "MBA without CAT", detail: "Other exams and direct admission" },
                { to: MBA_PATHS.eligibility, label: "MBA eligibility", detail: "Degree and marks each exam asks for" },
                { to: MBA_PATHS.deadlines, label: "MBA admission deadlines 2027", detail: "Official application and exam dates" },
              ].filter((x) => isPublished(x.to))}
            />
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <SourcesList sources={sources} />

          <MbaConversion intent="MBA entrance exams enquiry" formId="mba_exams_hub" />
        </Container>
      </PageShell>
    </>
  );
}
