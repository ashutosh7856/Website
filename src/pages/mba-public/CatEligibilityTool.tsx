import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import WhatsAppShare from "@/components/predictors/WhatsAppShare";
import { bucket, trackEvent } from "@/lib/analytics";
import EligibilityForm from "@/components/mba-public/EligibilityForm";
import EligibilityResults from "@/components/mba-public/EligibilityResults";
import ThresholdTable from "@/components/mba-public/ThresholdTable";
import {
  Card,
  Container,
  FaqList,
  Hero,
  HowToSteps,
  LinkChips,
  MbaConversion,
  MbaToolsNav,
  MinimumsCaveat,
  PageShell,
  RelatedMbaPages,
  Section,
} from "@/components/mba-public/MbaPublicUi";
import { mbaErrorMessage, useEligibilityCheck, type EligibilityResponse } from "@/api/mba";
import {
  EMPTY_DRAFT,
  draftFromInput,
  loadLastEligibilityInput,
  saveLastEligibilityInput,
  validateDraft,
  type EligibilityDraft,
  type EligibilityErrors,
} from "@/lib/mbaEligibilityInput";
import {
  CAT_LATEST,
  ELIGIBILITY_LIMITATIONS,
  ELIGIBILITY_METHODOLOGY,
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  INSTITUTES_ON_LATEST_BATCH,
  LAST_VERIFIED,
  LAST_VERIFIED_ISO,
  MBA_INSTITUTES,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  institutePath,
  isPublished,
  joinNames,
  mbaCrumbs,
  overallRange,
  type Faq,
  type HowToStep,
} from "@/lib/mbaPublic";
import { MBA_PATHS, MBA_PERCENTILES, percentilePath } from "@/lib/mbaRoutes.mjs";
import { absoluteUrl } from "@/lib/siteUrl.mjs";
import { readNumberParam } from "@/lib/predictorPrefill";

const COUNT = MBA_INSTITUTES.length;
const GENERAL = overallRange("General");
const LATEST = joinNames(INSTITUTES_ON_LATEST_BATCH.map((i) => i.shortName));
const NOTED = MBA_INSTITUTES.filter((i) => i.cutoffNotes);

const YEAR = CAT_LATEST.year;
const CRUMBS = mbaCrumbs({ name: "CAT college predictor" });

const STEPS: HowToStep[] = [
  {
    name: "Enter your CAT percentile",
    text: "Type your overall percentile, and your VARC, DILR and QA percentiles if you have them. A mock or expected percentile works too; label it as an estimate in your own head.",
  },
  {
    name: "Pick category, PwD and gender",
    text: "IIMs publish separate minimums for General, EWS, NC-OBC, SC and ST, for PwD candidates, and some for men and women.",
  },
  {
    name: "Check against every IIM",
    text: `The tool compares your figures with the minimum each of the ${COUNT} IIMs published in its own admission policy.`,
  },
  {
    name: "Read each IIM's result",
    text: "Each programme shows meets the published minimum, below it (and on which part), or can't tell yet, with the policy batch and a link to the policy.",
  },
];

const READING: { label: string; body: string }[] = [
  {
    label: "Meets the published minimum",
    body: "Your overall and sectional percentiles are at or above every minimum the IIM published for your category. You are eligible to be considered at its first shortlisting stage. The interview call itself depends on a composite score and is usually at a higher percentile.",
  },
  {
    label: "Below the published minimum",
    body: "At least one figure is under the IIM's minimum, and the result names which one (overall, VARC, DILR or QA). Under the policy shown, that programme would not consider this percentile.",
  },
  {
    label: "Can't tell yet",
    body: "The policy needs something you did not enter (a sectional percentile or your gender), or it publishes no minimum for your category. Add the missing detail or read the policy linked in the result.",
  },
];
const PERCENTILE_LINKS = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p))).map((p) => ({
  to: percentilePath(p),
  label: `MBA colleges at ${p} percentile`,
}));

