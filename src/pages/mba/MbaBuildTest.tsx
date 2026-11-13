import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Shuffle, Target, Zap } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { SECTION_SHORT } from '@/components/mba/format';
import { mbaErrorMessage, SECTIONS, type QuestionSource, type SectionId } from '@/api/mba';
import {
  newClientToken,
  useCreateDrill,
  useDrillOptions,
  type Difficulty,
  type DrillCreate,
  type DrillMode,
  type DrillOptions,
} from '@/api/mbaDrills';

/**
 * /mba/mocks/build — the test builder. Presets ("15-min Quant drill", "Weak
 * topics set") and a custom form. The server picks the questions (never ones
 * from a test you are taking), keeps passage/DILR sets together and times it;
 * the test then runs in the normal mock player and shows up in your results.
 */

const QUICK_DRILL_MINUTES = 15;
const DEFAULT_COUNT = 10;

const MODES: { id: DrillMode; label: string; detail: string }[] = [
  { id: 'timed', label: 'Timed drill', detail: 'One section, one clock.' },
  { id: 'mixed', label: 'Mixed set', detail: 'Questions from the sections and topics you pick.' },
  { id: 'weak', label: 'Weak topics', detail: 'Due mistakes, lucky guesses and your weakest topics.' },
];
const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];
const SOURCES: { id: QuestionSource; label: string }[] = [
  { id: 'all', label: 'All questions' },
  { id: 'pyq', label: 'Previous-year papers' },
  { id: 'original', label: 'ProCounsel originals' },
];

function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
        background: active ? 'var(--brand-purple-500)' : '#fff',
        color: active ? '#fff' : 'var(--neutral-600)',
      }}
    >
      {children}
    </button>
  );
}

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** Rough automatic time for the form preview; the server sets the real one per section. */
function autoMinutes(options: DrillOptions, sections: SectionId[], count: number): number {
  const chosen = options.sections.filter((s) => sections.length === 0 || sections.includes(s.id));
  if (chosen.length === 0) return 0;
  const pace = chosen.reduce((sum, s) => sum + s.minutesPerQuestion, 0) / chosen.length;
  return Math.ceil(count * pace);
}

function PresetCard({
  icon,
  title,
  detail,
  action,
  onClick,
  disabled,
  busy,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <article className="ss-panel flex flex-col gap-2 p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-purple-50)] text-[var(--brand-purple-700)]">{icon}</span>
      <h3 className="ss-display text-[16px] text-[var(--ink)]">{title}</h3>
      <p className="font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">{detail}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        className="btn-primary mt-auto cursor-pointer rounded-xl px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Building…' : action}
      </button>
    </article>
  );
}

