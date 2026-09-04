import { useState } from 'react';
import PageSEO from '@/components/SEO/PageSEO';
import ErrorState from '@/components/common/ErrorState';
import SkyBanner from '@/components/school-student/SkyBanner';
import GameCard from '@/components/school-student/GameCard';
import TodaysDrop, { DropSkeleton, NoDropToday } from '@/components/school-student/TodaysDrop';
import WeekStrip from '@/components/school-student/WeekStrip';
import PastGames from '@/components/school-student/PastGames';
import {
  useGameCatalogue,
  useGameHistory,
  useLongDate,
  useTodayGame,
  useWeekSchedule,
} from '@/lib/useSchoolGames';
import { today as isoToday } from '@/api/schoolGames';
import { useSchoolShell } from '@/lib/schoolShellContext';

/**
 * Games & Quests.
 *
 * The whole page is the backend's answer to two questions — what is scheduled
 * for this student's class today, and what games exist — rendered as an
 * expedition would post them: today's assignment first, the full rack below.
 *
 * The class comes from the shell, which reads it off the server record — not
 * from what signup happened to persist in this browser. `resolveDay` then makes
 * the schedule answerable with or without it, so a student whose class is
 * missing, or whose class the day was not authored for, still gets the day's
 * game rather than an empty page.
 */
export default function SchoolGames() {
  const { view, grade, studentId } = useSchoolShell();

  const todayGame = useTodayGame(grade, studentId);
  const catalogue = useGameCatalogue();
  const week = useWeekSchedule(grade, studentId);
  const history = useGameHistory(grade, studentId);
  const longDate = useLongDate(todayGame.data?.date ?? isoToday());

  const scheduledId = todayGame.data?.gameId ?? null;

  /** Which game's rules are open in the rack. */
  const [openRules, setOpenRules] = useState<string | null>(null);

  const showRules = (gameId: string) => {
    setOpenRules(gameId);
    // After the card has been told to open, not before, or the scroll lands on
    // its collapsed height.
    requestAnimationFrame(() =>
      document.getElementById(`game-${gameId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  return (
    <>
      <PageSEO
        title="Games & quests"
        description="The games and quests on your ProCounsel programme."
        noIndex
      />

      <div className="mx-auto max-w-[1240px] space-y-6">
        <SkyBanner
          eyebrow={grade ? `Class ${grade} · ${longDate}` : longDate}
          title="Games & quests"
          lead="A game a day, scored on the same rules for everyone. Play the daily one to keep your streak, or work through the rack in your own time."
          aside={
            <div className="rounded-2xl border border-white/25 px-4 py-3 backdrop-blur-md" style={{ background: 'rgba(16, 9, 44, 0.72)' }}>
              <p className="ss-eyebrow text-white/55">Day streak</p>
              <p className="ss-data mt-1 text-[24px] leading-none text-white">
                {view.streakDays}
              </p>
            </div>
          }
        />

        {/* ── The week ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="week-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="week-heading" className="ss-display text-[20px] text-[var(--ink)]">
              This week
            </h2>
            <span className="ss-eyebrow text-[var(--neutral-400)]">Tap a day to play</span>
          </div>
          <WeekStrip days={week.data} loading={week.loading} studentId={studentId} />
        </section>

        {/* ── Today ─────────────────────────────────────────────────────────── */}
        <section aria-labelledby="today-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="today-heading" className="ss-display text-[20px] text-[var(--ink)]">
              Today on the mountain
            </h2>
            <span className="ss-eyebrow text-[var(--neutral-400)]">{longDate}</span>
          </div>

          {todayGame.loading ? (
            <DropSkeleton />
          ) : todayGame.error ? (
            <ErrorState
              variant="inline"
              title="Today's game didn't load"
              message={todayGame.error}
              onRetry={todayGame.reload}
              showBack={false}
            />
          ) : todayGame.data ? (
            <TodaysDrop drop={todayGame.data} studentId={studentId} onShowRules={showRules} />
          ) : (
            <NoDropToday />
          )}

          {todayGame.data && !todayGame.data.gradeMatched && !todayGame.loading && (
            <p className="mt-2.5 font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
              {grade
                ? `This day isn't set for class ${grade}, so you're playing the pack the rest of the programme has.`
                : "We don't have your class on file yet, so you're playing the pack the rest of the programme has."}
            </p>
          )}
        </section>

        {/* ── Behind you ────────────────────────────────────────────────────── */}
        <section aria-labelledby="past-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="past-heading" className="ss-display text-[20px] text-[var(--ink)]">
              Earlier games
            </h2>
            <span className="ss-eyebrow text-[var(--neutral-400)]">Still playable</span>
          </div>
          <PastGames days={history.data} loading={history.loading} studentId={studentId} />
        </section>

        {/* ── The rack ──────────────────────────────────────────────────────── */}
        <section id="the-rack" aria-labelledby="rack-heading" className="scroll-mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="rack-heading" className="ss-display text-[20px] text-[var(--ink)]">
              Every game
            </h2>
            {!catalogue.loading && !catalogue.error && catalogue.data.length > 0 && (
              <span className="ss-eyebrow text-[var(--neutral-400)]">
                {catalogue.data.length} games
              </span>
            )}
          </div>

          {catalogue.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="ss-panel h-[320px] animate-pulse bg-[#F7F8FC]" />
              ))}
            </div>
          ) : catalogue.error ? (
            <ErrorState
              variant="inline"
              title="The games didn't load"
              message={catalogue.error}
              onRetry={catalogue.reload}
              showBack={false}
            />
          ) : catalogue.data.length === 0 ? (
            <div className="ss-panel p-8 text-center">
              <p className="ss-display text-[17px] text-[var(--ink)]">No games are open yet</p>
              <p className="mt-1.5 font-[Poppins] text-[12.5px] text-[var(--neutral-500)]">
                The first set goes live with your programme. You&apos;ll see it here.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {catalogue.data.map((game) => (
                <li key={game.gameId}>
                  <GameCard
                    game={game}
                    isToday={game.gameId === scheduledId}
                    open={openRules === game.gameId}
                    onToggle={(next) => setOpenRules(next ? game.gameId : null)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