const FAQS: Faq[] = [
  {
    q: `Is this a CAT ${YEAR} college predictor?`,
    a: `Yes, for the IIMs. It checks a CAT ${YEAR} percentile (actual, expected or from a mock) against each IIM's latest official minimums, and shows which policy batch each figure comes from. Until an IIM publishes its policy for the batch that uses CAT ${YEAR}, its previous policy is shown and labelled.`,
  },
  {
    q: "Can this tool predict my CAT percentile from my score?",
    a: "No. Only the IIMs can give a CAT percentile, and they publish no table that converts a raw score into one. Use the CAT score calculator for your raw score; this tool starts from a percentile you already have or expect.",
  },
  {
    q: "How does this CAT college predictor work?",
    a: "It does not guess. It compares the percentiles you enter with the minimum CAT percentiles each IIM publishes in its own admission policy, for your category, PwD status and gender, and tells you where you meet every published minimum, where you fall short and where the policy does not let us say. It makes no admission-probability claim.",
  },
  {
    q: "Is the minimum CAT percentile the same as the IIM cut-off?",
    a: "No. The minimum is the lowest percentile an IIM will consider at its first, CAT-based shortlisting stage. Candidates who clear it are then ranked on a composite score (CAT, Class X/XII, graduation, work experience, diversity), and the percentile at which interview calls actually stop is usually well above the minimum. IIMs do not publish those closing percentiles in a comparable form.",
  },
  {
    q: "What does 'Can't tell yet' mean in my result?",
    a: "Either the IIM sets a minimum for a section you left blank, it publishes no minimum for your category (for example IIM Shillong has no NC-OBC row in its 2026-28 policy), or it sets gender-specific minimums and you did not give your gender. Fill in the missing detail and check again, or read the policy linked in the result.",
  },
  {
    q: "Why are most thresholds from the 2026-28 policy and not 2027-29?",
    a: `By ${LAST_VERIFIED} only ${LATEST} had published the policy for the 2027-29 batch (CAT 2026). For every other IIM the latest official policy is the 2026-28 one (CAT 2025), and each row shows which batch it comes from. Thresholds can change when a new policy is released.`,
  },
  {
    q: "If I score exactly the minimum, do I pass?",
    a: "Yes. A percentile equal to the published minimum is treated as meeting it, which is how the IIM policies word their thresholds (“at least” or “minimum”).",
  },
  {
    q: "Does this tool check Class X, Class XII or graduation marks?",
    a: "No. Some IIMs also set minimum academic percentages, require a positive raw score in every CAT section, or ask for work experience for specific programmes. Those rules appear in the notes of each result but are not checked. Always read the official admission policy before deciding where to apply.",
  },
  {
    q: "Do you store the percentiles I enter?",
    a: "Your inputs are sent once to calculate the result and are remembered only in this browser so the form is pre-filled next time. Sharing your phone number in the callback form below is optional.",
  },
];

/** Share text from the counts on screen only — no percentile/category/personal details. */
function eligibilityShareSummary(result: EligibilityResponse): string {
  const { meets_minimum, unknown, below_minimum } = result.counts;
  const total = meets_minimum + unknown + below_minimum;
  return `My CAT check: I clear the published minimum percentiles at ${meets_minimum} of ${total} IIM programmes checked. Check yours against every IIM's official minimum:`;
}

