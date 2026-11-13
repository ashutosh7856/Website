import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { AnswerInput, HintPanel, SafeHtml, SectionChip, SetPanel, Skeleton, SolutionBlock, SourceLine, StateBlock } from '@/components/mba/ui';
import ProcounselPercentilePanel from '@/components/mba/ProcounselPercentilePanel';
import { accuracyOf, formatDate, formatDuration, formatPercent, sectionShort } from '@/components/mba/format';
import { mbaErrorMessage, mbaStatus, useMbaResult, type AttemptResultQuestion, type ExamSectionId } from '@/api/mba';
import MockAnalyst from '@/components/mba/MockAnalyst';
import { ConfidencePanel } from '@/components/mba/Confidence';
import { CONFIDENCE_LABEL } from '@/components/mba/confidenceLabels';
import ReportIssue from '@/components/mba/ReportIssue';
import { AskDoubtLink } from '@/components/mba/Doubts';

type Outcome = 'correct' | 'incorrect' | 'unanswered';
const outcomeOf = (q: AttemptResultQuestion): Outcome =>
  q.yourAnswer === null || q.yourAnswer === ''
    ? 'unanswered'
    : (q.isCorrect ?? q.yourAnswer === q.correctAnswer)
      ? 'correct'
      : 'incorrect';

const OUTCOME_STYLE: Record<Outcome, { label: string; color: string; bg: string }> = {
  correct: { label: 'Correct', color: 'var(--green-600)', bg: 'var(--green-50)' },
  incorrect: { label: 'Incorrect', color: 'var(--red-500)', bg: 'var(--red-100)' },
  unanswered: { label: 'Skipped', color: 'var(--neutral-500)', bg: 'var(--neutral-100)' },
};

function ReviewItem({ q, number }: { q: AttemptResultQuestion; number: number }) {
  const [open, setOpen] = useState(false);
  const outcome = outcomeOf(q);
  const style = OUTCOME_STYLE[outcome];
  return (
    <li className="ss-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-[Poppins] text-[12px] font-bold" style={{ background: style.bg, color: style.color }}>
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <SectionChip section={q.section} />
            <span className="font-[Poppins] text-[12px] font-semibold" style={{ color: style.color }}>
              {style.label}
            </span>
            <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              {q.marks > 0 ? `+${q.marks}` : q.marks} marks · {formatDuration(q.timeSpentMs)}
              {q.confidence ? ` · you said: ${CONFIDENCE_LABEL[q.confidence].toLowerCase()}` : ''}
            </span>
          </span>
          {q.topic && <span className="mt-0.5 block truncate font-[Poppins] text-[11px] text-[var(--neutral-400)]">{q.topic}</span>}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-[var(--borders-default)] p-4">
          {q.set && <SetPanel set={q.set} />}
          <SafeHtml html={q.stemHtml} />
          <AnswerInput question={q} value={q.yourAnswer} onChange={() => undefined} reveal={{ correctAnswer: q.correctAnswer, yourAnswer: q.yourAnswer }} />
          <SolutionBlock reveal={q} />
          <HintPanel questionId={q.id} studentAnswer={q.yourAnswer} />
          <AskDoubtLink questionId={q.id} />
          <ReportIssue questionId={q.id} />
          <SourceLine source={q.source} year={q.year} slot={q.slot} />
        </div>
      )}
    </li>
  );
}

