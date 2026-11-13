import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SkyBanner from '@/components/school-student/SkyBanner';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import ScoreEstimateCard from '@/components/mba/ScoreEstimateCard';
import { formatDate, formatDuration, formatPercent, sectionShort } from '@/components/mba/format';
import ExamSwitcher from '@/components/mba/ExamSwitcher';
import { useExamChoice } from '@/lib/mbaExamChoice';
import { mbaErrorMessage, SECTIONS, useMbaExamConfig, type ExamSectionId } from '@/api/mba';
import { isAppPath, useMbaInsights, type TopicStatus } from '@/api/mbaInsights';
import ConfidenceCard from '@/components/mba/ConfidenceCard';

const STATUS: Record<TopicStatus, { label: string; color: string; bg: string }> = {
  weak: { label: 'Weak', color: 'var(--red-500)', bg: 'var(--red-100)' },
  ok: { label: 'Steady', color: 'var(--neutral-600)', bg: 'var(--neutral-100)' },
  strong: { label: 'Strong', color: 'var(--green-600)', bg: 'var(--green-50)' },
  low_evidence: { label: 'Low confidence', color: '#92400E', bg: 'var(--gold-50)' },
};
const pct = (v: number | null) => formatPercent(v === null ? null : v * 100);

const chip = (active: boolean) =>
  ({
    borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
    background: active ? 'var(--brand-purple-500)' : '#fff',
    color: active ? '#fff' : 'var(--neutral-600)',
  }) as const;

/** /mba/insights — topic accuracy (weak only with enough answers) and the last five mocks by section. */
export default function MbaInsights() {
  const { examId, options, setExamId } = useExamChoice();
  const isCat = examId === 'cat';
  const examConfig = useMbaExamConfig(examId);
  const examSections: ExamSectionId[] = isCat ? SECTIONS : (examConfig.data?.versions[0]?.sections.map((x) => x.id) ?? []);
  const { data, isPending, isError, error, refetch } = useMbaInsights(examId);
  const [section, setSection] = useState<ExamSectionId>('all');
  const topics = useMemo(
    () => (data?.topics ?? []).filter((t) => section === 'all' || t.section === section),
    [data, section],
  );

  if (isPending) return <Skeleton rows={3} />;
  if (isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load your insights"
        detail={mbaErrorMessage(error)}
        action={{ label: 'Try again', onClick: () => void refetch() }}
      />
    );

  const sectionsInTrend = examSections.filter((s) => data.trend.some((t) => t.sections.some((x) => x.id === s)));

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Insights"
        title="Where you lose marks"
        lead={`Topic accuracy from every answer you've given. A topic is called weak only after ${data.rules.minAttempts} answers.`}
      />

      <ExamSwitcher examId={examId} options={options} onChange={(id) => { setSection('all'); setExamId(id); }} />

      {isCat && <ScoreEstimateCard variant="full" />}

      <section className="ss-panel overflow-x-auto p-4" aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="ss-display mb-3 text-[17px] text-[var(--ink)]">
          Last {data.trend.length || 5} mocks
        </h2>
        {data.trend.length === 0 ? (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
            No submitted mock yet. <Link to={isCat ? '/mba/mocks' : `/mba/mocks?exam=${examId}`} className="font-semibold text-[var(--brand-purple-700)]">Take one</Link> to start your trend.
          </p>
        ) : (
          <table className="w-full min-w-[520px] font-[Poppins] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-[var(--neutral-500)]">
                <th className="py-2 pr-2 font-semibold">Mock</th>
                <th className="px-2 font-semibold">Score</th>
                {sectionsInTrend.map((s) => (
                  <th key={s} className="px-2 font-semibold">
                    {sectionShort(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.trend.map((t) => (
                <tr key={t.attemptId} className="border-t border-[var(--borders-default)] text-[var(--ink)]">
                  <td className="py-2.5 pr-2">
                    <Link to={`/mba/results/${t.attemptId}`} className="font-semibold hover:underline">
                      {t.title}
                    </Link>
                    <span className="block text-[11px] text-[var(--neutral-500)]">{formatDate(t.submittedAt)}</span>
                  </td>
                  <td className="px-2 font-semibold">
                    {t.score}/{t.maxScore}
                  </td>
                  {sectionsInTrend.map((s) => {
                    const x = t.sections.find((y) => y.id === s);
                    return (
                      <td key={s} className="px-2">
                        {x ? (
                          <>
                            {x.score}/{x.maxScore}
                            <span className="block text-[11px] text-[var(--neutral-500)]">{pct(x.accuracy)} acc.</span>
                          </>
                        ) : (
                          <span className="text-[var(--neutral-400)]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="ss-panel space-y-3 p-4" aria-labelledby="topics-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="topics-heading" className="ss-display w-full text-[17px] text-[var(--ink)] sm:mr-auto sm:w-auto">
            By topic
          </h2>
          {['all', ...examSections].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={section === s}
              onClick={() => setSection(s)}
              className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold"
              style={chip(section === s)}
            >
              {s === 'all' ? 'All' : sectionShort(s)}
            </button>
          ))}
        </div>
        {topics.length === 0 ? (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
            No answers here yet. <Link to={isCat ? '/mba/practice' : `/mba/practice?exam=${examId}`} className="font-semibold text-[var(--brand-purple-700)]">Practise</Link> to see topic accuracy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] font-[Poppins] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] text-[var(--neutral-500)]">
                  <th className="py-2 pr-2 font-semibold">Topic</th>
                  <th className="px-2 font-semibold">Answers</th>
                  <th className="px-2 font-semibold">Accuracy</th>
                  <th className="px-2 font-semibold">Avg time (mocks)</th>
                  <th className="px-2 font-semibold">Status</th>
                  <th className="pl-2" />
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => {
                  const st = STATUS[t.status];
                  return (
                    <tr key={`${t.section}-${t.topic}`} className="border-t border-[var(--borders-default)] text-[var(--ink)]">
                      <td className="py-2.5 pr-2">
                        <span className="flex items-center gap-2">
                          <SectionChip section={t.section} />
                          <span className="font-semibold">{t.topic}</span>
                        </span>
                      </td>
                      <td className="px-2">
                        {t.correct}/{t.attempts}
                      </td>
                      <td className="px-2">{pct(t.accuracy)}</td>
                      <td className="px-2">{t.avgTimeMs === null ? '—' : formatDuration(t.avgTimeMs)}</td>
                      <td className="px-2">
                        <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="pl-2 text-right">
                        {isAppPath(t.href) && (
                          <Link to={t.href} className="whitespace-nowrap text-[12px] font-semibold text-[var(--brand-purple-700)]">
                            Practise
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          Weak = below {Math.round(data.rules.weakBelow * 100)}% after at least {data.rules.minAttempts} answers. Low confidence = fewer
          answers, so the accuracy may still move a lot. Average time comes from submitted mocks only.
        </p>
      </section>

      {isCat && <ConfidenceCard />}
    </div>
  );
}