export default function CatEligibilityTool() {
  const [draft, setDraft] = useState<EligibilityDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<EligibilityErrors>({});
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const check = useEligibilityCheck();
  const resultRef = useRef<HTMLDivElement>(null);

  // Pre-fill from the last check on this device — after mount, so the
  // prerendered HTML is always the empty form.
  useEffect(() => {
    // A percentile passed from the home page hero wins over the remembered one.
    const fromHome = readNumberParam("percentile", { min: 0, max: 100 });
    if (fromHome !== null) {
      setDraft({ ...EMPTY_DRAFT, overall: fromHome });
      return;
    }
    const last = loadLastEligibilityInput();
    if (last) setDraft(draftFromInput(last));
  }, []);

  const submit = () => {
    const { input, errors: found } = validateDraft(draft);
    setErrors(found);
    if (!input) return;
    saveLastEligibilityInput(input);
    check.mutate(input, {
      onSuccess: (data) => {
        setResult(data);
        trackEvent("mba_college_predictor_used", {
          tool: "cat_eligibility",
          percentile_bucket: bucket(input.overall),
          results: data.counts.meets_minimum,
        });
        requestAnimationFrame(() => resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
      },
    });
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CAT College Predictor (IIM minimum eligibility check)",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: absoluteUrl(ELIGIBILITY_TOOL_PATH),
      description: `Compares a CAT percentile with the minimum percentiles published by ${COUNT} IIMs for their first shortlisting stage.`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      ...(LAST_VERIFIED_ISO ? { dateModified: LAST_VERIFIED_ISO } : {}),
    },
    faqJsonLd(FAQS),
    howToJsonLd("How to use the CAT college predictor", ELIGIBILITY_TOOL_PATH, STEPS),
    breadcrumbJsonLd(CRUMBS, ELIGIBILITY_TOOL_PATH),
  ];

  return (
    <>
      <PageSEO
        title={`CAT College Predictor ${YEAR}: IIM Eligibility`}
        description={`Free CAT ${YEAR} college predictor: check your percentile against the official minimums of all ${COUNT} IIMs by category, PwD and gender. No login.`}
        canonical={ELIGIBILITY_TOOL_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          lead={false}
          crumbs={CRUMBS}
          eyebrow="Free tool · no login"
          title="CAT College Predictor: Which IIMs' Minimums Does Your Percentile Clear?"
          answer={
            <p>
              Enter your CAT percentile and category to see, for each of the {COUNT} IIMs, whether you meet the
              minimum percentiles it published for its first shortlisting stage. For General candidates these minimums
              run from {GENERAL.min} overall ({joinNames(GENERAL.minNames)}) to {GENERAL.max} (
              {joinNames(GENERAL.maxNames)}). Clearing a minimum makes you eligible to be considered; it is not a
              cut-off and not a prediction of an interview call.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          <Card>
            <h2 className="font-[Poppins] text-[18px] font-semibold">Check your percentile</h2>
            <div className="mt-4">
              <EligibilityForm
                draft={draft}
                errors={errors}
                onChange={setDraft}
                onSubmit={submit}
                pending={check.isPending}
              />
            </div>
            {check.isError && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-[13px] text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {mbaErrorMessage(check.error, "The checker could not be reached.")} The table of General-category
                  minimums below is always available, and the{" "}
                  <Link to={IIM_CUTOFFS_PATH} className="underline">
                    full IIM minimums table
                  </Link>{" "}
                  covers every category.
                </span>
              </p>
            )}
          </Card>

          {result && (
            <div ref={resultRef} className="scroll-mt-24 space-y-8">
              <Section title="Your result">
                <WhatsAppShare
                  summary={eligibilityShareSummary(result)}
                  path={ELIGIBILITY_TOOL_PATH}
                  predictor="cat_eligibility_tool"
                  className="mb-5"
                />
                <EligibilityResults response={result} institutePathFor={institutePath} />
              </Section>
              <QuickLeadForm
                intent="CAT percentile vs IIM minimum eligibility check"
                course="MBA"
                exam="CAT"
                formId="cat_eligibility_result"
                heading="Want help deciding where to apply?"
                subheading="A ProCounsel MBA counsellor can go through your result, academics and work experience with you. Free call, no login needed."
              />
            </div>
          )}

          <HowToSteps title="How do you use the CAT college predictor?" steps={STEPS} />

          <Section id="how-to-read" title="How do you read your result?">
            <ul className="grid gap-3 md:grid-cols-3">
              {READING.map((r) => (
                <li key={r.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-[Poppins] text-[15px] font-semibold">{r.label}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-slate-600">{r.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
              Then shortlist: programmes you clear with room to spare are realistic targets, ones you clear narrowly are
              stretch options, and the{" "}
              <Link to={MBA_PATHS.compare} className="font-medium text-[#2F43F2] underline">
                college comparison
              </Link>{" "}
              helps you weigh fees and placements between them.
            </p>
          </Section>

          <Section id="methodology" title="How does this eligibility check work?">
            <Card>
              <p className="text-[14px] leading-7 text-slate-700">{ELIGIBILITY_METHODOLOGY}</p>
            </Card>
          </Section>

          <Section id="limitations" title="What can this tool not tell you?">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] leading-7 text-amber-900">
              {ELIGIBILITY_LIMITATIONS}
            </div>
          </Section>

          <Section
            id="general-minimums"
            title="What are the minimum CAT percentiles for General category at each IIM?"
            lead={
              <p>
                Non-PwD General candidates, latest official policy for each IIM. Columns are the overall minimum and
                the sectional minimums for VARC, DILR and QA (&ldquo;—&rdquo; means the policy sets none). Other
                categories and PwD rows are in the{" "}
                <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] underline">
                  IIM minimum percentiles table
                </Link>
                .
              </p>
            }
          >
            <ThresholdTable category="General" pwd={false} caption="Minimum CAT percentiles, General category, non-PwD" />
            {NOTED.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-[13px] leading-6 text-slate-600">
                {NOTED.map((i) => (
                  <li key={i.slug}>
                    <strong className="text-slate-700">{i.shortName}:</strong> {i.cutoffNotes}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <MinimumsCaveat />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          {PERCENTILE_LINKS.length > 0 && (
            <Section id="by-percentile" title="Which MBA colleges fit your percentile band?">
              <LinkChips label="MBA colleges by CAT percentile" items={PERCENTILE_LINKS} />
            </Section>
          )}

          <MbaToolsNav current={ELIGIBILITY_TOOL_PATH} />

          <RelatedMbaPages current={ELIGIBILITY_TOOL_PATH} />

          <MbaConversion intent="CAT college predictor enquiry" formId="cat_college_predictor_page" />
        </Container>
      </PageShell>
    </>
  );
}