export default function MbaResult() {
  const { attemptId } = useParams();
  const { data, isPending, isError, error, refetch } = useMbaResult(attemptId);
  const [section, setSection] = useState<ExamSectionId>('all');
  const [outcome, setOutcome] = useState<Outcome | 'all' | 'sure_wrong'>('all');

  const numbered = useMemo(() => {
    const perSection = new Map<ExamSectionId, number>();
    return (data?.questions ?? []).map((q) => {
      const n = (perSection.get(q.section) ?? 0) + 1;
      perSection.set(q.section, n);
      return { q, n };
    });
  }, [data]);

  if (isPending) return <Skeleton rows={4} />;
  if (isError) {
    const notYet = mbaStatus(error) === 404;
    return (
      <StateBlock
        tone={notYet ? 'info' : 'error'}
        title={notYet ? 'This test has not been submitted yet' : "Couldn't load this result"}
        detail={notYet ? 'Results open once the whole test is submitted.' : mbaErrorMessage(error)}
        action={notYet ? { label: 'Back to mock tests', href: '/mba/mocks' } : { label: 'Try again', onClick: () => void refetch() }}
      />
    );
  }

  const totals = data.sections.reduce(
    (acc, s) => ({
      attempted: acc.attempted + s.attempted,
      correct: acc.correct + s.correct,
      time: acc.time + s.timeSpentMs,
    }),
    { attempted: 0, correct: 0, time: 0 },
  );
  const shown = numbered.filter(({ q }) => (section === 'all' || q.section === section) && (outcome === 'all' || outcomeOf(q) === outcome || (outcome === 'sure_wrong' && q.confidence === 'sure' && outcomeOf(q) === 'incorrect')));

  const chip = (active: boolean) =>
    ({
      borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
      background: active ? 'var(--brand-purple-500)' : '#fff',
      color: active ? '#fff' : 'var(--neutral-600)',
    }) as const;

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow={`Result · ${formatDate(data.submittedAt)}`}
        title={data.title}
        aside={
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-white">
            <p className="ss-data text-[34px] leading-none">
              {data.score}
              <span className="text-[16px] text-white/60">/{data.maxScore}</span>
            </p>
            <p className="mt-1 font-[Poppins] text-[11px] text-white/70">overall score</p>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Score', `${data.score}/${data.maxScore}`],
          ['Accuracy', formatPercent(accuracyOf(totals.correct, totals.attempted))],
          ['Attempted', `${totals.attempted}/${data.questions.length}`],
          ['Time spent', formatDuration(totals.time)],
        ].map(([k, v]) => (
          <div key={k} className="ss-panel p-4">
            <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{k}</p>
            <p className="ss-data mt-1 text-[20px] text-[var(--ink)]">{v}</p>
          </div>
        ))}
      </div>

      {data.procounselPercentile && <ProcounselPercentilePanel value={data.procounselPercentile} />}

      <section className="ss-panel overflow-x-auto p-4">
        <h2 className="ss-display mb-3 text-[17px] text-[var(--ink)]">By section</h2>
        <table className="w-full min-w-[520px] font-[Poppins] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-[var(--neutral-500)]">
              <th className="py-2 pr-2 font-semibold">Section</th>
              <th className="px-2 font-semibold">Score</th>
              <th className="px-2 font-semibold">Correct</th>
              <th className="px-2 font-semibold">Wrong</th>
              <th className="px-2 font-semibold">Skipped</th>
              <th className="px-2 font-semibold">Accuracy</th>
              <th className="pl-2 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.sections.map((s) => (
              <tr key={s.id} className="border-t border-[var(--borders-default)] text-[var(--ink)]">
                <td className="py-2.5 pr-2 font-semibold">
                  {sectionShort(s.id)}
                  {s.countsInTotal === false && (
                    <span className="block text-[10px] font-normal text-[var(--neutral-500)]">Not in total</span>
                  )}
                </td>
                <td className="px-2">
                  {s.score}/{s.maxScore}
                  {!!s.penalty && (
                    <span className="block text-[10px] text-[var(--neutral-500)]">incl. {s.penalty} for skipped</span>
                  )}
                </td>
                <td className="px-2 text-[var(--green-600)]">{s.correct}</td>
                <td className="px-2 text-[var(--red-500)]">{s.incorrect}</td>
                <td className="px-2 text-[var(--neutral-500)]">{s.unanswered}</td>
                <td className="px-2">{formatPercent(accuracyOf(s.correct, s.attempted))}</td>
                <td className="pl-2">{formatDuration(s.timeSpentMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {data.confidence && <ConfidencePanel breakdown={data.confidence} />}

      <MockAnalyst attemptId={data.id} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="ss-display w-full text-[17px] text-[var(--ink)] sm:mr-auto sm:w-auto">Question review</h2>
          {['all', ...data.sections.map((s) => s.id)].map((s) => (
            <button key={s} type="button" aria-pressed={section === s} onClick={() => setSection(s)} className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold" style={chip(section === s)}>
              {s === 'all' ? 'All' : sectionShort(s)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'correct', 'incorrect', 'unanswered'] as const).map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(o)} className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold" style={chip(outcome === o)}>
              {o === 'all' ? 'Every question' : OUTCOME_STYLE[o].label}
            </button>
          ))}
          {!!data.confidence?.sure.incorrect && (
            <button type="button" aria-pressed={outcome === 'sure_wrong'} onClick={() => setOutcome('sure_wrong')} className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold" style={chip(outcome === 'sure_wrong')}>
              Sure but wrong
            </button>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">No questions match this filter.</p>
        ) : (
          <ol className="space-y-2">
            {shown.map(({ q, n }) => (
              <ReviewItem key={q.id} q={q} number={n} />
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/mba/mistakes" className="btn-secondary px-4 py-2.5 font-[Poppins] text-[13px] font-semibold">
          Open mistakes notebook
        </Link>
        <Link to={data.isPyq ? '/mba/pyq' : data.examId && data.examId !== 'cat' ? `/mba/mocks?exam=${data.examId}` : '/mba/mocks'} className="btn-primary px-4 py-2.5 font-[Poppins] text-[13px] font-semibold">
          {data.isPyq ? 'Back to past papers' : 'Back to mock tests'}
        </Link>
      </div>
    </div>
  );
}
