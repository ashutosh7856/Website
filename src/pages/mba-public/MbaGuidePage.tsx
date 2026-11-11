import { Link, Navigate, useLocation } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Container,
  FaqList,
  Hero,
  LinkCards,
  LinkChips,
  MbaConversion,
  PageShell,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { GUIDE_TOOL_PATHS, MBA_GUIDES, getGuide, type MbaGuide } from "@/content/mbaGuides";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, formatDay, isPublished, mbaCrumbs } from "@/lib/mbaPublic";
import { MBA_PATHS } from "@/lib/mbaRoutes.mjs";
import { stripTrailingSlash } from "@/lib/siteUrl.mjs";

function Guide({ g }: { g: MbaGuide }) {
  const inResources = g.path.startsWith(`${MBA_PATHS.resources}/`);
  const crumbs = inResources ? mbaCrumbs({ name: "Resources", to: MBA_PATHS.resources }, { name: g.h1.split(":")[0] }) : mbaCrumbs({ name: g.h1.split(":")[0] });
  const others = MBA_GUIDES.filter((x) => x.path !== g.path).slice(0, 6);

  return (
    <>
      <PageSEO
        title={g.seoTitle}
        description={g.description}
        canonical={g.path}
        type="article"
        jsonLd={[
          articleJsonLd({ headline: g.h1, description: g.description, path: g.path, dateModified: g.updated }),
          breadcrumbJsonLd(crumbs, g.path),
          ...(g.faqs.length ? [faqJsonLd(g.faqs)] : []),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} eyebrow="MBA guide" title={g.h1} answer={<p>{g.answer}</p>} updated={formatDay(g.updated)} officialData={false} />

        <Container className="mt-8 space-y-12">
          {g.sections.map((s) => {
            const links = (s.links ?? []).filter((l) => isPublished(l.to) || l.to === MBA_PATHS.counselling || GUIDE_TOOL_PATHS.includes(l.to));
            return (
              <Section key={s.h2} title={s.h2}>
                <div className="max-w-3xl space-y-3 text-[14.5px] leading-7 text-slate-700">
                  {(s.paragraphs ?? []).map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                  {s.bullets && (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {s.table && (
                  <div className="mt-4">
                    <TableWrap caption={s.table.caption}>
                      <thead>
                        <tr>
                          {s.table.head.map((h) => (
                            <Th key={h}>{h}</Th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((r) => (
                          <tr key={r.join("|")}>
                            {r.map((c, i) => (
                              <Td key={i} className={i === 0 ? "font-medium" : "text-[13.5px]"}>
                                {c}
                              </Td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  </div>
                )}
                {links.length > 0 && (
                  <div className="mt-4">
                    <LinkChips label={`Related to ${s.h2}`} items={links} />
                  </div>
                )}
              </Section>
            );
          })}

          {g.faqs.length > 0 && (
            <Section id="faq" title="Frequently asked questions">
              <FaqList faqs={g.faqs} />
            </Section>
          )}

          <SourcesList
            sources={g.sources}
            intro={
              <>
                This guide is written and reviewed by ProCounsel. Figures in it come from these official documents; the rest is
                our counselling team&rsquo;s explanation.
              </>
            }
          />

          <Section id="more" title="More MBA guides">
            <LinkCards label="More MBA guides" items={others.map((o) => ({ to: o.path, label: o.h1, detail: o.cardDetail }))} />
            <p className="mt-3 text-[13.5px]">
              <Link to={MBA_PATHS.hub} className="font-medium text-[#2F43F2] hover:underline">
                MBA Admission Guide 2027
              </Link>
            </p>
          </Section>

          <MbaConversion intent={`${g.h1} (guide) enquiry`} formId="mba_guide_page" />
        </Container>
      </PageShell>
    </>
  );
}

/** Every guide path routes here; the content registry decides what exists. */
export default function MbaGuidePage() {
  const { pathname } = useLocation();
  const g = getGuide(stripTrailingSlash(pathname));
  if (!g || !isPublished(g.path)) return <Navigate to={MBA_PATHS.resources} replace />;
  return <Guide g={g} />;
}
