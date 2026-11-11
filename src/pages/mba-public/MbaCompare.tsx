import { useEffect, useId, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import { SrcLink } from "@/components/mba-public/CollegeTable";
import {
  Card,
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
import type { OfficialSource } from "@/api/mba";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import {
  ALL_COLLEGES,
  CUTOFF_KIND_LABEL,
  LAST_VERIFIED,
  LAST_VERIFIED_ISO,
  MBA_SNAPSHOT_NOT_PUBLISHED,
  NIRF,
  breadcrumbJsonLd,
  faqJsonLd,
  flagship,
  formatInr,
  institutePath,
  isPublished,
  mbaCrumbs,
  nirfFor,
  percentileRows,
  pct,
  type Faq,
  type PercentileRow,
} from "@/lib/mbaPublic";
import {
  COMPARE_PARAM,
  DEFAULT_COMPARE,
  MAX_COMPARE,
  addToSelection,
  compareSearch,
  compareShareUrl,
  removeFromSelection,
  selectionFromSearch,
} from "@/lib/mbaCompare";
import { MBA_EXAMS, MBA_PATHS } from "@/lib/mbaRoutes.mjs";
import { absoluteUrl } from "@/lib/siteUrl.mjs";

const PATH = MBA_PATHS.compare;
const CRUMBS = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: "Compare colleges" });
const VALID = new Set(ALL_COLLEGES.map((c) => c.slug));
const BY_SLUG = new Map(ALL_COLLEGES.map((c) => [c.slug, c]));
const IIMS = ALL_COLLEGES.filter((c) => c.group === "IIM");
const OTHERS = ALL_COLLEGES.filter((c) => c.group !== "IIM");
const GENERAL_ROWS = percentileRows("General");
const NOT_PUBLISHED = new Set(MBA_SNAPSHOT_NOT_PUBLISHED.map((x) => x.profileSlug).filter(Boolean));

const examShort = (id: string) => MBA_EXAMS.find((e) => e.id === id)?.short ?? id.toUpperCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const names = (slugs: string[]) => slugs.map((s) => BY_SLUG.get(s)?.shortName ?? s);

/** The institute's first (flagship-programme) General CAT figure, with its stage and batch. */
function catFigure(c: MbaCollege): PercentileRow | undefined {
  return GENERAL_ROWS.find((r) => r.slug === c.slug);
}

const FAQS: Faq[] = [
  {
    q: "Where do the figures in this comparison come from?",
    a: "Every figure is from the institute's own documents (admission policy, fee page, placement report), the CAT Centre or the NIRF 2025 Management ranking, and each cell links to its source. Where an institute does not publish a figure, the cell says so instead of filling the gap.",
  },
  {
    q: "Why do you compare median salaries and not average packages?",
    a: "The median is the salary of the middle graduate, so a few very large offers cannot pull it up. We show only medians, with the graduating year, and never mix them with averages or highest packages. A past batch's median is not a promise about yours.",
  },
  {
    q: "Is the CAT figure in the table the cut-off for admission?",
    a: "No. Each figure is labelled with its stage: most are the minimum percentile to be considered at the first shortlisting stage. Interview calls usually close higher, and the final offer depends on a composite of CAT, academics, work experience and the WAT/GD/PI. Meeting a published figure never guarantees a call or admission.",
  },
  {
    q: "Why are some fees much higher than others?",
    a: "Institutes quote different things: some include hostel, food or a laptop in one total, some quote tuition only. Read the note under each fee before comparing, and compare total programme fees rather than first-year fees.",
  },
  {
    q: "Can I share my comparison?",
    a: `Yes. The page address keeps the colleges you picked (up to ${MAX_COMPARE}), so copying it or using the WhatsApp button shares the same comparison.`,
  },
];

/** A cell: the value, an optional note and the source link. */
function Cell({ children, note, source, label }: { children: ReactNode; note?: string | null; source?: OfficialSource | null; label: string }) {
  return (
    <>
      <span className="font-semibold tabular-nums text-[#0E1629]">{children}</span>
      {source && <SrcLink url={source.url} label={label} />}
      {note && <span className="mt-1 block text-[12px] leading-5 text-slate-500">{note}</span>}
    </>
  );
}

const Missing = ({ children = "Not published" }: { children?: ReactNode }) => <span className="text-slate-400">{children}</span>;

