import { useId, useState } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { mbaErrorMessage } from '@/api/mba';
import {
  useSaveOutcome,
  type Application,
  type Outcome,
  type OutcomeDecision,
  type OutcomeFunnel,
  type OutcomeResult,
} from '@/api/mbaApplications';
import { formatDate } from '@/components/mba/format';

type Stage = 'applied' | 'shortlisted' | 'interviewDone';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Got a WAT / GD / PI call' },
  { id: 'interviewDone', label: 'WAT / GD / PI done' },
];
const RESULTS: { id: OutcomeResult; label: string }[] = [
  { id: 'admit', label: 'Admit' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'reject', label: 'Not selected' },
];
const DECISIONS: { id: OutcomeDecision; label: string }[] = [
  { id: 'accepted', label: 'I accepted the offer' },
  { id: 'declined', label: 'I declined the offer' },
];

/** Today in India time, as YYYY-MM-DD (the server rejects dates after it). */
const todayIst = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const fieldCls =
  'mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]';

function strip(app: Application): Outcome {
  const { applied, shortlisted, interviewDone, result, decision } = app.outcome;
  return { applied, shortlisted, interviewDone, result, decision };
}

/** One line for the collapsed state, e.g. "WAT / GD / PI done · 3 Feb 2027". */
function statusLine(o: Outcome): string {
  if (o.decision) return o.decision.value === 'accepted' ? 'Offer accepted' : 'Offer declined';
  if (o.result) return `Result: ${RESULTS.find((r) => r.id === o.result?.value)?.label}`;
  const last = [...STAGES].reverse().find((s) => o[s.id]);
  if (!last) return 'Not started';
  const date = o[last.id]?.date;
  return `${last.label}${date ? ` · ${formatDate(date)}` : ''}`;
}

