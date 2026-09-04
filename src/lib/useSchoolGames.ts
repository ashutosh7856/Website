import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getGame,
  getSession,
  getSet,
  listGames,
  resolveDay,
  today as isoToday,
  type Game,
  type GameSession,
  type GameSet,
} from '@/api/schoolGames';

/**
 * The two reads every game surface needs: the catalogue, and what is on today.
 *
 * Both hooks follow the same contract — `loading` starts true, exactly one of
 * `data` / `error` is meaningful once it is false, and `reload` is stable so it
 * can sit straight on a retry button. Requests are aborted on unmount, so a
 * student who bounces between pages never gets a late response writing into a
 * dead component.
 */

type Async<T> = { data: T; loading: boolean; error: string | null; reload: () => void };

const FAILED = 'We could not reach the games service. Check your connection and try again.';

/** How far past an empty day to look for the next scheduled game. */
const LOOKAHEAD_DAYS = 6;

const addDays = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoToday(date);
};

export function useGameCatalogue(): Async<Game[]> {
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Ignore late answers rather than aborting — see useSchoolStudentRecord.
    let ignore = false;
    setLoading(true);
    setError(null);

    listGames(nonce > 0)
      .then((games) => {
        if (ignore) return;
        setData(games.filter((game) => game.isActive));
        setLoading(false);
      })
      .catch((cause) => {
        if (ignore) return;
        console.error('School games catalogue failed:', cause);
        setError(FAILED);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, reload };
}

export type TodayDrop = {
  /** The date this game is scheduled for. Not always today — see `isToday`. */
  date: string;
  /**
   * False when today had nothing and this is the next scheduled day instead.
   * The schedule has gaps (there was no game on 30 or 31 August 2026, and the
   * run started on the 1st), and "No game today" full stop leaves a student
   * with nothing to come back for. Naming the next one gives them a date.
   */
  isToday: boolean;
  gameId: string;
  /** The pack this grade opens. Null when the day is scheduled but ungraded. */
  setId: string | null;
  /** The schedule's own title, which names the set for the day. */
  title: string | null;
  game: Game | null;
  set: GameSet | null;
  /** The student's attempt, if they have one. Null means "not played yet". */
  session: GameSession | null;
  /** False when the pack was inferred because the day does not name this class. */
  gradeMatched: boolean;
};

/**
 * What is scheduled for today.
 *
 * The grade matters: one date can point class 8 and class 10 at different
 * packs, so with a grade we ask the graded route and learn the set; without
 * one we fall back to the ungraded schedule, which names the game but not the
 * pack. `data: null` with no error is the ordinary "nothing is scheduled
 * today" answer, not a failure.
 */
export function useTodayGame(
  grade: number | null,
  studentId: string | null,
): Async<TodayDrop | null> {
  const [data, setData] = useState<TodayDrop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // The date is read once per mount: recomputing it in the effect body would
  // re-run the whole chain at midnight for anyone with the tab left open.
  const date = useRef(isoToday()).current;

  useEffect(() => {
    let ignore = false;
    const fresh = nonce > 0;
    setLoading(true);
    setError(null);

    /** Ask the schedule for one date. Null means nothing is on. */
    const scheduleFor = async (on: string): Promise<TodayDrop | null> => {
      const scheduled = await resolveDay(on, grade, fresh);
      if (!scheduled) return null;

      const [game, set, session] = await Promise.all([
        getGame(scheduled.gameId, fresh).catch(() => null),
        scheduled.setId ? getSet(scheduled.setId, fresh).catch(() => null) : Promise.resolve(null),
        // A session only exists for a day that has already happened.
        studentId && on === date
          ? getSession(studentId, on, fresh).catch(() => null)
          : Promise.resolve(null),
      ]);

      return {
        date: on,
        isToday: on === date,
        gameId: scheduled.gameId,
        setId: scheduled.setId,
        title: scheduled.title,
        game,
        set,
        session,
        gradeMatched: scheduled.gradeMatched,
      } satisfies TodayDrop;
    };

    const load = async () => {
      const today = await scheduleFor(date);
      if (today) return today;

      /*
       * Nothing today. Look ahead a week for the next one, all at once rather
       * than day by day — six small GETs in one round trip beats six sequential
       * round trips, and the transport dedupes and caches them anyway.
       */
      const ahead = Array.from({ length: LOOKAHEAD_DAYS }, (_, i) => addDays(date, i + 1));
      const results = await Promise.all(
        ahead.map((on) => scheduleFor(on).catch(() => null)),
      );
      return results.find(Boolean) ?? null;
    };

    load()
      .then((drop) => {
        if (ignore) return;
        setData(drop);
        setLoading(false);
      })
      .catch((cause) => {
        if (ignore) return;
        console.error("School games — today's schedule failed:", cause);
        setError(FAILED);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [date, grade, studentId, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, reload };
}

/** Long-form date for the "today" headings — "Friday, 29 August". */
export function useLongDate(iso: string): string {
  return useMemo(() => {
    const parsed = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return iso;
    return parsed.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [iso]);
}

export type ScheduledDay = {
  date: string;
  gameId: string | null;
  setId: string | null;
  title: string | null;
  /** Where this day sits relative to the student's own clock. */
  when: 'past' | 'today' | 'future';
  session: GameSession | null;
};

/** One schedule read, narrowed to a grade where we have one. */
async function dayFor(
  date: string,
  grade: number | null,
  today: string,
  studentId: string | null,
): Promise<ScheduledDay> {
  const scheduled = await resolveDay(date, grade).catch(() => null);

  const session =
    scheduled?.gameId && studentId && date <= today
      ? await getSession(studentId, date).catch(() => null)
      : null;

  return {
    date,
    gameId: scheduled?.gameId ?? null,
    setId: scheduled?.setId ?? null,
    title: scheduled?.title ?? null,
    when: date === today ? 'today' : date < today ? 'past' : 'future',
    session,
  } satisfies ScheduledDay;
}

/**
 * The strip of days around today.
 *
 * It used to run today → today+6, which made the whole of a student's history
 * unreachable: miss Tuesday and Tuesday was simply gone. Days behind today are
 * as much a part of a daily game as days ahead — one is a catch-up, the other a
 * preview — so the window now straddles today and `WeekStrip` renders the two
 * halves differently.
 *
 * All the reads fire together; the transport dedupes and caches them, so the
 * strip still costs about one round trip. Days with nothing scheduled come back
 * with `gameId: null` and are shown as rest days rather than hidden: a gap the
 * student can see is information, a gap silently skipped is confusing.
 */
export function useWeekSchedule(
  grade: number | null,
  studentId: string | null,
  past = 3,
  future = 3,
) {
  const [data, setData] = useState<ScheduledDay[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useRef(isoToday()).current;

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const dates = Array.from({ length: past + future + 1 }, (_, i) => addDays(today, i - past));
    Promise.all(dates.map((date) => dayFor(date, grade, today, studentId))).then((rows) => {
      if (ignore) return;
      setData(rows);
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [today, grade, studentId, past, future]);

  return { data, loading };
}

/**
 * Days already played, or missed — the archive behind "today".
 *
 * Looks back `days` from yesterday and keeps only the dates that actually had a
 * game scheduled for this grade. Rest days are dropped here (unlike the week
 * strip) because a list of past days is a list of things you can still do, and
 * a row saying "nothing happened on the 4th" is not one of them.
 *
 * Fired as one batch of small GETs. Three weeks is 21 of them, every one cached
 * by the transport for the next mount, which is cheaper than it looks and much
 * cheaper than paging.
 */
export function useGameHistory(
  grade: number | null,
  studentId: string | null,
  days = 21,
) {
  const [data, setData] = useState<ScheduledDay[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useRef(isoToday()).current;

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    // i + 1 so the window ends yesterday: today belongs to the drop above it,
    // and listing it twice makes the page look like it has two of them.
    const dates = Array.from({ length: days }, (_, i) => addDays(today, -(i + 1)));

    Promise.all(dates.map((date) => dayFor(date, grade, today, studentId)))
      .then((rows) => {
        if (ignore) return;
        setData(rows.filter((row) => row.gameId));
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setData([]);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [today, grade, studentId, days]);

  return { data, loading };
}