function CompareTable({ colleges }: { colleges: MbaCollege[] }) {
  const rows: { label: string; render: (c: MbaCollege) => ReactNode }[] = [
    {
      label: "Type",
      render: (c) =>
        c.group === "IIM" ? (
          <span className="font-semibold">IIM{c.ownership ? ` · ${cap(c.ownership)}` : ""}</span>
        ) : c.ownership ? (
          <span className="font-semibold">{cap(c.ownership)}</span>
        ) : (
          <Missing>Not in our data</Missing>
        ),
    },
    { label: "City", render: (c) => (c.city ? <span>{[c.city, c.state].filter(Boolean).join(", ")}</span> : <Missing />) },
    {
      label: "Exams accepted",
      render: (c) =>
        c.acceptedExams.length ? (
          <Cell source={c.acceptedExamsSource} label={`${c.shortName} exams`}>
            {c.acceptedExams.map(examShort).join(", ")}
          </Cell>
        ) : (
          <Missing>Not in our data</Missing>
        ),
    },
    {
      label: "Total programme fee",
      render: (c) => {
        const p = flagship(c);
        return p?.feeTotal != null && p.feeSource ? (
          <Cell source={p.feeSource} note={[p.code, p.feeNote].filter(Boolean).join(" · ")} label={`${c.shortName} fee`}>
            {formatInr(p.feeTotal)}
          </Cell>
        ) : (
          <Missing />
        );
      },
    },
    {
      label: "Median salary",
      render: (c) => {
        const p = flagship(c);
        return p?.medianSalary != null && p.salarySource ? (
          <Cell source={p.salarySource} note={p.salaryNote} label={`${c.shortName} median salary`}>
            {formatInr(p.medianSalary)} a year{p.medianSalaryYear ? ` (${p.medianSalaryYear})` : ""}
          </Cell>
        ) : (
          <Missing>No official median published</Missing>
        );
      },
    },
    {
      label: "Intake",
      render: (c) => {
        const p = flagship(c);
        return p?.intake != null && p.intakeSource ? (
          <Cell source={p.intakeSource} note={p.intakeNote} label={`${c.shortName} intake`}>
            {p.intake} seats
          </Cell>
        ) : (
          <Missing />
        );
      },
    },
    {
      label: "Published CAT figure (General)",
      render: (c) => {
        const r = catFigure(c);
        if (r) {
          const rec = r.records.find((x) => !x.gender) ?? r.records[0];
          const sectional = [rec.varc, rec.dilr, rec.qa].some((v) => v !== null) ? ` · ${[rec.varc, rec.dilr, rec.qa].map(pct).join(" / ")}` : "";
          return (
            <Cell source={r.source} note={`${CUTOFF_KIND_LABEL[r.kind]}, ${r.batch}${r.records.length > 1 ? " (varies by gender; see profile)" : ""}. Not an admission cut-off.`} label={`${c.shortName} CAT figure`}>
              {rec.overall !== null ? `${rec.overall} percentile` : "Sectional only"}
              <span className="font-normal text-slate-500">{sectional}</span>
            </Cell>
          );
        }
        const composite = c.facts.find((f) => /composite|index/i.test(`${f.value} ${f.note ?? ""}`));
        if (composite) {
          return (
            <Cell source={composite.source} note={composite.note} label={`${c.shortName} shortlisting score`}>
              {composite.value}
            </Cell>
          );
        }
        return <Missing>{NOT_PUBLISHED.has(c.slug) ? "Publishes no official CAT cut-off" : "Not published"}</Missing>;
      },
    },
    {
      label: `NIRF ${NIRF?.year ?? ""} rank (Management)`,
      render: (c) => {
        const n = nirfFor(c);
        return n && NIRF ? (
          <Cell source={NIRF.source} label={`${c.shortName} NIRF`}>
            {n.rank}
          </Cell>
        ) : (
          <Missing>Not in the top 100</Missing>
        );
      },
    },
    {
      label: "Selection process",
      render: (c) =>
        c.selectionProcess.length ? (
          <>
            <ol className="list-decimal space-y-0.5 pl-4 text-[12.5px] leading-5 text-slate-700">
              {c.selectionProcess.map((st) => (
                <li key={st.stage}>
                  {st.name}
                  {st.weightage ? <span className="text-slate-500"> ({st.weightage})</span> : null}
                </li>
              ))}
            </ol>
            <SrcLink url={c.selectionSource?.url} label={`${c.shortName} selection process`} />
          </>
        ) : c.group === "IIM" ? (
          <span className="text-[12.5px] leading-5 text-slate-600">
            CAT-based shortlisting, then the IIM&rsquo;s own WAT/PI and composite score, per its admission policy
            <SrcLink url={c.cutoffs[0]?.source.url} label={`${c.shortName} admission policy`} />
          </span>
        ) : (
          <Missing>Not in our data</Missing>
        ),
    },
  ];
  return (
    <TableWrap caption={`Comparison of ${names(colleges.map((c) => c.slug)).join(", ")}`}>
      <thead>
        <tr>
          <Th className="w-[170px]">
            <span className="sr-only">Detail</span>
          </Th>
          {colleges.map((c) => (
            <Th key={c.slug} className="min-w-[200px] normal-case tracking-normal">
              <Link to={institutePath(c.slug)} className="font-[Poppins] text-[14px] font-semibold text-[#2F43F2] hover:underline">
                {c.shortName}
              </Link>
              <span className="block text-[11.5px] font-normal text-slate-500">{flagship(c)?.code}</span>
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <Td className="font-medium text-slate-600">{row.label}</Td>
            {colleges.map((c) => (
              <Td key={c.slug} className="text-[13px]">
                {row.render(c)}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function Picker({ selected, onAdd, onRemove }: { selected: string[]; onAdd: (slug: string) => void; onRemove: (slug: string) => void }) {
  const id = useId();
  const full = selected.length >= MAX_COMPARE;
  const option = (c: MbaCollege) => (
    <option key={c.slug} value={c.slug} disabled={selected.includes(c.slug)}>
      {c.shortName}
      {c.city ? ` (${c.city})` : ""}
    </option>
  );
  return (
    <div>
      <ul className="flex flex-wrap gap-2" aria-label="Colleges being compared">
        {selected.map((slug) => (
          <li key={slug}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2F43F2]/30 bg-[#2F43F2]/5 py-1.5 pl-3 pr-1.5 text-[13px] font-medium text-[#0E1629]">
              {BY_SLUG.get(slug)?.shortName}
              <button
                type="button"
                onClick={() => onRemove(slug)}
                aria-label={`Remove ${BY_SLUG.get(slug)?.shortName} from the comparison`}
                className="cursor-pointer rounded p-0.5 text-slate-500 hover:bg-white hover:text-[#2F43F2]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 max-w-md">
        <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
          {full ? `You are comparing ${MAX_COMPARE} colleges, the most at once. Remove one to add another.` : `Add a college (up to ${MAX_COMPARE})`}
        </label>
        <select
          id={id}
          value=""
          disabled={full}
          onChange={(e) => e.target.value && onAdd(e.target.value)}
          className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <option value="">Choose an institute…</option>
          <optgroup label="IIMs">{IIMS.map(option)}</optgroup>
          <optgroup label="Other MBA colleges">{OTHERS.map(option)}</optgroup>
        </select>
      </div>
    </div>
  );
}

export default function MbaCompare() {
  const location = useLocation();
  const navigate = useNavigate();
  // The prerendered HTML is always the default example; the URL's own list is applied after mount.
  const [selected, setSelected] = useState<string[]>(() => DEFAULT_COMPARE.filter((s) => VALID.has(s)));
  useEffect(() => {
    // "?c=" is an emptied comparison; no parameter at all is the example.
    const emptied = new URLSearchParams(location.search).get(COMPARE_PARAM) === "";
    setSelected(emptied ? [] : selectionFromSearch(location.search, VALID));
  }, [location.search]);

  const update = (next: string[]) => {
    setSelected(next);
    navigate({ pathname: PATH, search: next.length ? compareSearch(next) : `?${COMPARE_PARAM}=` }, { replace: true });
  };

  const colleges = selected.map((s) => BY_SLUG.get(s)).filter((c): c is MbaCollege => !!c);
  const shortNames = colleges.map((c) => c.shortName);
  const shareText = `Comparing ${shortNames.join(" vs ")} on official fees, median salaries, CAT figures and NIRF rank:`;
  const sources = colleges.flatMap((c) => [
    ...[flagship(c)?.feeSource, flagship(c)?.salarySource, flagship(c)?.intakeSource, c.acceptedExamsSource, c.selectionSource, catFigure(c)?.source].filter(
      (s): s is OfficialSource => !!s,
    ),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "MBA College Comparison",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: absoluteUrl(PATH),
      description: `Compares up to ${MAX_COMPARE} of ${ALL_COLLEGES.length} MBA institutes side by side on official fees, median salaries, intake, published CAT figures and NIRF rank.`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      ...(LAST_VERIFIED_ISO ? { dateModified: LAST_VERIFIED_ISO } : {}),
    },
    faqJsonLd(FAQS),
    breadcrumbJsonLd(CRUMBS, PATH),
  ];

  return (
    <>
      <PageSEO
        title="Compare MBA Colleges: Fees, Salary, Cut-offs"
        description={`Compare up to ${MAX_COMPARE} MBA colleges side by side: total fee, median salary, intake, CAT minimum, NIRF rank and selection process, all from official sources.`}
        canonical={PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          lead={false}
          crumbs={CRUMBS}
          eyebrow="Free tool · no login"
          title="Compare MBA Colleges Side by Side: Fees, Placements and CAT Figures"
          answer={
            <p>
              Pick up to {MAX_COMPARE} of the {ALL_COLLEGES.length} institutes we have verified ({IIMS.length} IIMs and{" "}
              {OTHERS.length} other colleges) to see their total fee, median salary with its year, intake, published
              General-category CAT figure with its stage, NIRF {NIRF?.year} rank and selection process in one table.
              Every cell links to the institute&rsquo;s own document; gaps say &ldquo;not published&rdquo;.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          <Card>
            <h2 className="font-[Poppins] text-[18px] font-semibold">Choose colleges to compare</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              The table starts with an example ({names(DEFAULT_COMPARE).join(", ")}). Remove or add institutes; the page
              address updates so you can share it.
            </p>
            <div className="mt-4">
              <Picker selected={selected} onAdd={(s) => update(addToSelection(selected, s))} onRemove={(s) => update(removeFromSelection(selected, s))} />
            </div>
          </Card>

          <Section
            id="comparison"
            title={colleges.length ? `How do ${shortNames.join(", ")} compare?` : "Pick at least one college"}
            lead={
              <p>
                Flagship programme of each institute. Fees are totals for the whole programme as each institute states them;
                salaries are medians of the graduating year shown. Swipe sideways on a phone.
              </p>
            }
          >
            {colleges.length > 0 ? (
              <>
                <CompareTable colleges={colleges} />
                <p className="mt-2 text-[12.5px] text-slate-500">
                  &ldquo;source&rdquo; links open the official document behind each figure. Last verified {LAST_VERIFIED}.
                </p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${compareShareUrl(selected)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Share this comparison on WhatsApp
                </a>
              </>
            ) : (
              <Card>
                <p className="text-[14px] text-slate-600">Add a college above to start the comparison.</p>
              </Card>
            )}
          </Section>

          {colleges.length > 0 && (
            <QuickLeadForm
              intent={`MBA college comparison: ${shortNames.join(", ")}`}
              course="MBA"
              exam="CAT"
              formId="mba_compare_result"
              heading="Not sure which of these fits you?"
              subheading="A ProCounsel MBA counsellor can weigh these colleges against your score, academics and work experience. Free call, no login needed. We guide; the institute decides admission."
            />
          )}

          <Section id="how-to-read" title="How should you read this comparison?">
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
              <li>
                <strong>Fees</strong> cover different things at different institutes (hostel, food, laptop). The note under
                each fee says what is included.
              </li>
              <li>
                <strong>Median salaries</strong> describe a past graduating batch and are never averages. They do not predict
                your salary.
              </li>
              <li>
                <strong>CAT figures</strong> carry their stage. A minimum to apply is not the percentile at which interview
                calls close, and composite or index scores are shown as such, never as CAT percentiles.
              </li>
              <li>
                <strong>Missing figures</strong> mean the institute does not publish them in a document we could verify, not
                that they are zero.
              </li>
            </ul>
            <div className="mt-4">
              <LinkChips
                label="Related"
                items={[
                  { to: MBA_PATHS.fees, label: "MBA fees compared" },
                  { to: MBA_PATHS.placements, label: "MBA placements compared" },
                  { to: MBA_PATHS.roiCalculator, label: "MBA fees & ROI calculator" },
                  { to: MBA_PATHS.iimCutoffs, label: "IIM CAT cut-offs" },
                ].filter((x) => isPublished(x.to))}
              />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <RelatedMbaPages current={PATH} />

          <MbaConversion intent="MBA college comparison enquiry" formId="mba_compare_page" />

          <SourcesList sources={[...sources, ...(NIRF ? [NIRF.source] : [])]} />
        </Container>
      </PageShell>
    </>
  );
}
