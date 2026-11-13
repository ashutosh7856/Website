import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';
import StreakStrip from '@/components/school-student/StreakStrip';
import ProgressRing from '@/components/school-student/ProgressRing';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import RoadToIimHero from '@/components/mba/RoadToIimHero';
import CampRoute from '@/components/mba/CampRoute';
import NextCampCard from '@/components/mba/NextCampCard';
import SectionRings from '@/components/mba/SectionRings';
import InsightsCard from '@/components/mba/InsightsCard';
import ScoreEstimateCard from '@/components/mba/ScoreEstimateCard';
import TodayPlanCard from '@/components/mba/TodayPlanCard';
import ExamUpdatesCard from '@/components/mba/ExamUpdatesCard';
import { accuracyOf, formatDate } from '@/components/mba/format';
import { mbaErrorMessage, useMbaDashboard, type AttemptSummary, type MbaDashboard as Dashboard } from '@/api/mba';
import { useMbaShell } from '@/lib/mbaShellContext';
import { climbFrom } from '@/lib/mbaLevels';

/** Server-sent hrefs are only followed when they are in-app paths. */
const isAppPath = (href: string) => href.startsWith('/') && !href.startsWith('//');

const attemptHref = (a: AttemptSummary) =>
  a.status === 'submitted' ? `/mba/results/${a.id}` : `/mba/exam/${encodeURIComponent(a.testId)}`;

function Priorities({ items }: { items: Dashboard['priorities'] }) {
  return (
    <section className="ss-panel p-5">
      <h2 className="ss-display text-[17px] text-[var(--ink)]">Today&rsquo;s priorities</h2>
      {items.length === 0 ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          Nothing queued for today. Pick a section in Practice to keep going.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.slice(0, 3).map((p, i) => {
            const inner = (
              <>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-100)] font-[Poppins] text-[12px] font-bold text-[var(--brand-purple-700)]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{p.title}</span>
                  <span className="block font-[Poppins] text-[12px] text-[var(--neutral-500)]">{p.detail}</span>
                </span>
                {isAppPath(p.href) && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--neutral-400)]" />}
              </>
            );
            return (
              <li key={`${p.kind}-${i}`}>
                {isAppPath(p.href) ? (
                  <Link to={p.href} className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-3 hover:bg-[var(--brand-purple-50)]">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/**
 * The MBA dashboard — Road to IIM.
 *
 * The page reads as a climb, like the school dashboard it borrows its shell
 * from: the hero is the ridge with seven camps on it, the card under it is the
 * next camp's requirements, and everything after that is what to do today.
 *
 * Every number comes from GET /mba/me/dashboard. Camps are derived from it in
 * `mbaLevels` and never stored, so the page cannot disagree with the counts it
 * shows beside them.
 */
export default function MbaDashboard() {
  const { firstName, profile } = useMbaShell();
  const { data, isPending, isError, error, refetch } = useMbaDashboard();

  const climb = useMemo(
    () =>
      data
        ? climbFrom({
            // The shell only renders this page once the profile exists, but the
            // dashboard's own copy is the one this response was computed from.
            onboarded: !!(data.profile ?? profile),
            totals: data.totals,
            sections: data.sections,
          })
        : null,
    [data, profile],
  );

  if (isPending) return <Skeleton rows={4} />;
  if (isError || !climb)
    return (
      <StateBlock
        tone="error"
        title="We couldn't load your dashboard"
        detail={mbaErrorMessage(error)}
        action={{ label: 'Try again', onClick: () => void refetch() }}
      />
    );

  const { totals } = data;
  const overall = accuracyOf(totals.correct, totals.questionsAttempted);
  const target = data.profile?.targetPercentile ?? profile?.targetPercentile;

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <RoadToIimHero
        climb={climb}
        firstName={firstName}
        daysToExam={data.daysToExam}
        examDate={data.profile?.examDate ?? profile?.examDate}
        streakDays={data.streak.current}
        targetPercentile={target}
      />

      {data.inProgressAttempt && (
        <Link
          to={attemptHref(data.inProgressAttempt)}
          className="ss-panel flex items-center gap-3 border-2 border-[var(--gold-400)] p-4 hover:bg-[var(--gold-50)]"
        >
          <PlayCircle className="h-8 w-8 shrink-0 text-[var(--gold-600)]" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-[Poppins] text-[14px] font-bold text-[var(--ink)]">Resume your mock</span>
            <span className="block truncate font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              {data.inProgressAttempt.title}, started {formatDate(data.inProgressAttempt.startedAt)}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-[var(--neutral-400)]" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <NextCampCard climb={climb} />
            <Priorities items={data.priorities} />
          </div>

          <ExamUpdatesCard />

          <TodayPlanCard />

          <SectionRings sections={data.sections} />

          <RecentAttempts attempts={data.recentAttempts} />
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <CampRoute climb={climb} />

          <StreakStrip streakDays={data.streak.current} lastActiveDate={data.streak.lastActiveDate} />

          <ScoreEstimateCard />

          <InsightsCard />

          <section aria-labelledby="numbers-heading" className="ss-panel p-5">
            <h2 id="numbers-heading" className="ss-display text-[17px] text-[var(--ink)]">
              Your numbers
            </h2>
            <div className="mt-4 flex flex-col items-center gap-4">
              {overall !== null ? (
                <ProgressRing percent={overall} label="accuracy" ariaLabel="Overall accuracy" size={120} />
              ) : (
                <Link to="/mba/practice" className="btn-primary px-4 py-2.5 text-center font-[Poppins] text-[13px] font-semibold">
                  Solve your first question
                </Link>
              )}
              <dl className="w-full">
                {[
                  ['Questions solved', totals.questionsAttempted],
                  ['Mocks completed', totals.mocksCompleted],
                  ['Mistakes due', totals.mistakesDue],
                  ['Bookmarked', totals.bookmarked],
                ].map(([label, value]) => (
                  <div key={label} className="ss-readout">
                    <dt className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">{label}</dt>
                    <dd className="ss-data text-[15px] text-[var(--ink)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function RecentAttempts({ attempts }: { attempts: AttemptSummary[] }) {
  return (
    <section aria-labelledby="recent-heading" className="ss-panel p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Recent attempts
        </h2>
        <Link to="/mba/mocks" className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
          All mocks
        </Link>
      </div>
      {attempts.length === 0 ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          You haven&rsquo;t taken a mock yet. A full mock is the best diagnostic of where you stand.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--borders-default)]">
          {attempts.map((a) => (
            <li key={a.id}>
              <Link to={attemptHref(a)} className="flex items-center gap-3 py-3 hover:opacity-80">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{a.title}</span>
                  <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">
                    {formatDate(a.submittedAt ?? a.startedAt)}
                    {a.status === 'in_progress' ? ', in progress' : ''}
                  </span>
                </span>
                {a.status === 'in_progress' ? (
                  <span className="shrink-0 rounded-full bg-[var(--gold-100)] px-2.5 py-1 font-[Poppins] text-[11px] font-semibold text-[#92400E]">
                    Resume
                  </span>
                ) : (
                  a.score != null &&
                  a.maxScore != null && (
                    <span className="ss-data shrink-0 text-[16px] text-[var(--ink)]">
                      {a.score}
                      <span className="text-[12px] text-[var(--neutral-400)]">/{a.maxScore}</span>
                    </span>
                  )
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
