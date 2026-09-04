import PageSEO from '@/components/SEO/PageSEO';
import ErrorState from '@/components/common/ErrorState';
import { useAuthStore } from '@/store/AuthStore';
import { firstNameOf, useSchoolShell } from '@/lib/schoolShellContext';
import { Icon } from '@/components/school-student/assets';
import ExpeditionHero from '@/components/school-student/ExpeditionHero';
import CampRow from '@/components/school-student/CampRow';
import ProgressRing from '@/components/school-student/ProgressRing';
import StreakStrip from '@/components/school-student/StreakStrip';
import QuestCard from '@/components/school-student/QuestCard';
import TodaysDrop, { DropSkeleton, NoDropToday } from '@/components/school-student/TodaysDrop';
import { useTodayGame } from '@/lib/useSchoolGames';

/**
 * The dashboard — content only. The shell around it (SchoolStudentLayout) owns
 * the rail, the top bar, the access check and the progress state.
 *
 * The page reads top to bottom as a climb: the ridge shows where the student
 * stands, the camps below it name the four quarters, and everything after that
 * is what they can do today.
 *
 * Three rules the whole area is built on:
 *
 *  1. **Nothing is invented.** Points, streak and progress come from
 *     `schoolStudentProgress`, which starts every student at zero. Where there
 *     is no data yet the page shows an empty state; it never renders sample
 *     numbers a real student would read as their own.
 *  2. **Nothing dead-ends.** A quest is a link only when its destination
 *     exists.
 *  3. **One fetch, and it is the games schedule.** This role still has no
 *     `/api/user/:id` record, so the page never asks for a profile. It asks
 *     `/api/schoolStudent/getTodayGameByGrade` and nothing else, and it renders
 *     a real state for each of that call's three outcomes.
 */
export default function SchoolStudentDashboard() {
  const { view, record, grade, className, studentId } = useSchoolShell();
  const { schoolStudent, user } = useAuthStore();

  // Server record first: it is the only copy that is current, and the only one
  // that is never the "School" placeholder.
  const firstName =
    firstNameOf(record?.firstName, schoolStudent?.firstName, user?.firstName) ?? 'there';

  const todayGame = useTodayGame(grade, studentId);

  const stats: { label: string; value: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { label: 'Tasks completed', value: `${view.tasksCompleted} / ${view.tasksTotal}`, icon: 'completedCheck' },
    { label: 'Points earned', value: `${view.points.toLocaleString('en-IN')} / ${view.pointsTarget.toLocaleString('en-IN')}`, icon: 'starPoints' },
    { label: 'Quizzes played', value: `${view.quizzesPlayed} / ${view.quizzesTarget}`, icon: 'gamesController' },
    { label: 'Streak', value: `${view.streakDays} ${view.streakDays === 1 ? 'Day' : 'Days'}`, icon: 'flameStreak' },
  ];

  return (
    <>
      <PageSEO
        title="Your ProCounsel dashboard"
        description="Your ProCounsel home for school students."
        noIndex
      />

      <div className="mx-auto max-w-[1240px] space-y-6">
        <ExpeditionHero view={view} firstName={firstName} grade={className} />

        <CampRow quarters={view.quarters} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_356px]">
          <div className="space-y-6">
            {/* Today's game, live from the schedule. */}
            <section aria-labelledby="today-heading">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 id="today-heading" className="ss-display text-[20px] text-[var(--ink)]">
                  Today on the mountain
                </h2>
                <span className="ss-eyebrow text-[var(--neutral-400)]">Daily</span>
              </div>

              {todayGame.loading ? (
                <DropSkeleton compact />
              ) : todayGame.error ? (
                <ErrorState
                  variant="inline"
                  title="Today's game didn't load"
                  message={todayGame.error}
                  onRetry={todayGame.reload}
                  showBack={false}
                />
              ) : todayGame.data ? (
                <TodaysDrop drop={todayGame.data} studentId={studentId} compact />
              ) : (
                <NoDropToday compact />
              )}
            </section>

            {/* The current quarter's quests. */}
            <section aria-labelledby="quests-heading">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="quests-heading" className="ss-display text-[20px] text-[var(--ink)]">
                  {view.currentQuarter.code} · {view.currentQuarter.title}
                </h2>
                {view.currentQuarter.daysLeft !== null && view.currentQuarter.daysLeft > 0 && (
                  <span className="ss-eyebrow text-[var(--neutral-400)]">
                    {view.currentQuarter.daysLeft} days left
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {view.currentQuests.map((quest) => (
                  <QuestCard key={quest.key} quest={quest} />
                ))}
              </div>
            </section>
          </div>

          {/* The instruments. */}
          <aside className="flex h-fit flex-col gap-6">
          <StreakStrip streakDays={view.streakDays} lastActiveDate={record?.lastActiveDate ?? null} />

          <section className="ss-panel p-5">
            <h2 className="ss-display text-[17px] text-[var(--ink)]">Your progress</h2>
            <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              Every task you finish moves the marker up the trail.
            </p>

            <div className="mt-4 flex justify-center">
              <ProgressRing percent={view.overallPercent} />
            </div>

            <dl className="mt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="ss-readout">
                  <dt className="flex items-center gap-2">
                    <Icon name={stat.icon} className="h-4 w-4 shrink-0" />
                    <span className="ss-eyebrow text-[var(--neutral-400)]">{stat.label}</span>
                  </dt>
                  <dd className="ss-data text-[13px] text-[var(--ink)]">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <p
              className="mt-4 flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 font-[Poppins] text-[12px] leading-[1.5] text-[#7A5A00]"
              style={{ background: 'var(--gradients-reward-card)', border: '1px solid var(--borders-gold-soft)' }}
            >
              <Icon name="trophyLeaderboard" className="h-4 w-4 shrink-0" />
              {view.nextMilestone
                ? `${view.nextMilestone.title} at ${view.nextMilestone.target.toLocaleString('en-IN')} points — ${(view.nextMilestone.target - view.points).toLocaleString('en-IN')} to go.`
                : 'You have reached the top level. Keep the streak alive.'}
            </p>
          </section>
          </aside>
        </div>
      </div>
    </>
  );
}
