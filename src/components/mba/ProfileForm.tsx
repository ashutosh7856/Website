import { useState, type FormEvent } from 'react';
import { MBA_EXAMS, mbaErrorMessage, useSaveMbaProfile, type ExamId, type MbaLevel, type MbaProfile, type MbaProfileInput } from '@/api/mba';

const LEVELS: { id: MbaLevel; label: string; detail: string }[] = [
  { id: 'beginner', label: 'Just starting', detail: 'New to CAT-style questions' },
  { id: 'intermediate', label: 'Some practice', detail: 'Solved a few papers or mocks' },
  { id: 'advanced', label: 'Mock-ready', detail: 'Taking full mocks regularly' },
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Onboarding answers (PUT /mba/me/profile). Used by the onboarding page and,
 * prefilled, by the profile page.
 */
export default function ProfileForm({
  initial,
  submitLabel,
  onSaved,
}: {
  initial: MbaProfile | null;
  submitLabel: string;
  onSaved?: (profile: MbaProfile) => void;
}) {
  const save = useSaveMbaProfile();
  const [examDate, setExamDate] = useState(initial?.examDate ?? '');
  const [percentile, setPercentile] = useState(
    initial?.targetPercentile != null ? String(initial.targetPercentile) : '',
  );
  const [level, setLevel] = useState<MbaLevel | null>(initial?.currentLevel ?? null);
  const [hours, setHours] = useState(String(initial?.weeklyStudyHours ?? 10));
  const [days, setDays] = useState<number[]>(initial?.studyDays ?? [1, 2, 3, 4, 5]);
  // CAT is always on; the others add their mocks and practice next to CAT's.
  const [exams, setExams] = useState<ExamId[]>(initial?.targetExams ?? ['cat']);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggleExam = (id: ExamId) =>
    setExams((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const hoursNum = Number(hours);
    const pctNum = percentile.trim() === '' ? undefined : Number(percentile);
    if (!level) return setError('Pick where you are right now.');
    if (!Number.isInteger(hoursNum) || hoursNum < 1 || hoursNum > 80)
      return setError('Weekly study hours must be a whole number from 1 to 80.');
    if (pctNum !== undefined && (Number.isNaN(pctNum) || pctNum < 0 || pctNum > 100))
      return setError('Target percentile must be between 0 and 100.');
    if (days.length === 0) return setError('Pick at least one study day.');

    const body: MbaProfileInput = {
      targetExam: 'cat',
      currentLevel: level,
      weeklyStudyHours: hoursNum,
      studyDays: days,
      ...(examDate ? { examDate } : {}),
      ...(pctNum !== undefined ? { targetPercentile: pctNum } : {}),
      ...(initial?.targetPrograms ? { targetPrograms: initial.targetPrograms } : {}),
      targetExams: MBA_EXAMS.map((e) => e.id).filter((id) => id === 'cat' || exams.includes(id)),
    };
    save.mutate(body, {
      onSuccess: (profile) => {
        setSaved(true);
        onSaved?.(profile);
      },
      onError: (err) => setError(mbaErrorMessage(err, 'Could not save. Please try again.')),
    });
  };

  const label = 'block font-[Poppins] text-[13px] font-semibold text-[var(--ink)]';
  const input =
    'mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[14px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          CAT exam date <span className="font-normal text-[var(--neutral-400)]">(optional)</span>
          <input type="date" min={todayIso()} value={examDate} onChange={(e) => setExamDate(e.target.value)} className={input} />
        </label>
        <label className={label}>
          Target percentile <span className="font-normal text-[var(--neutral-400)]">(optional)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.1"
            placeholder="e.g. 95"
            value={percentile}
            onChange={(e) => setPercentile(e.target.value)}
            className={input}
          />
        </label>
      </div>

      <fieldset>
        <legend className={label}>
          Exams you&rsquo;re taking <span className="font-normal text-[var(--neutral-400)]">(pick all that apply)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MBA_EXAMS.map((e) => {
            const on = e.id === 'cat' || exams.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                aria-pressed={on}
                disabled={e.id === 'cat'}
                title={e.id === 'cat' ? 'CAT practice is always included' : e.name}
                onClick={() => toggleExam(e.id)}
                className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold disabled:cursor-default"
                style={{
                  borderColor: on ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                  background: on ? 'var(--brand-purple-500)' : '#fff',
                  color: on ? '#fff' : 'var(--neutral-600)',
                }}
              >
                {e.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          Mocks and practice for each exam you pick appear next to CAT&rsquo;s, as soon as we publish them.
        </p>
      </fieldset>

      <fieldset>
        <legend className={label}>Where are you right now?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={level === l.id}
              onClick={() => setLevel(l.id)}
              className="cursor-pointer rounded-xl border-2 px-3.5 py-3 text-left"
              style={{
                borderColor: level === l.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                background: level === l.id ? 'var(--brand-purple-50)' : '#fff',
              }}
            >
              <span className="block font-[Poppins] text-[13px] font-bold text-[var(--ink)]">{l.label}</span>
              <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{l.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className={label}>
        Hours you can study per week
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={80}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className={`${input} max-w-[160px]`}
        />
      </label>

      <fieldset>
        <legend className={label}>Study days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(i)}
              onClick={() => toggleDay(i)}
              className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
              style={{
                borderColor: days.includes(i) ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                background: days.includes(i) ? 'var(--brand-purple-500)' : '#fff',
                color: days.includes(i) ? '#fff' : 'var(--neutral-600)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="font-[Poppins] text-[13px] text-[var(--red-500)]">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="font-[Poppins] text-[13px] text-[var(--green-600)]" aria-live="polite">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={save.isPending}
        className="btn-primary w-full cursor-pointer px-6 py-3 font-[Poppins] text-[14px] font-semibold disabled:opacity-60 sm:w-auto"
      >
        {save.isPending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
