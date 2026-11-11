import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import SkyBanner from '@/components/school-student/SkyBanner';
import { PracticeQuestionCard, SafeHtml, SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { formatDate, SECTION_SHORT } from '@/components/mba/format';
import {
  mbaErrorMessage,
  SECTIONS,
  useMbaMistakes,
  usePatchMistake,
  type MistakeCategory,
  type MistakeItem,
  type SectionId,
} from '@/api/mba';

const CATEGORIES: { id: MistakeCategory; label: string }[] = [
  { id: 'concept', label: 'Concept gap' },
  { id: 'calculation', label: 'Calculation slip' },
  { id: 'misread', label: 'Misread the question' },
  { id: 'selection', label: 'Wrong question choice' },
  { id: 'time_pressure', label: 'Time pressure' },
  { id: 'guess', label: 'Guessed' },
];

/** Readable form of a stored answer: MCQ option id → its letter. */
function answerLabel(item: MistakeItem): string {
  const opts = item.question.options;
  if (item.question.type === 'MCQ' && opts) {
    const i = opts.findIndex((o) => o.id === item.lastAnswer);
    if (i >= 0) return `Option ${String.fromCharCode(65 + i)}`;
  }
  return item.lastAnswer;
}

function MistakeCard({ item }: { item: MistakeItem }) {
  const patch = usePatchMistake();
  const qc = useQueryClient();
  const [note, setNote] = useState(item.note ?? '');
  const [retrying, setRetrying] = useState(false);
  const [retried, setRetried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const q = item.question;

  const save = (body: { category?: MistakeCategory; note?: string }) => {
    setError(null);
    setSavedNote(false);
    patch.mutate(
      { questionId: q.id, ...body },
      {
        onSuccess: () => {
          if (body.note !== undefined) setSavedNote(true);
        },
        onError: (err) => setError(mbaErrorMessage(err, 'Could not save.')),
      },
    );
  };

  if (retrying) {
    return (
      <PracticeQuestionCard
        question={q}
        // Refresh the notebook only on the way back — refreshing on answer
        // could drop this entry (now solved) while its solution is on screen.
        onAnswered={() => setRetried(true)}
        footer={
          <button
            type="button"
            onClick={() => {
              setRetrying(false);
              if (retried) void qc.invalidateQueries({ queryKey: ['mba', 'mistakes'] });
            }}
            className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold"
          >
            Back to notebook entry
          </button>
        }
      />
    );
  }

  return (
    <article className="ss-panel space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <SectionChip section={q.section} />
        {q.topic && <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{q.topic}</span>}
        <span className="ml-auto font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          {item.retries} {item.retries === 1 ? 'retry' : 'retries'}
          {item.nextReviewAt ? ` · review ${formatDate(item.nextReviewAt)}` : ''}
        </span>
      </div>
      {q.set && (
        <p className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
          Part of a {q.set.kind === 'passage' ? 'passage' : 'set'} — open Retry to read it.
        </p>
      )}
      <div className="max-h-[180px] overflow-hidden [mask-image:linear-gradient(180deg,#000_70%,transparent)]">
        <SafeHtml html={q.stemHtml} />
      </div>
      <p className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">
        Your last answer: <strong className="text-[var(--red-500)]">{answerLabel(item)}</strong>
      </p>

      <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Why it went wrong
          <select
            value={item.category ?? ''}
            onChange={(e) => e.target.value && save({ category: e.target.value as MistakeCategory })}
            className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] text-[var(--ink)]"
          >
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Note to self
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSavedNote(false);
            }}
            rows={2}
            maxLength={1000}
            placeholder="What will you do differently?"
            className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => save({ note })}
          disabled={patch.isPending || note === (item.note ?? '')}
          className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-50"
        >
          {patch.isPending ? 'Saving…' : 'Save note'}
        </button>
        {savedNote && <span className="font-[Poppins] text-[12px] text-[var(--green-600)]">Saved</span>}
        <button
          type="button"
          onClick={() => setRetrying(true)}
          className="btn-primary ml-auto cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold"
        >
          Retry question
        </button>
      </div>
    </article>
  );
}

export default function MbaMistakes() {
  const [section, setSection] = useState<SectionId | undefined>();
  const [params] = useSearchParams();
  // /mba/mistakes?due=true is the dashboard's "review mistakes" link.
  const [due, setDue] = useState(() => params.get('due') === 'true');
  const { data, isPending, isError, error, refetch } = useMbaMistakes({ section, due });

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Mistakes notebook"
        title="Learn from what went wrong"
        lead="Every question you got wrong lands here. Tag why, jot a note, and retry when it's due."
      />

      <div className="flex flex-wrap items-center gap-2">
        {[undefined, ...SECTIONS].map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            aria-pressed={section === s}
            onClick={() => setSection(s)}
            className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
            style={{
              borderColor: section === s ? 'var(--brand-purple-500)' : 'var(--borders-default)',
              background: section === s ? 'var(--brand-purple-500)' : '#fff',
              color: section === s ? '#fff' : 'var(--neutral-600)',
            }}
          >
            {s ? SECTION_SHORT[s] : 'All sections'}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          <input type="checkbox" checked={due} onChange={(e) => setDue(e.target.checked)} className="h-4 w-4 accent-[#6C4CF1]" />
          Due for review
        </label>
      </div>

      {isPending ? (
        <Skeleton rows={3} />
      ) : isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load your notebook"
          detail={mbaErrorMessage(error)}
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : data.items.length === 0 ? (
        <StateBlock
          tone="empty"
          title={due ? 'Nothing due right now' : 'No mistakes yet'}
          detail={
            due
              ? 'Come back when a review date arrives.'
              : 'Questions you answer wrongly in practice or mocks will show up here.'
          }
          action={due ? undefined : { label: 'Go to practice', href: '/mba/practice' }}
        />
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <MistakeCard key={item.question.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