export default function MbaBuildTest() {
  const navigate = useNavigate();
  const options = useDrillOptions();
  const create = useCreateDrill();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ?section=QA&topic=Arithmetic&subtopic=… prefills the custom form (the syllabus "Build a drill" link).
  const [params] = useSearchParams();
  const [mode, setMode] = useState<DrillMode>('mixed');
  const [sections, setSections] = useState<SectionId[]>(() =>
    SECTIONS.includes(params.get('section') as SectionId) ? [params.get('section') as SectionId] : [],
  );
  const [topics, setTopics] = useState<string[]>(() => (params.get('topic') ? [params.get('topic') as string] : []));
  const [subtopics, setSubtopics] = useState<string[]>(() => (params.get('topic') ? params.getAll('subtopic').slice(0, 100) : []));
  const [difficulty, setDifficulty] = useState<Difficulty[]>([]);
  const [source, setSource] = useState<QuestionSource>('all');
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [autoTime, setAutoTime] = useState(true);
  const [minutes, setMinutes] = useState(20);

  const topicOptions = useMemo(
    () =>
      (options.data?.sections ?? [])
        .filter((s) => sections.length === 0 || sections.includes(s.id))
        .flatMap((s) => s.topics.map((t) => ({ ...t, section: s.id }))),
    [options.data, sections],
  );
  const subtopicOptions = topics.length === 1 ? (topicOptions.find((t) => t.topic === topics[0])?.subtopics ?? []) : [];

  const start = (key: string, body: Omit<DrillCreate, 'clientToken'>) => {
    setError(null);
    setPending(key);
    create.mutate(
      { ...body, clientToken: newClientToken() },
      {
        onSuccess: (attempt) => navigate(`/mba/exam/${encodeURIComponent(attempt.testId)}`),
        onError: (err) => {
          setPending(null);
          setError(mbaErrorMessage(err, 'Could not build the test. Try again.'));
        },
      },
    );
  };

  if (options.isPending) return <Skeleton rows={3} />;
  if (options.isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load the test builder"
        detail={mbaErrorMessage(options.error)}
        action={{ label: 'Try again', onClick: () => void options.refetch() }}
      />
    );

  const data = options.data;
  const qa = data.sections.find((s) => s.id === 'QA');
  const quickCount = qa ? Math.max(1, Math.min(qa.questionCount, Math.floor(QUICK_DRILL_MINUTES / qa.minutesPerQuestion))) : 0;
  const toRevise = data.mistakesDue + data.luckyGuesses + data.weakTopics.length;
  const busy = create.isPending || pending !== null;
  const timedNeedsSection = mode === 'timed' && sections.length !== 1;
  const estimate = autoMinutes(data, sections, count);
  const selectClass =
    'rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[12px] text-[var(--ink)]';

  const setModeAndSections = (next: DrillMode) => {
    setMode(next);
    if (next === 'timed' && sections.length !== 1) setSections(['QA']);
  };
  const pickSection = (s: SectionId) => {
    setTopics([]);
    setSubtopics([]);
    setSections(mode === 'timed' ? [s] : toggle(sections, s));
  };

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Build a test"
        title="Practise on your terms"
        lead="Pick a quick drill or build your own set. It runs like a mock: timed, scored with CAT marking, and saved in your results."
      />

      {data.inProgress && (
        <div className="ss-panel flex flex-wrap items-center gap-3 p-4" role="status">
          <p className="min-w-0 flex-1 font-[Poppins] text-[13px] text-[var(--neutral-700)]">
            You have a test in progress: <span className="font-semibold text-[var(--ink)]">{data.inProgress.title}</span>. Finish it before building another.
          </p>
          <Link
            to={`/mba/exam/${encodeURIComponent(data.inProgress.testId)}`}
            className="btn-gold rounded-xl px-4 py-2 font-[Poppins] text-[13px] font-semibold text-white"
          >
            Resume
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="font-[Poppins] text-[13px] text-[var(--red-500)]">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <PresetCard
          icon={<Zap className="h-5 w-5" />}
          title={`${QUICK_DRILL_MINUTES}-min Quant drill`}
          detail={`${quickCount} Quant questions at CAT pace, questions you haven't tried first.`}
          action="Start drill"
          disabled={!!data.inProgress || quickCount === 0}
          busy={pending === 'quant'}
          onClick={() => start('quant', { mode: 'timed', sections: ['QA'], count: quickCount, timeLimitMinutes: QUICK_DRILL_MINUTES })}
        />
        <PresetCard
          icon={<Target className="h-5 w-5" />}
          title="Weak topics set"
          detail={
            toRevise > 0
              ? `${DEFAULT_COUNT} questions from your due mistakes (${data.mistakesDue}), lucky guesses (${data.luckyGuesses}) and weakest topics.`
              : 'Nothing to revise yet. A topic counts as weak after 8 answers under 60% accuracy.'
          }
          action="Start set"
          disabled={!!data.inProgress || toRevise === 0}
          busy={pending === 'weak'}
          onClick={() => start('weak', { mode: 'weak', count: DEFAULT_COUNT, timeLimitMinutes: null })}
        />
        <PresetCard
          icon={<Shuffle className="h-5 w-5" />}
          title="Custom"
          detail="Choose sections, topics, difficulty, source, number of questions and time."
          action="Set it up below"
          onClick={() => document.getElementById('custom-builder')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <section id="custom-builder" className="ss-panel space-y-5 p-5" aria-labelledby="custom-heading">
        <h2 id="custom-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Custom test
        </h2>

        <fieldset className="space-y-2">
          <legend className="ss-eyebrow text-[var(--neutral-500)]">Type</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => setModeAndSections(m.id)}
                className="cursor-pointer rounded-xl border p-3 text-left"
                style={{
                  borderColor: mode === m.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                  background: mode === m.id ? 'var(--brand-purple-50)' : '#fff',
                }}
              >
                <span className="block font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">{m.label}</span>
                <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{m.detail}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="ss-eyebrow text-[var(--neutral-500)]">{mode === 'timed' ? 'Section' : 'Sections'}</legend>
          <div className="flex flex-wrap gap-2">
            {mode !== 'timed' && (
              <Chip active={sections.length === 0} onClick={() => { setSections([]); setTopics([]); setSubtopics([]); }}>
                All sections
              </Chip>
            )}
            {SECTIONS.map((s) => {
              const n = data.sections.find((x) => x.id === s)?.questionCount ?? 0;
              return (
                <Chip key={s} active={sections.includes(s)} onClick={() => pickSection(s)} disabled={n === 0}>
                  {SECTION_SHORT[s]} · {n}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        {mode !== 'weak' && topicOptions.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="ss-eyebrow text-[var(--neutral-500)]">Topics (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map((t) => (
                <Chip
                  key={`${t.section}-${t.topic}`}
                  active={topics.includes(t.topic)}
                  onClick={() => {
                    setTopics(toggle(topics, t.topic));
                    setSubtopics([]);
                  }}
                >
                  {t.topic} · {t.questionCount}
                </Chip>
              ))}
            </div>
            {subtopicOptions.length > 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {subtopicOptions.map((s) => (
                  <Chip key={s.subtopic} active={subtopics.includes(s.subtopic)} onClick={() => setSubtopics(toggle(subtopics, s.subtopic))}>
                    {s.subtopic} · {s.questionCount}
                  </Chip>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {mode === 'weak' && (
          <p className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">
            {data.weakTopics.length > 0
              ? `Weak topics: ${data.weakTopics.map((w) => `${w.topic} (${Math.round(w.accuracy * 100)}%)`).join(', ')}.`
              : 'No weak topic yet.'}{' '}
            {data.mistakesDue} mistakes due · {data.luckyGuesses} lucky guesses.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="ss-eyebrow text-[var(--neutral-500)]">Difficulty (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Chip key={d.id} active={difficulty.includes(d.id)} onClick={() => setDifficulty(toggle(difficulty, d.id))}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <label htmlFor="drill-source" className="ss-eyebrow block text-[var(--neutral-500)]">
              Source
            </label>
            <select id="drill-source" className={selectClass} value={source} onChange={(e) => setSource(e.target.value as QuestionSource)}>
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id} disabled={data.sources[s.id] === 0}>
                  {s.label} ({data.sources[s.id]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="drill-count" className="ss-eyebrow block text-[var(--neutral-500)]">
              Questions
            </label>
            <input
              id="drill-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={data.limits.maxCount}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(data.limits.maxCount, Number(e.target.value) || 1)))}
              className={`${selectClass} w-28`}
            />
            <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">Passage and DILR sets are kept together.</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="ss-eyebrow text-[var(--neutral-500)]">Time</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={autoTime} onClick={() => setAutoTime(true)}>
                CAT pace{estimate ? ` · about ${estimate} min` : ''}
              </Chip>
              <Chip active={!autoTime} onClick={() => setAutoTime(false)}>
                Set my own
              </Chip>
              {!autoTime && (
                <label className="flex items-center gap-1.5 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={data.limits.maxMinutes}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(1, Math.min(data.limits.maxMinutes, Number(e.target.value) || 1)))}
                    className={`${selectClass} w-20`}
                    aria-label="Minutes"
                  />
                  min
                </label>
              )}
            </div>
            <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              <Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Each section has its own timer, as in CAT.
            </p>
          </fieldset>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--borders-default)] pt-4 sm:flex-row sm:items-center sm:justify-end">
          {timedNeedsSection && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)] sm:mr-auto">A timed drill covers one section — pick one above.</p>
          )}
          <button
            type="button"
            disabled={busy || !!data.inProgress || timedNeedsSection}
            onClick={() =>
              start('custom', {
                mode,
                sections,
                topics: mode === 'weak' ? [] : topics,
                subtopics: mode === 'weak' ? [] : subtopics,
                difficulty,
                source,
                count,
                timeLimitMinutes: autoTime ? null : minutes,
              })
            }
            className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === 'custom' ? 'Building…' : 'Start test'}
          </button>
        </div>
      </section>
    </div>
  );
}
