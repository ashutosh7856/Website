import type { Confidence, ConfidenceBreakdown } from '@/api/mba';
import { CONFIDENCE_LABEL, CONFIDENCE_OPTIONS } from './confidenceLabels';

/**
 * Self-rated confidence: optional "how sure are you?" chips for an answer
 * (practice card and the mock player), and the breakdown on the result page.
 */

/** Small, optional chips; clicking the active chip clears it. */
export function ConfidenceChips({
  value,
  onChange,
  disabled = false,
}: {
  value: Confidence | null | undefined;
  onChange: (next: Confidence | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="How sure are you? (optional)">
      <span className="mr-0.5 font-[Poppins] text-[11px] text-[var(--neutral-500)]">How sure are you?</span>
      {CONFIDENCE_OPTIONS.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : o.id)}
            className="cursor-pointer rounded-full border px-2.5 py-1 font-[Poppins] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
              background: active ? 'var(--brand-purple-50)' : '#fff',
              color: active ? 'var(--brand-purple-700)' : 'var(--neutral-600)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Result-page panel: how the self-ratings matched the outcome. Hidden when nothing was rated. */
export function ConfidencePanel({ breakdown }: { breakdown: ConfidenceBreakdown }) {
  const rated = breakdown.sure.answered + breakdown.unsure.answered + breakdown.guess.answered;
  if (rated === 0) return null;
  const lines: string[] = [];
  if (breakdown.sure.incorrect)
    lines.push(`You were sure but wrong on ${plural(breakdown.sure.incorrect, 'question')} — read those solutions first.`);
  if (breakdown.guess.correct)
    lines.push(`${plural(breakdown.guess.correct, 'lucky guess', 'lucky guesses')}: right, but rated as a guess. Weak-topic sets bring them back.`);
  if (!breakdown.sure.incorrect && breakdown.sure.correct)
    lines.push(`Every answer you were sure about was right (${breakdown.sure.correct}).`);

  return (
    <section className="ss-panel p-4" aria-labelledby="confidence-heading">
      <h2 id="confidence-heading" className="ss-display text-[17px] text-[var(--ink)]">
        How sure you were
      </h2>
      {lines.length > 0 && (
        <ul className="mt-2 space-y-1 font-[Poppins] text-[13px] text-[var(--neutral-700)]">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(['sure', 'unsure', 'guess', 'unrated'] as const).map((k) => {
          const b = breakdown[k];
          return (
            <div key={k} className="rounded-xl bg-[var(--neutral-50)] px-3 py-2">
              <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{k === 'unrated' ? 'Not rated' : CONFIDENCE_LABEL[k]}</p>
              <p className="ss-data mt-0.5 text-[16px] text-[var(--ink)]">
                {b.correct}/{b.answered}
                <span className="ml-1 font-[Poppins] text-[11px] font-normal text-[var(--neutral-500)]">right</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