/** Where an application stands: applied → call → interview → result → decision, each with an optional date. */
export default function ApplicationOutcome({ app }: { app: Application }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Outcome>(() => strip(app));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = useSaveOutcome();
  const panelId = useId();
  const max = todayIst();
  const current = strip(app);
  const dirty = JSON.stringify(draft) !== JSON.stringify(current);

  const update = (next: Outcome) => {
    setSaved(false);
    setDraft(next);
  };
  const setStage = (id: Stage, on: boolean) => {
    const next: Outcome = {
      ...draft,
      [id]: on ? { date: draft[id]?.date ?? null } : null,
    };
    // Unticking a stage clears the ones that depend on it.
    if (!on && id === 'applied')
      Object.assign(next, {
        shortlisted: null,
        interviewDone: null,
        result: null,
        decision: null,
      });
    if (!on && id === 'shortlisted') next.interviewDone = null;
    update(next);
  };
  const setStageDate = (id: Stage, date: string) => update({ ...draft, [id]: { date: date || null } });

  const submit = () => {
    setError(null);
    save.mutate(
      { slug: app.slug, outcome: draft },
      {
        onSuccess: (fresh) => {
          setDraft(strip(fresh));
          setSaved(true);
        },
        onError: (err) => setError(mbaErrorMessage(err, 'Could not save.')),
      },
    );
  };

  return (
    <div className="ss-surface space-y-2 p-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 text-left"
      >
        <Flag className="h-4 w-4 shrink-0 text-[var(--brand-purple-500)]" aria-hidden />
        <span className="font-[Poppins] text-[12.5px] font-semibold text-[var(--ink)]">Admission progress</span>
        <span className="ml-auto truncate font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          {statusLine(current)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--neutral-500)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <form
          id={panelId}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <ul className="space-y-2">
            {STAGES.map((stage, i) => {
              const prev = i > 0 ? draft[STAGES[i - 1].id] : true;
              const mark = draft[stage.id];
              return (
                <li key={stage.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <label className="flex min-w-[200px] flex-1 cursor-pointer items-center gap-2 font-[Poppins] text-[13px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={!!mark}
                      disabled={!prev}
                      onChange={(e) => setStage(stage.id, e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-purple-500)] disabled:opacity-40"
                    />
                    {stage.label}
                  </label>
                  {mark && (
                    <input
                      type="date"
                      value={mark.date ?? ''}
                      max={max}
                      aria-label={`${stage.label} date (optional)`}
                      onChange={(e) => setStageDate(stage.id, e.target.value)}
                      className="rounded-xl border border-[var(--borders-default)] bg-white px-2.5 py-1.5 font-[Poppins] text-[12.5px] text-[var(--ink)]"
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
              Result
              <select
                value={draft.result?.value ?? ''}
                disabled={!draft.applied}
                onChange={(e) => {
                  const value = e.target.value as OutcomeResult | '';
                  update({
                    ...draft,
                    result: value ? { value, date: draft.result?.date ?? null } : null,
                    decision: value === 'admit' ? draft.decision : null,
                  });
                }}
                className={fieldCls}
              >
                <option value="">No result yet</option>
                {RESULTS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            {draft.result && (
              <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
                Result date (optional)
                <input
                  type="date"
                  value={draft.result.date ?? ''}
                  max={max}
                  onChange={(e) =>
                    draft.result &&
                    update({
                      ...draft,
                      result: { ...draft.result, date: e.target.value || null },
                    })
                  }
                  className={fieldCls}
                />
              </label>
            )}
          </div>

          {draft.result?.value === 'admit' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
                Your decision
                <select
                  value={draft.decision?.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value as OutcomeDecision | '';
                    update({
                      ...draft,
                      decision: value ? { value, date: draft.decision?.date ?? null } : null,
                    });
                  }}
                  className={fieldCls}
                >
                  <option value="">Not decided yet</option>
                  {DECISIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              {draft.decision && (
                <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
                  Decision date (optional)
                  <input
                    type="date"
                    value={draft.decision.date ?? ''}
                    max={max}
                    onChange={(e) =>
                      draft.decision &&
                      update({
                        ...draft,
                        decision: {
                          ...draft.decision,
                          date: e.target.value || null,
                        },
                      })
                    }
                    className={fieldCls}
                  />
                </label>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!dirty || save.isPending}
              className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save progress'}
            </button>
            {saved && !dirty && <span className="font-[Poppins] text-[12px] text-[var(--green-600)]">Saved</span>}
            <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              Only counts, never your name, are used in ProCounsel's admission stats.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

/** "Applied 6 → calls 3 → interviews 2 → admits 1": the student's own funnel across the shortlist. */
export function OutcomeFunnelCard({ funnel }: { funnel: OutcomeFunnel }) {
  if (!funnel.applied) return null;
  const steps = [
    { label: 'Applied', value: funnel.applied },
    { label: 'WAT / PI calls', value: funnel.shortlisted },
    { label: 'Interviews done', value: funnel.interviewDone },
    { label: 'Admits', value: funnel.admit },
  ];
  const extra = [
    funnel.waitlist && `${funnel.waitlist} waitlisted`,
    funnel.reject && `${funnel.reject} not selected`,
    funnel.accepted && `${funnel.accepted} accepted`,
    funnel.declined && `${funnel.declined} declined`,
  ].filter(Boolean);
  return (
    <section aria-labelledby="funnel-heading" className="ss-panel space-y-3 p-4 md:p-5">
      <h2 id="funnel-heading" className="ss-display text-[16px] text-[var(--ink)]">
        Your admission funnel
      </h2>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s) => (
          <li key={s.label} className="rounded-xl bg-[var(--neutral-50)] p-3">
            <span className="ss-data block text-[22px] text-[var(--ink)]">{s.value}</span>
            <span className="block font-[Poppins] text-[11.5px] text-[var(--neutral-600)]">{s.label}</span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#E4E7F2]" aria-hidden>
              <span
                className="block h-full rounded-full bg-[var(--brand-purple-500)]"
                style={{
                  width: `${Math.round((s.value / funnel.applied) * 100)}%`,
                }}
              />
            </span>
          </li>
        ))}
      </ol>
      {extra.length > 0 && <p className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">{extra.join(' · ')}</p>}
    </section>
  );
}
