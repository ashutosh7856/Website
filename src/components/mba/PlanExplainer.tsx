import { Sparkles } from 'lucide-react';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import { useExplainPlan, usePlanExplanation } from '@/api/mbaCoach';
import { trackEvent } from '@/lib/analytics';

function explainError(err: unknown): string {
  switch (mbaStatus(err)) {
    case 429:
      return 'You have used all your AI requests for today. They reset at midnight.';
    case 503:
      return 'The AI explanation is not available right now. Please try again later.';
    default:
      return mbaErrorMessage(err, 'Could not explain the plan.');
  }
}

/**
 * "Explain my plan": an AI explanation of this week's plan, grounded only in the
 * planner's own rules and tasks. Cached on the server until the plan changes.
 */
export default function PlanExplainer({ week }: { week: string }) {
  const cached = usePlanExplanation(week);
  const explain = useExplainPlan(week);
  const explanation = cached.data?.explanation ?? null;

  return (
    <section aria-labelledby="explain-heading" className="ss-panel p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="explain-heading" className="ss-display flex items-center gap-1.5 text-[17px] text-[var(--ink)]">
          <Sparkles className="h-4 w-4 text-[var(--gold-500)]" aria-hidden /> Explain my plan
        </h2>
        {!explanation && (
          <button
            type="button"
            onClick={() => explain.mutate(undefined, { onSuccess: () => trackEvent('mba_ai_plan_explained', { week }) })}
            disabled={explain.isPending || cached.isPending}
            className="btn-secondary ml-auto cursor-pointer px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {explain.isPending ? 'Explaining…' : 'Explain in plain words'}
          </button>
        )}
      </div>
      {explanation ? (
        <>
          <p className="mt-3 whitespace-pre-wrap font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]" aria-live="polite">
            {explanation.text}
          </p>
          <p className="mt-2 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
            AI explanation of the rules above. It doesn't change your plan, and it updates when the plan changes.
          </p>
        </>
      ) : (
        <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          Get a short explanation of why these tasks are in your week. Uses one of your daily AI requests.
        </p>
      )}
      {explain.isError && (
        <p role="alert" className="mt-2 font-[Poppins] text-[12px] text-[var(--red-500)]">
          {explainError(explain.error)}
        </p>
      )}
    </section>
  );
}
