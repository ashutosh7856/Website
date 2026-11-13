import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Clock, FileText, X } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import BuildTestLink from '@/components/mba/BuildTestLink';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { formatDate, sectionShort } from '@/components/mba/format';
import ShellPortal from '@/components/mba/ShellPortal';
import ExamSwitcher from '@/components/mba/ExamSwitcher';
import { useExamChoice } from '@/lib/mbaExamChoice';
import {
  examLabel,
  mbaErrorMessage,
  useMbaAttempts,
  useMbaExamConfig,
  useMbaExamTests,
  type ExamVersion,
  type MbaTest,
  type TimerBlock,
} from '@/api/mba';

const signed = (n: number) => (n > 0 ? `+${n}` : n === 0 ? '0' : `−${Math.abs(n)}`);
const listNames = (ids: string[]) => ids.map(sectionShort).join(', ');

/** Marking lines from the exam version (the official scheme, or the stated practice scheme). */
function markingLines(version: ExamVersion | undefined): string[] {
  if (!version) return [];
  if (version.scoringNote) return [version.scoringNote];
  return version.marking.map(
    (r) =>
      `${r.type === 'TITA' ? 'Type-in answers' : 'Multiple choice'}${r.sections?.length ? ` (${listNames(r.sections)})` : ''}: ${signed(r.correct)} correct, ${signed(r.incorrect)} wrong, ${signed(r.unanswered)} unanswered.`,
  );
}

/** How the test is timed, in plain words. */
function timingLine(blocks: TimerBlock[] | undefined, minutes: number): string {
  if (!blocks || blocks.every((b) => b.sectionIds.length === 1))
    return 'Each section has its own timer. When it runs out, the section is submitted for you and the next one opens.';
  if (blocks.length === 1)
    return `One ${minutes}-minute timer for the whole test. Move between sections freely and answer in any order.`;
  return (
    blocks
      .map((b) =>
        b.sectionIds.length > 1
          ? `${b.name ?? 'Part'}: ${listNames(b.sectionIds)} share ${b.durationMinutes} minutes — move freely between them`
          : `${b.name ?? sectionShort(b.sectionIds[0])}: ${b.durationMinutes} minutes`,
      )
      .join('. Then ') + '. You cannot go back to a part once it is submitted or its time runs out.'
  );
}

