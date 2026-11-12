import { useState } from 'react';
import { Flag } from 'lucide-react';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import { REPORT_CATEGORIES, useMyReport, useSubmitReport, type ReportCategory } from '@/api/mbaInsights';

const STATUS_LABEL = { open: 'under review', resolved: 'resolved', rejected: 'reviewed — no change needed' } as const;
const NOTE_MAX = 1000;

function errorText(err: unknown): string {
  switch (mbaStatus(err)) {
    case 429:
      return mbaErrorMessage(err, 'Too many reports today. Please try again tomorrow.');
    case 403:
      return mbaErrorMessage(err, 'You can report a question once its answer has been shown to you.');
    default:
      return mbaErrorMessage(err, 'Could not send your report.');
  }
}

/**
 * "Report an issue" — shown only after a question's answer has been revealed
 * (practice/daily after answering, or a submitted mock's review). One report
 * per question per student; sending again edits it.
 */
export default function ReportIssue({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const mine = useMyReport(questionId, open);
  const submit = useSubmitReport(questionId);
  const existing = mine.data?.report ?? null;
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const chosen = category ?? existing?.category ?? null;
  const text = note ?? existing?.note ?? '';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)] hover:text-[var(--brand-purple-700)]"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden /> Report an issue
      </button>
    );
  }

  const send = () => {
    if (!chosen) return;
    setSent(false);
    submit.mutate(
      { category: chosen, note: text.trim() || undefined },
      {
        onSuccess: () => {
          setSent(true);
          setCategory(null);
          setNote(null);
        },
      },
    );
  };

  return (
    <section className="rounded-2xl border border-[var(--borders-default)] p-4" aria-label="Report an issue">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 font-[Poppins] text-[13px] font-bold text-[var(--ink)]">
          <Flag className="h-4 w-4 text-[var(--neutral-500)]" aria-hidden /> Report an issue
        </h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]"
        >
          Close
        </button>
      </div>
      {existing && (
        <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          You reported this question — {STATUS_LABEL[existing.status]}. Sending again updates your report.
        </p>
      )}
      {mine.isPending ? (
        <div className="mt-3 h-[60px] animate-pulse rounded-xl bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="What is wrong?">
            {REPORT_CATEGORIES.map((c) => {
              const active = chosen === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCategory(c.id)}
                  className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold"
                  style={{
                    borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                    background: active ? 'var(--brand-purple-500)' : '#fff',
                    color: active ? '#fff' : 'var(--neutral-600)',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
            Details (optional)
            <textarea
              value={text}
              maxLength={NOTE_MAX}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What looks wrong? e.g. option C should be correct because…"
              className="mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[13px] font-normal text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={!chosen || submit.isPending}
              className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submit.isPending ? 'Sending…' : existing ? 'Update report' : 'Send report'}
            </button>
            <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
              {text.length}/{NOTE_MAX}
            </span>
            {sent && !submit.isError && (
              <span className="font-[Poppins] text-[12px] text-[var(--green-600)]" aria-live="polite">
                Thanks — our faculty will check it.
              </span>
            )}
          </div>
          {(submit.isError || mine.isError) && (
            <p role="alert" className="mt-2 font-[Poppins] text-[12px] text-[var(--red-500)]">
              {errorText(submit.error ?? mine.error)}
            </p>
          )}
        </>
      )}
    </section>
  );
}
