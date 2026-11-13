import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { SECTION_SHORT } from '@/components/mba/format';
import { StartPanel } from '@/pages/mba/MbaMocks';
import { mbaErrorMessage } from '@/api/mba';
import { useMbaPyq, type PyqPaper, type PyqTest } from '@/api/mbaPyq';

const chip = (active: boolean) =>
  ({
    borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
    background: active ? 'var(--brand-purple-500)' : '#fff',
    color: active ? '#fff' : 'var(--neutral-600)',
  }) as const;

/** "3 sections · 66 questions · 120 min (40 min each)" for a year's papers. */
function patternLine(paper: PyqPaper): string {
  const minutes = paper.sections.map((s) => s.durationMinutes);
  const same = minutes.every((m) => m === minutes[0]);
  return `${paper.sections.length} sections · ${paper.questionCount} questions · ${paper.durationMinutes} min${
    same && minutes.length ? ` (${minutes[0]} min each)` : ''
  }`;
}

function TestRow({ test, onStart }: { test: PyqTest; onStart: (t: PyqTest) => void }) {
  const full = test.kind === 'full_mock';
  const resuming = !!test.inProgressAttemptId;
  const p = test.procounselPercentile;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          {full ? (
            <span className="font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">Full paper</span>
          ) : (
            <SectionChip section={test.sections[0]} />
          )}
          {resuming && (
            <span className="rounded-full bg-[var(--gold-100)] px-2 py-0.5 font-[Poppins] text-[10px] font-bold text-[var(--gold-600)]">
              In progress
            </span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" aria-hidden /> {test.questionCount} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden /> {test.durationMinutes} min
          </span>
          {test.bestScore !== null && test.maxScore !== null && (
            <span>
              Best {test.bestScore}/{test.maxScore}
              {test.attempts > 1 ? ` · ${test.attempts} attempts` : ''}
            </span>
          )}
          {p && p.percentile !== null && (
            <span title="Among ProCounsel students' first attempts. Not an official CAT percentile.">
              ProCounsel percentile {p.percentile.toFixed(1)}
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {test.lastAttemptId && (
          <Link
            to={`/mba/results/${test.lastAttemptId}`}
            className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)] hover:underline"
          >
            Result
          </Link>
        )}
        <button
          type="button"
          onClick={() => onStart(test)}
          aria-label={`${resuming ? 'Resume' : test.attempts ? 'Retake' : 'Start'} ${test.title}`}
          className={`${resuming ? 'btn-gold text-white' : test.attempts ? 'btn-secondary' : 'btn-primary'} cursor-pointer rounded-xl px-3.5 py-2 font-[Poppins] text-[12px] font-semibold`}
        >
          {resuming ? 'Resume' : test.attempts ? 'Retake' : 'Start'}
        </button>
      </span>
    </li>
  );
}

function SlotCard({ paper, onStart }: { paper: PyqPaper; onStart: (t: PyqTest) => void }) {
  const tests = [...paper.tests].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'full_mock' ? -1 : 1));
  const done = paper.tests.some((t) => t.attempts > 0);
  return (
    <article className="ss-panel flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="ss-display text-[16px] text-[var(--ink)]">Slot {paper.slot}</h3>
        {done && (
          <span className="rounded-full bg-[var(--green-50)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--green-600)]">
            Attempted
          </span>
        )}
      </div>
      <ul className="mt-1 divide-y divide-[var(--borders-default)]">
        {tests.map((t) => (
          <TestRow key={t.testId} test={t} onStart={onStart} />
        ))}
      </ul>
      {paper.source?.url && (
        <p className="mt-auto pt-2 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
          Source:{' '}
          <a href={paper.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
            {paper.source.title}
          </a>
        </p>
      )}
    </article>
  );
}

/** /mba/pyq — actual past CAT papers by year and slot, as full papers or one section at a time. */
export default function MbaPyq() {
  const { data, isPending, isError, error, refetch } = useMbaPyq();
  const [year, setYear] = useState<number | 'all'>('all');
  const [selected, setSelected] = useState<PyqTest | null>(null);

  const byYear = useMemo(() => {
    const groups = new Map<number, PyqPaper[]>();
    for (const paper of data?.papers ?? []) groups.set(paper.year, [...(groups.get(paper.year) ?? []), paper]);
    return [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(([y, papers]) => ({ year: y, papers: papers.sort((a, b) => a.slot - b.slot) }));
  }, [data]);
  const years = byYear.map((g) => g.year);
  const shown = byYear.filter((g) => year === 'all' || g.year === year);

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="Past papers"
        title="Previous-year CAT papers"
        lead="The actual CAT papers, timed the way they were set. Take a full paper or one section at a time."
      />

      {isPending ? (
        <Skeleton rows={3} />
      ) : isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load past papers"
          detail={mbaErrorMessage(error)}
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : data.papers.length === 0 ? (
        <StateBlock
          tone="empty"
          title="Past papers are being added"
          detail="We're checking each previous-year paper against its answer key. Papers appear here as soon as they're published."
          action={{ label: 'Take a ProCounsel mock', href: '/mba/mocks' }}
        />
      ) : (
        <>
          <p className="ss-panel p-4 font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-600)]">
            Your ProCounsel percentile compares your first attempt of a test with other ProCounsel students&rsquo;
            first attempts of the same test, once {data.minStudents} have taken it. It is not your official CAT
            percentile.
          </p>

          {years.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Year">
              {(['all', ...years] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={year === y}
                  onClick={() => setYear(y)}
                  className="cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
                  style={chip(year === y)}
                >
                  {y === 'all' ? 'All years' : `CAT ${y}`}
                </button>
              ))}
            </div>
          )}

          {shown.map((group) => (
            <section key={group.year} aria-labelledby={`pyq-${group.year}`} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id={`pyq-${group.year}`} className="ss-display text-[19px] text-[var(--ink)]">
                    CAT {group.year}
                  </h2>
                  <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
                    {patternLine(group.papers[0])} ·{' '}
                    {group.papers[0].sections.map((s) => `${SECTION_SHORT[s.id]} ${s.questionCount}`).join(', ')}
                  </p>
                </div>
                <Link
                  to={`/mba/practice?source=pyq&year=${group.year}`}
                  className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)] hover:underline"
                >
                  Practise CAT {group.year} questions
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.papers.map((paper) => (
                  <SlotCard key={paper.paperId} paper={paper} onStart={setSelected} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {selected && (
        <StartPanel
          test={{
            id: selected.testId,
            title: selected.title,
            questionCount: selected.questionCount,
            durationMinutes: selected.durationMinutes,
            sections: selected.sections,
          }}
          resuming={!!selected.inProgressAttemptId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