/** The start / resume dialog; also used by the previous-year papers page. */
export function StartPanel({
  test,
  resuming,
  onClose,
}: {
  test: Pick<MbaTest, 'id' | 'title' | 'questionCount' | 'durationMinutes' | 'sections'> &
    Partial<Pick<MbaTest, 'examId' | 'timerBlocks' | 'sectionOrderLocked' | 'examVersionYear'>>;
  resuming: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const examId = test.examId ?? 'cat';
  const exam = useMbaExamConfig(examId).data;
  const version = exam?.versions.find((v) => v.year === test.examVersionYear) ?? exam?.versions[0];
  const blocks = test.timerBlocks;
  // NMAT / GMAT: the student picks the section order before the first timer starts.
  const pickOrder = !resuming && test.sectionOrderLocked === false && (blocks?.length ?? 0) > 1;
  const [order, setOrder] = useState<string[]>(() => (blocks ?? []).map((b) => b.id));
  const move = (i: number, by: number) =>
    setOrder((prev) => {
      const next = [...prev];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  const start = () =>
    navigate(`/mba/exam/${encodeURIComponent(test.id)}${pickOrder ? `?order=${encodeURIComponent(order.join(','))}` : ''}`);
  return (
    <ShellPortal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal aria-labelledby="mba-start-title">
      <div className="ss-panel w-full max-w-[520px] rounded-b-none p-5 sm:rounded-b-[inherit] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="mba-start-title" className="ss-display text-[19px] text-[var(--ink)]">
            {resuming ? 'Resume' : 'Start'} {test.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-lg p-1 hover:bg-[var(--neutral-100)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          <li>
            {test.questionCount} questions · {test.durationMinutes} minutes · sections: {listNames(test.sections)}.
          </li>
          <li>{timingLine(blocks, test.durationMinutes)}</li>
          {examId !== 'cat' && markingLines(version).map((line) => <li key={line}>Marking: {line}</li>)}
          {exam?.adaptive && (
            <li>
              The real {examLabel(examId)} is computer-adaptive: questions change with your answers. This practice test is
              fixed, so its score is a practice score, not a {examLabel(examId)} score.
            </li>
          )}
          <li>Your answers save automatically. If you close the tab or lose connection, come back and resume where you left off — the clock keeps running.</li>
          <li>Answers and solutions appear only after you submit the whole test. The AI tutor is not available during a mock.</li>
        </ul>
        {pickOrder && (
          <fieldset className="mt-4">
            <legend className="font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">Choose your section order</legend>
            <ol className="mt-2 space-y-1.5">
              {order.map((id, i) => (
                <li key={id} className="flex items-center gap-2 rounded-xl border border-[var(--borders-default)] px-3 py-2 font-[Poppins] text-[13px]">
                  <span className="w-5 text-[var(--neutral-400)]">{i + 1}.</span>
                  <span className="flex-1 font-semibold text-[var(--ink)]">{sectionShort(id)}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${sectionShort(id)} up`} className="cursor-pointer rounded-lg p-1 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${sectionShort(id)} down`} className="cursor-pointer rounded-lg p-1 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          </fieldset>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold">
            Not now
          </button>
          <button
            type="button"
            onClick={start}
            className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            {resuming ? 'Resume test' : 'Start test'}
          </button>
        </div>
      </div>
    </div>
    </ShellPortal>
  );
}

export default function MbaMocks() {
  const { examId, options, setExamId } = useExamChoice();
  const tests = useMbaExamTests(examId);
  const attempts = useMbaAttempts();
  const isCat = examId === 'cat';
  const [selected, setSelected] = useState<MbaTest | null>(null);

  // Previous-year papers have their own page (/mba/pyq); this one lists ProCounsel mocks.
  const mocks = (tests.data?.tests ?? []).filter((t) => !t.isPyq);
  const inProgress = new Set(
    (attempts.data?.attempts ?? []).filter((a) => a.status === 'in_progress').map((a) => a.testId),
  );
  const past = (attempts.data?.attempts ?? []).filter((a) => a.status === 'submitted');

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="Mock tests"
        title={`ProCounsel mocks, real ${examLabel(examId)} timing`}
        lead={
          isCat
            ? 'Full mocks and sectionals of original CAT-pattern questions, scored with the official marking scheme.'
            : `Original questions in the official ${examLabel(examId)} pattern, timed and marked the way the exam body describes it.`
        }
      />

      <ExamSwitcher examId={examId} options={options} onChange={setExamId} />

      {isCat && (
      <Link
        to="/mba/pyq"
        className="ss-panel flex items-center justify-between gap-3 p-4 font-[Poppins] text-[13px] text-[var(--ink)] hover:opacity-90"
      >
        <span>
          <span className="block font-semibold">Want the actual CAT papers?</span>
          <span className="block text-[12px] text-[var(--neutral-500)]">
            Previous-year CAT papers, timed the way they were set.
          </span>
        </span>
        <span className="btn-secondary shrink-0 px-4 py-2 text-[12px] font-semibold">Past papers</span>
      </Link>
      )}

      {isCat && <BuildTestLink />}

      {tests.isPending ? (
        <Skeleton rows={3} />
      ) : tests.isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load mock tests"
          detail={mbaErrorMessage(tests.error)}
          action={{ label: 'Try again', onClick: () => void tests.refetch() }}
        />
      ) : mocks.length === 0 ? (
        <StateBlock
          tone="empty"
          title="Mocks are being prepared"
          detail={`We're writing and checking ProCounsel ${examLabel(examId)} mocks. They'll appear here as soon as each one is published.`}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mocks.map((t) => {
            const resuming = inProgress.has(t.id);
            return (
              <article key={t.id} className="ss-panel flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--brand-purple-50)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--brand-purple-700)]">
                    {t.kind === 'full_mock' ? 'Full mock' : 'Sectional'}
                  </span>
                  {resuming && (
                    <span className="rounded-full bg-[var(--gold-100)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--gold-600)]">
                      In progress
                    </span>
                  )}
                </div>
                <h3 className="ss-display text-[16px] text-[var(--ink)]">{t.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {t.sections.map((s) => (
                    <SectionChip key={s} section={s} />
                  ))}
                </div>
                <p className="flex items-center gap-3 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {t.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {t.durationMinutes} min
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className={`${resuming ? 'btn-gold text-white' : 'btn-primary'} mt-auto cursor-pointer rounded-xl px-4 py-2.5 font-[Poppins] text-[13px] font-semibold`}
                >
                  {resuming ? 'Resume' : 'Start'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <section className="ss-panel p-5">
        <h2 className="ss-display text-[17px] text-[var(--ink)]">Your results</h2>
        {attempts.isPending ? (
          <div className="mt-3">
            <Skeleton rows={1} />
          </div>
        ) : attempts.isError ? (
          <p role="alert" className="mt-2 font-[Poppins] text-[13px] text-[var(--red-500)]">
            {mbaErrorMessage(attempts.error)}
          </p>
        ) : past.length === 0 ? (
          <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">Submitted mocks will be listed here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--borders-default)]">
            {past.map((a) => (
              <li key={a.id}>
                <Link to={`/mba/results/${a.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{a.title}</span>
                    <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{formatDate(a.submittedAt)}</span>
                  </span>
                  {a.score != null && a.maxScore != null && (
                    <span className="ss-data text-[16px] text-[var(--ink)]">
                      {a.score}
                      <span className="text-[12px] text-[var(--neutral-400)]">/{a.maxScore}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && <StartPanel test={selected} resuming={inProgress.has(selected.id)} onClose={() => setSelected(null)} />}
    </div>
  );
}
