import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { SECTION_SHORT, SECTION_TONE } from '@/components/mba/format';
import { mbaErrorMessage, type SectionId } from '@/api/mba';
import { trackEvent } from '@/lib/analytics';
import {
  NOTE_MAX,
  usePatchSyllabusItem,
  useSyllabus,
  type SyllabusItemPatch,
  type SyllabusSection,
  type SyllabusSubtopic,
} from '@/api/mbaSyllabus';
import { isAppPath } from '@/api/mbaInsights';

type Filter = 'all' | 'todo' | 'bookmarked';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'Not completed' },
  { id: 'bookmarked', label: 'Bookmarked' },
];

function ProgressBar({ done, total, color, label }: { done: number; total: number; color: string; label: string }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[var(--brand-purple-50)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
    </div>
  );
}

function SubtopicItem({ sub, section }: { sub: SyllabusSubtopic; section: SectionId }) {
  const patch = usePatchSyllabusItem();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(sub.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const noteChanged = (sub.note ?? '') !== note.trim();

  const save = (body: SyllabusItemPatch, onDone?: () => void) => {
    setError(null);
    patch.mutate(
      { subtopicId: sub.id, body },
      {
        onSuccess: () => onDone?.(),
        onError: (err) => setError(mbaErrorMessage(err, 'Could not save. Try again.')),
      },
    );
  };

  return (
    <li className="border-t border-[var(--borders-default)] first:border-t-0">
      <div className="flex items-center gap-2 py-2.5">
        <button
          type="button"
          onClick={() =>
            save({ completed: !sub.completed }, () => {
              if (!sub.completed) trackEvent('mba_syllabus_completed', { section });
            })
          }
          disabled={patch.isPending}
          aria-pressed={sub.completed}
          aria-label={sub.completed ? `Mark ${sub.title} as not completed` : `Mark ${sub.title} as completed`}
          className="shrink-0 cursor-pointer rounded-full p-0.5 disabled:cursor-wait"
        >
          {sub.completed ? (
            <CheckCircle2 className="h-5 w-5 text-[var(--green-600)]" />
          ) : (
            <Circle className="h-5 w-5 text-[var(--neutral-300)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className={`block font-[Poppins] text-[13px] font-semibold ${sub.completed ? 'text-[var(--neutral-500)]' : 'text-[var(--ink)]'}`}>
              {sub.title}
            </span>
            <span className="block font-[Poppins] text-[11px] text-[var(--neutral-400)]">
              {sub.questionCount ? `${sub.questionCount} practice question${sub.questionCount === 1 ? '' : 's'}` : 'Notes only'}
              {sub.note ? ' · has your notes' : ''}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => save({ bookmarked: !sub.bookmarked })}
          disabled={patch.isPending}
          aria-pressed={sub.bookmarked}
          aria-label={sub.bookmarked ? `Remove bookmark from ${sub.title}` : `Bookmark ${sub.title}`}
          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--brand-purple-600)] hover:bg-[var(--brand-purple-50)] disabled:cursor-wait"
        >
          {sub.bookmarked ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 pb-4 pl-8">
          <ul className="list-disc space-y-1.5 pl-5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">
            {sub.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {!sub.completed && (
              <button
                type="button"
                onClick={() => save({ completed: true }, () => trackEvent('mba_syllabus_completed', { section }))}
                disabled={patch.isPending}
                className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-50"
              >
                Mark as completed
              </button>
            )}
            {sub.questionCount > 0 && isAppPath(sub.practiceHref) && (
              <Link to={sub.practiceHref} className="btn-secondary px-4 py-2 font-[Poppins] text-[12px] font-semibold">
                Practise this
              </Link>
            )}
            {sub.drillHref && isAppPath(sub.drillHref) && (
              <Link to={sub.drillHref} className="btn-secondary px-4 py-2 font-[Poppins] text-[12px] font-semibold">
                Build a drill
              </Link>
            )}
          </div>
          <div>
            <label htmlFor={`note-${sub.id}`} className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
              My notes <span className="font-normal text-[var(--neutral-400)]">(only you can see these)</span>
            </label>
            <textarea
              id={`note-${sub.id}`}
              value={note}
              onChange={(e) => {
                setNote(e.target.value.slice(0, NOTE_MAX));
                setSaved(false);
              }}
              rows={3}
              placeholder="Formulas, traps you fell for, a method that clicked…"
              className="mt-1 block w-full resize-y rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[13px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
            />
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => save({ note: note.trim() || null }, () => setSaved(true))}
                disabled={!noteChanged || patch.isPending}
                className="btn-secondary cursor-pointer px-3 py-1.5 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {patch.isPending ? 'Saving…' : 'Save notes'}
              </button>
              {saved && !noteChanged && (
                <span className="font-[Poppins] text-[11px] text-[var(--green-600)]" role="status">
                  Saved
                </span>
              )}
              <span className="ml-auto font-[Poppins] text-[11px] text-[var(--neutral-400)]">
                {note.length}/{NOTE_MAX}
              </span>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="pb-2 pl-8 font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}
    </li>
  );
}

function SectionView({ section, filter }: { section: SyllabusSection; filter: Filter }) {
  const visible = (s: SyllabusSubtopic) => filter === 'all' || (filter === 'todo' ? !s.completed : s.bookmarked);
  const topics = section.topics.map((t) => ({ ...t, shown: t.subtopics.filter(visible) })).filter((t) => t.shown.length > 0);
  if (!topics.length)
    return (
      <StateBlock
        tone="empty"
        title={filter === 'bookmarked' ? 'No bookmarks in this section yet' : 'Everything here is completed'}
        detail={filter === 'bookmarked' ? 'Tap the bookmark icon on a lesson to keep it handy.' : 'Nice work. Switch to "All" to revise the notes.'}
      />
    );
  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <section key={topic.id} aria-labelledby={`topic-${topic.id}`} className="ss-panel p-4 md:p-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 id={`topic-${topic.id}`} className="ss-display text-[16px] text-[var(--ink)]">
              {topic.title}
            </h3>
            <span className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              {topic.completed}/{topic.total} completed
            </span>
            {topic.questionCount > 0 && isAppPath(topic.practiceHref) && (
              <Link to={topic.practiceHref} className="ml-auto font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
                Practise {topic.title.toLowerCase()} ({topic.questionCount}) →
              </Link>
            )}
          </div>
          <div className="mt-2">
            <ProgressBar
              done={topic.completed}
              total={topic.total}
              color={SECTION_TONE[section.id].bar}
              label={`${topic.title}: ${topic.completed} of ${topic.total} completed`}
            />
          </div>
          <ul className="mt-2">
            {topic.shown.map((sub) => (
              <SubtopicItem key={sub.id} sub={sub} section={section.id} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The CAT syllabus with concept notes, lesson completion, bookmarks and private notes (Learn tab). */
export default function SyllabusPanel() {
  const { data, isPending, isError, error, refetch } = useSyllabus();
  const [sectionId, setSectionId] = useState<SectionId>('QA');
  const [filter, setFilter] = useState<Filter>('all');

  if (isPending) return <Skeleton rows={3} />;
  if (isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load the syllabus"
        detail={mbaErrorMessage(error)}
        action={{ label: 'Try again', onClick: () => void refetch() }}
      />
    );

  const section = data.sections.find((s) => s.id === sectionId) ?? data.sections[0];
  return (
    <div className="space-y-4">
      <section aria-labelledby="syllabus-progress" className="ss-panel p-4 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="syllabus-progress" className="ss-display text-[17px] text-[var(--ink)]">
            Your syllabus progress
          </h2>
          <span className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {data.progress.completed}/{data.progress.total} lessons · {data.progress.bookmarked} bookmarked
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {data.sections.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between font-[Poppins] text-[12px]">
                <SectionChip section={s.id} />
                <span className="ss-data text-[var(--neutral-600)]">
                  {s.completed}/{s.total}
                </span>
              </div>
              <ProgressBar done={s.completed} total={s.total} color={SECTION_TONE[s.id].bar} label={`${s.title}: ${s.completed} of ${s.total} completed`} />
            </div>
          ))}
        </div>
        <p className="mt-3 font-[Poppins] text-[11px] leading-relaxed text-[var(--neutral-400)]">
          Concept notes are written by ProCounsel. Read a lesson, mark it completed, then practise it or build a short drill.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Syllabus sections" className="flex flex-wrap gap-2">
          {data.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={section.id === s.id}
              onClick={() => setSectionId(s.id)}
              className="cursor-pointer rounded-full border px-4 py-2 font-[Poppins] text-[13px] font-semibold"
              style={{
                borderColor: section.id === s.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                background: section.id === s.id ? 'var(--brand-purple-500)' : '#fff',
                color: section.id === s.id ? '#fff' : 'var(--neutral-600)',
              }}
            >
              {SECTION_SHORT[s.id]}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          Show
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[12px] text-[var(--ink)]"
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SectionView key={section.id} section={section} filter={filter} />
    </div>
  );
}
