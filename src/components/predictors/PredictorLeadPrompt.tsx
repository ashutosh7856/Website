import QuickLeadForm from "@/components/leads/QuickLeadForm";
import { formatPredictorRemark, type PredictorSearch } from "@/lib/predictorIntent";

interface PredictorLeadPromptProps {
  /** The search the result on screen came from — recorded in the lead remarks. */
  search: PredictorSearch;
  /** Course the predictor is for, e.g. "Medical (MBBS/BDS)". */
  course?: string;
  /** Analytics placement id, e.g. "neet_rank_predictor". */
  formId: string;
  heading?: string;
  subheading?: string;
  className?: string;
}

/**
 * Soft lead capture shown next to/after predictor results.
 *
 * Predictor results are open to everyone (they rank in search, and a gated
 * result is a dead end for most visitors). This replaces the old login wall
 * with an optional call-back form that carries the visitor's exam and the
 * inputs behind the result, so the counsellor who calls already knows what the
 * student searched for. The search is also persisted by the page itself
 * (persistPredictorSearch), so a lead created at login carries it too.
 */
export default function PredictorLeadPrompt({
  search,
  course,
  formId,
  heading = "Want a counsellor to review this list with you?",
  subheading = "A prediction is a starting point. Leave your number and a ProCounsel counsellor will go through these results with you and plan your next step. Free, no login needed.",
  className = "",
}: PredictorLeadPromptProps) {
  return (
    <QuickLeadForm
      intent={formatPredictorRemark(search)}
      exam={search.exam}
      course={course}
      formId={formId}
      heading={heading}
      subheading={subheading}
      className={className}
    />
  );
}
