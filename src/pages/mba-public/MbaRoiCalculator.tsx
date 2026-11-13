import { useId, useRef, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import { trackEvent } from "@/lib/analytics";
import { SrcLink } from "@/components/mba-public/CollegeTable";
import {
  Card,
  Cite,
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
import type { ProgramDetail } from "@/api/mba";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import {
  ALL_COLLEGES,
  LAST_VERIFIED_ISO,
  breadcrumbJsonLd,
  faqJsonLd,
  formatInr,
  formatLakh,
  institutePath,
  isPublished,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { cleanAmount, computeRoi, roiShareSummary, validateRoi, type RoiDraft, type RoiErrors, type RoiField, type RoiResult } from "@/lib/mbaRoi";
import { comparePath } from "@/lib/mbaCompare";
import { MBA_PATHS } from "@/lib/mbaRoutes.mjs";
import { absoluteUrl } from "@/lib/siteUrl.mjs";

const PATH = MBA_PATHS.roiCalculator;
const CRUMBS = mbaCrumbs({ name: "MBA fees", to: MBA_PATHS.fees }, { name: "Fees & ROI calculator" });

interface Choice {
  key: string;
  college: MbaCollege;
  program: ProgramDetail;
}

/** Every programme with an officially sourced total fee. */
const CHOICES: Choice[] = ALL_COLLEGES.flatMap((college) =>
  college.programs
    .filter((p) => p.feeTotal !== null && p.feeSource)
    .map((program) => ({ key: `${college.slug}:${program.code}`, college, program })),
);
const choiceLabel = (c: Choice) => (c.college.programs.length > 1 ? `${c.college.shortName} (${c.program.code})` : c.college.shortName);
/** Programmes with both a sourced fee and a sourced median, for the reference table. */
const WITH_BOTH = CHOICES.filter((c) => c.program.medianSalary !== null && c.program.salarySource).sort(
  (a, b) => a.program.feeTotal! / a.program.medianSalary! - b.program.feeTotal! / b.program.medianSalary!,
);

const EMPTY: RoiDraft = { fee: "", living: "", loanAmount: "", annualRatePct: "", tenureYears: "", salary: "" };

const FAQS: Faq[] = [
  {
    q: "How is the EMI calculated?",
    a: "With the standard reducing-balance formula banks use: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly interest rate (annual rate ÷ 12 ÷ 100) and n the number of monthly instalments. Your bank's figure can differ if it charges interest during the course (moratorium), fees or a floating rate.",
  },
  {
    q: "What does 'simple payback' mean here?",
    a: "The number of months of gross (pre-tax) salary that add up to the total cost: fee, your living-cost estimate and the loan interest. It ignores tax, your living expenses after the MBA, salary growth and the income you give up while studying, so the real time to recover the cost is longer. It is a rough yardstick for comparing options, not a forecast.",
  },
  {
    q: "Why is the salary prefilled with a median?",
    a: "Because it is the only salary figure institutes publish consistently. It is the median of a past graduating batch from the institute's own placement report, and the year is shown. Your salary may be higher or lower; change the figure to whatever you think is realistic.",
  },
  {
    q: "Where do the fees come from?",
    a: "From each institute's own fee document, linked under the figure. Fees cover different things (some include hostel and food), so read the note before comparing. You can always type your own figure instead.",
  },
  {
    q: "Do you store what I enter?",
    a: "No. The calculation runs in your browser and nothing you type into the calculator is sent anywhere. Sharing your phone number in the callback form is optional.",
  },
];

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15";
const labelClass = "mb-1.5 block text-[12.5px] font-medium text-slate-600";

const FIELDS: { field: RoiField; label: string; placeholder: string; hint?: string; numeric?: "decimal" | "numeric" }[] = [
  { field: "fee", label: "Total programme fee (₹)", placeholder: "e.g. 2500000" },
  { field: "living", label: "Living and other costs over the programme (₹)", placeholder: "0", hint: "Your own estimate for rent, food, travel and books if the fee does not cover them. Left blank, it counts as 0." },
  { field: "loanAmount", label: "Education loan amount (₹)", placeholder: "0", hint: "Leave blank if you are not borrowing." },
  { field: "annualRatePct", label: "Loan interest rate (% a year)", placeholder: "e.g. 10", hint: "From your bank's offer letter.", numeric: "decimal" },
  { field: "tenureYears", label: "Repayment tenure (years)", placeholder: "e.g. 7", numeric: "decimal" },
  { field: "salary", label: "Expected annual salary after the MBA (₹)", placeholder: "e.g. 1800000" },
];

function RoiForm({
  draft,
  errors,
  choice,
  onChoice,
  onChange,
  onSubmit,
}: {
  draft: RoiDraft;
  errors: RoiErrors;
  choice: Choice | undefined;
  onChoice: (key: string) => void;
  onChange: (field: RoiField, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const uid = useId();
  const p = choice?.program;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="max-w-xl">
        <label htmlFor={`${uid}-inst`} className={labelClass}>
          Start from an institute&rsquo;s official figures (optional)
        </label>
        <select
          id={`${uid}-inst`}
          value={choice?.key ?? ""}
          onChange={(e) => onChoice(e.target.value)}
          className={`${fieldClass} cursor-pointer`}
        >
          <option value="">Enter my own figures</option>
          {CHOICES.map((c) => (
            <option key={c.key} value={c.key}>
              {choiceLabel(c)}
            </option>
          ))}
        </select>
        {choice && p && (
          <div className="mt-2 space-y-1 text-[12.5px] leading-5 text-slate-600">
            <p>
              Fee: {formatInr(p.feeTotal)} for the whole programme{p.feeNote ? ` (${p.feeNote})` : ""}.{" "}
              <Cite source={p.feeSource} />
            </p>
            {p.medianSalary !== null && p.salarySource ? (
              <p>
                Salary prefilled with the <strong>median of the {p.medianSalaryYear ?? "latest reported"} graduating batch</strong>,{" "}
                {formatInr(p.medianSalary)} a year — a past batch&rsquo;s median, not a promise. Change it if you expect
                something else. <Cite source={p.salarySource} />
              </p>
            ) : (
              <p>{choice.college.shortName} publishes no official median salary for this programme; enter your own estimate.</p>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(({ field, label, placeholder, hint, numeric }) => (
          <div key={field}>
            <label htmlFor={`${uid}-${field}`} className={labelClass}>
              {label}
            </label>
            <input
              id={`${uid}-${field}`}
              type="text"
              inputMode={numeric ?? "numeric"}
              autoComplete="off"
              placeholder={placeholder}
              value={draft[field]}
              onChange={(e) => onChange(field, e.target.value)}
              aria-invalid={!!errors[field]}
              className={fieldClass}
            />
            {errors[field] ? (
              <p className="mt-1 text-[12px] text-red-600">{errors[field]}</p>
            ) : hint ? (
              <p className="mt-1 text-[11.5px] leading-4 text-slate-500">{hint}</p>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2335d0] sm:w-auto"
      >
        Calculate EMI and payback
      </button>
    </form>
  );
}

function ResultTable({ r }: { r: RoiResult }) {
  const rows: [string, string, string][] = [
    ["Monthly EMI", r.emi > 0 ? formatInr(r.emi) : "No loan", r.emi > 0 ? `${r.months} monthly instalments` : ""],
    ["Total loan repayment", r.totalRepayment > 0 ? formatInr(r.totalRepayment) : "—", "EMI × number of instalments"],
    ["Total interest paid", r.totalInterest > 0 ? formatInr(r.totalInterest) : "—", "Repayment minus the loan amount"],
    ["Paid from your own funds", formatInr(r.ownFunds), "Fee + living costs not covered by the loan"],
    ["Total cost of the MBA", formatInr(r.totalCost), "Fee + living costs + loan interest"],
    [
      "Simple payback",
      r.paybackMonths !== null ? `About ${r.paybackMonths} months` : "—",
      "Months of gross salary equal to the total cost (before tax and living expenses)",
    ],
    [
      "EMI as a share of monthly gross salary",
      r.emiShareOfSalaryPct !== null ? `${r.emiShareOfSalaryPct.toFixed(1)}%` : "—",
      "Before tax; your take-home share will be higher",
    ],
  ];
  return (
    <TableWrap caption="Your MBA cost and payback, from your inputs">
      <thead>
        <tr>
          <Th>Result</Th>
          <Th className="text-right">Figure</Th>
          <Th>How it is worked out</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value, how]) => (
          <tr key={label}>
            <Td className="font-medium">{label}</Td>
            <Td className="whitespace-nowrap text-right font-semibold tabular-nums">{value}</Td>
            <Td className="text-[12.5px] text-slate-600">{how}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function Calculator() {
  const [draft, setDraft] = useState<RoiDraft>(EMPTY);
  const [errors, setErrors] = useState<RoiErrors>({});
  const [choiceKey, setChoiceKey] = useState("");
  const [result, setResult] = useState<RoiResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const choice = CHOICES.find((c) => c.key === choiceKey);

  const onChoice = (key: string) => {
    setChoiceKey(key);
    const c = CHOICES.find((x) => x.key === key);
    if (!c) return;
    setDraft((d) => ({
      ...d,
      fee: String(c.program.feeTotal ?? ""),
      salary: c.program.medianSalary !== null && c.program.salarySource ? String(c.program.medianSalary) : "",
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const { input, errors: found } = validateRoi(draft);
    setErrors(found);
    if (!input) {
      setResult(null);
      return;
    }
    setResult(computeRoi(input));
    requestAnimationFrame(() => resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
  };

  const label = choice ? choiceLabel(choice) : "my own figures";
  return (
    <>
      <Card>
        <h2 className="font-[Poppins] text-[18px] font-semibold">Enter the fee, your loan and an expected salary</h2>
        <div className="mt-4">
          <RoiForm
            draft={draft}
            errors={errors}
            choice={choice}
            onChoice={onChoice}
            onChange={(f, v) => setDraft((d) => ({ ...d, [f]: cleanAmount(v) }))}
            onSubmit={submit}
          />
        </div>
      </Card>
      {result && (
        <div ref={resultRef} className="scroll-mt-24 space-y-8">
          <Section title="Your result, from your inputs">
            <ResultTable r={result} />
            <p className="mt-3 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] leading-6 text-amber-900">
              These figures are arithmetic on the numbers you entered, not a forecast. The salary is an assumption
              {choice?.program.medianSalary !== null && choice ? " (prefilled with a past batch's median)" : ""}; no institute or
              ProCounsel guarantees a placement or salary.
            </p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${roiShareSummary(result, label)} ${absoluteUrl(PATH)}?utm_source=whatsapp&utm_medium=share&utm_campaign=mba_roi_calculator`)}`}
              onClick={() => trackEvent("share", { method: "whatsapp", content_type: "tool_result", item_id: "mba_roi_calculator" })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Share on WhatsApp
            </a>
          </Section>
          <QuickLeadForm
            intent="MBA fees and ROI calculator result"
            course="MBA"
            exam="CAT"
            formId="mba_roi_calculator_result"
            heading="Want help weighing the cost of an MBA?"
            subheading="A ProCounsel MBA counsellor can go through fees, scholarships and loan options for the colleges you are considering. Free call, no login needed."
          />
        </div>
      )}
    </>
  );
}

function Page() {
  const cheapest = WITH_BOTH[0];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "MBA Fees & ROI Calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: absoluteUrl(PATH),
      description: "Works out the EMI, total repayment and a simple payback period for an MBA from the fee, a loan and an expected salary.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      ...(LAST_VERIFIED_ISO ? { dateModified: LAST_VERIFIED_ISO } : {}),
    },
    faqJsonLd(FAQS),
    breadcrumbJsonLd(CRUMBS, PATH),
  ];
  return (
    <>
      <PageSEO
        title="MBA Fees & ROI Calculator: EMI and Payback"
        description={`Free MBA ROI calculator: pick one of ${CHOICES.length} programmes' official fees or enter your own, add a loan and salary, and get EMI, total repayment and payback.`}
        canonical={PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          lead={false}
          crumbs={CRUMBS}
          eyebrow="Free tool · no login"
          title="MBA Fees and ROI Calculator: EMI, Total Cost and Payback"
          answer={
            <p>
              Choose one of {CHOICES.length} programmes to load its official total fee and, where published, the median
              salary of its last reported batch — or type your own figures. Add your living costs and loan terms to see
              the monthly EMI, total repayment, total cost and a simple payback period. The result is arithmetic on your
              assumptions, not a salary or placement promise.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Calculator />

          <Section id="methodology" title="How does this calculator work?">
            <Card>
              <ul className="list-disc space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
                <li>
                  <strong>EMI</strong>: the standard reducing-balance formula, EMI = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)
                  <sup>n</sup> − 1), with r = annual rate ÷ 12 ÷ 100 and n = tenure in months.
                </li>
                <li>
                  <strong>Total repayment</strong> = EMI × n; <strong>interest</strong> = repayment − loan amount.
                </li>
                <li>
                  <strong>Total cost</strong> = programme fee + your living-cost estimate + loan interest.
                </li>
                <li>
                  <strong>Simple payback</strong> = total cost ÷ (expected annual salary ÷ 12), rounded up to whole months.
                </li>
              </ul>
            </Card>
          </Section>

          <Section id="limitations" title="What does this calculator leave out?">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] leading-7 text-amber-900">
              It does not include income tax, your living expenses after the MBA, salary growth, scholarships or fee waivers,
              interest charged during the course (moratorium), processing fees, floating-rate changes, or the salary you give
              up while studying. The median salary is from a past batch&rsquo;s official report: half that batch earned less.
              Use the result to compare options and plan a loan, not to predict what you will earn. No admission, placement or
              salary is guaranteed.
            </div>
          </Section>

          {WITH_BOTH.length > 0 && (
            <Section
              id="fee-vs-median"
              title="How do official fees compare with median salaries?"
              lead={
                <p>
                  Programmes with both an official total fee and an official median salary, ordered by fee as a multiple of the
                  median (gross, before tax). {cheapest ? `The lowest multiple is ${(cheapest.program.feeTotal! / cheapest.program.medianSalary!).toFixed(2)} at ${choiceLabel(cheapest)}.` : ""}{" "}
                  Fees and salaries come from different years and cover different things; read each institute&rsquo;s note.
                </p>
              }
            >
              <TableWrap caption="Official MBA fees against median salaries">
                <thead>
                  <tr>
                    <Th>Institute</Th>
                    <Th className="text-right">Total fee</Th>
                    <Th className="text-right">Median salary</Th>
                    <Th className="text-right">Fee ÷ median</Th>
                  </tr>
                </thead>
                <tbody>
                  {WITH_BOTH.map((c) => (
                    <tr key={c.key}>
                      <Td>
                        <Link to={institutePath(c.college.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                          {choiceLabel(c)}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {formatLakh(c.program.feeTotal!)}
                        <SrcLink url={c.program.feeSource?.url} label={`${c.college.shortName} fee`} />
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {formatLakh(c.program.medianSalary!)}
                        {c.program.medianSalaryYear ? <span className="text-slate-400"> ({c.program.medianSalaryYear})</span> : null}
                        <SrcLink url={c.program.salarySource?.url} label={`${c.college.shortName} median salary`} />
                      </Td>
                      <Td className="text-right tabular-nums">{(c.program.feeTotal! / c.program.medianSalary!).toFixed(2)}×</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <div className="mt-4">
                <LinkChips
                  label="Related"
                  items={[
                    { to: MBA_PATHS.fees, label: "MBA fees compared" },
                    { to: MBA_PATHS.placements, label: "MBA placements compared" },
                    { to: comparePath([]), label: "Compare MBA colleges" },
                    { to: "/mba-resources/is-mba-worth-it", label: "Is an MBA worth it?" },
                    { to: "/mba-resources/mba-scholarships", label: "MBA scholarships" },
                  ].filter((x) => isPublished(x.to))}
                />
              </div>
            </Section>
          )}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <RelatedMbaPages current={PATH} />

          <MbaConversion intent="MBA fees and ROI enquiry" formId="mba_roi_calculator_page" />

          <SourcesList
            sources={WITH_BOTH.flatMap((c) => [c.program.feeSource, c.program.salarySource]).filter((s) => !!s).map((s) => s!)}
          />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaRoiCalculator() {
  if (!isPublished(PATH)) return <Navigate to={MBA_PATHS.hub} replace />;
  return <Page />;
}
