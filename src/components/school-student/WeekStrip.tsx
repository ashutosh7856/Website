import { Link } from 'react-router-dom';
import GameMark from '@/components/school-student/GameMark';
import { Icon } from '@/components/school-student/assets';
import { TONE, toneFor } from '@/components/school-student/gameTones';
import { getPlay } from '@/lib/schoolPlays';
import type { ScheduledDay } from '@/lib/useSchoolGames';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Warm the play route's chunk.
 *
 * Every day tile leads to the same lazily-loaded page, so the download can
 * start while the student is still looking at the strip instead of after they
 * tap. Fired once, on hover or first touch — not on mount, which would make the
 * strip cost a chunk nobody asked for.
 */
let warmed = false;
const warmPlayRoute = () => {
  if (warmed) return;
  warmed = true;
  import('@/pages/school/SchoolPlay').catch(() => {
    warmed = false;
  });
};

/**
 * The days around today, as a row of tiles.
 *
 * It answers "what's on, and when" without opening anything, which is most of
 * what a daily game needs to be habit-forming — you can see Thursday is the
 * Number Grid and look forward to it.
 *
 * ─── Which tiles are live ────────────────────────────────────────────────────
 *
 * Today and every day behind it. Not tomorrow.
 *
 * The strip used to run today → today+6 and lock all six, on the rule that a
 * daily game you can run ahead on is not a daily game. The rule is right about
 * the future and was silently doing something else to the past: a student who
 * missed Tuesday had no route back to it from anywhere in the app. Days behind
 * today now open the same board with the same scoring, marked as a catch-up,
 * and days already played show what was scored on them.
 *
 * Horizontally scrollable, because seven 84px tiles do not fit a phone and
 * squeezing them until they do makes every one of them too small to tap. The
 * strip scrolls itself to today on mount so the past does not hide the present.
 */
export default function WeekStrip({
  days,
  loading,
  studentId,
}: {
  days: ScheduledDay[];
  loading: boolean;
  /** Whose play history to mark the tiles with. */
  studentId?: string | null;
}) {
  if (loading) {
    return (
      <div className="flex gap-2.5 overflow-x-auto pb-1" aria-busy>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[104px] w-[68px] sm:w-[84px] shrink-0 animate-pulse rounded-[14px] bg-[#EEF0F6]" />
        ))}
      </div>
    );
  }

  return (
    <ol className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
      {days.map((day) => {
        const date = new Date(`${day.date}T00:00:00`);
        const tone = TONE[toneFor(day.gameId ?? 'quiz')];
        const isToday = day.when === 'today';
        const has = Boolean(day.gameId);
        const reachable = has && day.when !== 'future';
        const play = has ? getPlay(studentId, day.date) : null;
        const session = day.session;
        const played = session ?? play;
        const score = session?.score ?? play?.points ?? 0;

        const inner = (
          <>
            <span
              className="ss-eyebrow"
              style={{ color: isToday ? tone.ink : 'var(--neutral-400)' }}
            >
              {isToday ? 'Today' : DAY[date.getDay()]}
            </span>
            <span className="ss-data mt-0.5 text-[17px] text-[var(--ink)]">{date.getDate()}</span>
            <span className="relative mt-2 flex h-9 items-center justify-center">
              {has ? (
                <GameMark gameId={day.gameId!} size={34} surface="#FFFFFF" />
              ) : (
                <span className="text-[18px] opacity-40" aria-hidden>
                  💤
                </span>
              )}

              {/* A padlock only on days that have not happened. It used to sit
                  on past days too, where it was simply wrong: nothing was
                  locked, the tile just did not respond. */}
              {has && day.when === 'future' && (
                <span
                  className="absolute -right-2 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                  style={{ background: 'var(--slate-ink)' }}
                >
                  <Icon name="lock" className="h-2.5 w-2.5 brightness-0 invert" />
                </span>
              )}

              {/* A tick on a day already played, so the row reads as a record
                  and not only as a schedule. */}
              {played && (
                <span
                  className="absolute -right-2 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] text-[10px] font-bold text-white"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </span>
          </>
        );

        const shell =
          'flex h-[104px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[14px] border px-2 sm:w-[84px] transition-transform active:scale-95';

        const label = played
          ? `${day.title ?? 'Game'} on ${date.toDateString()}, score ${score}`
          : day.when === 'past'
            ? `${day.title ?? 'Game'} on ${date.toDateString()}, time limit crossed`
            : `${day.title ?? 'Game'} on ${date.toDateString()}`;

        return (
          <li key={day.date}>
            {reachable ? (
              <Link
                to={isToday ? '/school-student/play' : `/school-student/play/${day.date}`}
                onMouseEnter={warmPlayRoute}
                onTouchStart={warmPlayRoute}
                onFocus={warmPlayRoute}
                className={shell}
                style={{
                  background: isToday ? tone.tint : '#FFFFFF',
                  borderColor: isToday ? tone.edge : 'var(--card-border)',
                  boxShadow: isToday ? `0 0 0 2px ${tone.tint}` : undefined,
                  // A played day is done, not undone: it stays reachable for a
                  // replay but stops competing for attention with today's.
                  opacity: played && !isToday ? 0.85 : 1,
                }}
                aria-label={label}
              >
                {inner}
              </Link>
            ) : (
              <div
                className={shell}
                // A day with a game coming is a preview, not a locked door: it
                // keeps a white card and just does not respond to a tap. Only a
                // genuine rest day gets the slate treatment.
                style={
                  has
                    ? { background: '#FFFFFF', borderColor: 'var(--card-border)', opacity: 0.72 }
                    : { background: 'var(--slate-surface)', borderColor: 'var(--slate-border)' }
                }
                aria-disabled="true"
                title={
                  !has
                    ? 'Rest day'
                    : day.when === 'past'
                      ? played
                        ? `${day.title ?? 'Game'} — score ${score}`
                        : `${day.title ?? 'Game'} — time limit crossed`
                      : `${day.title ?? 'Game'} — unlocks on the day`
                }
              >
                {inner}
                {day.when === 'past' && has && (
                  <span className="ss-data mt-1 text-[9px] text-[var(--neutral-500)]">
                    {played ? `${score} pts` : 'Missed'}
                  </span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
