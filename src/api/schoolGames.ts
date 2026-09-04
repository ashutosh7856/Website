/**
 * The games half of /api/schoolStudent.
 *
 * Transport, the Accept header and the "500 means nothing here" rule all live
 * in schoolStudentApi — read that file's header before touching this one.
 */

import { invalidateSchoolCache, schoolGet } from '@/api/schoolStudentApi';
import { API_CONFIG } from '@/api/config';

// ── Shapes, as the live API actually returns them ────────────────────────────

/** How a game is played. Drives which board the player page opens. */
export type GameEngine =
  | 'quiz_mcq_v1'
  | 'binary_card_v1'
  | 'sudoku_v1'
  | 'word_guess_v1'
  | (string & {});

export type Game = {
  gameId: string;
  name: string;
  description: string;
  engine: GameEngine;
  isActive: boolean;
  sortOrder: number;
  defaultTimeLimitSecs: number;
  /** Set for per-answer scoring (quiz, flags); null for solve-or-nothing games. */
  pointsPerCorrect: number | null;
  /** Set for solve-or-nothing games (sudoku, word); null for per-answer ones. */
  solvePoints: number | null;
  passingPercent: number;
  speedBonus: number;
  noMistakeBonus: number;
  supportsHints: boolean;
  hintPenalty: number;
  oneAttemptPerDay: boolean;
};

/** What is scheduled for one date, for one grade. */
export type TodayGame = {
  date: string;
  gameId: string;
  setId: string | null;
  itemId: string | null;
  title: string | null;
  status: string;
};

/** The same schedule row before it is narrowed to a grade. */
export type TodaySchedule = {
  date: string;
  gameId: string;
  title: string | null;
  status: string;
  plays: number;
  avgPercent: number;
  linkedTaskId: string | null;
  byGrade: Record<string, { setId: string | null; itemId: string | null }> | null;
};

/** A pack of questions: the unit a day's game is actually drawn from. */
export type GameSet = {
  setId: string;
  gameId: string;
  title: string;
  status: string;
  isActive: boolean;
  grades: number[];
  itemCount: number;
  points: number;
  timeLimitSecs: number;
  mode: string;
  /** "free" or a paid tier — what it costs to open the set. */
  passTier: string;
  setNumber: number | null;
  quarter: number | null;
  plays: number;
  avgPercent: number;
  cycleId: string;
};

export type GameSession = {
  studentId?: string;
  date?: string;
  gameId?: string;
  setId?: string;
  status?: string;
  score?: number;
  percent?: number;
  correct?: number;
  total?: number;
  completedAt?: string;
};

export type CreateGameSession = {
  studentId: string;
  /** Calendar date in the student's timezone. */
  date: string;
  gameId: string;
  setId: string | null;
  status: 'completed';
  /** Final points after correct answers, bonuses and hint penalties. */
  score: number;
};

// ── Calls ─────────────────────────────────────────────────────────────────────

/** Every game in the catalogue, already ordered the way the backend wants. */
export async function listGames(fresh = false): Promise<Game[]> {
  const games = await schoolGet<Game[]>('/getAllGames', { fresh });
  if (!Array.isArray(games)) return [];
  return [...games].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export const getGame = (gameId: string, fresh = false) =>
  schoolGet<Game>(`/getGameById?gameId=${encodeURIComponent(gameId)}`, { fresh });

/**
 * The game scheduled for a date, narrowed to the student's grade.
 *
 * Answers the "nothing here" envelope — i.e. `null` — for any grade the day was
 * not authored for, which is every grade outside 8-10 today. Prefer `resolveDay`
 * over calling this directly: on its own it turns a scheduled day into an empty
 * one for a class 7 student.
 */
export const getTodayGameByGrade = (date: string, grade: number, fresh = false) =>
  schoolGet<TodayGame>(
    `/getTodayGameByGrade?date=${encodeURIComponent(date)}&grade=${grade}`,
    { fresh },
  );

export const getSchedule = (date: string, fresh = false) =>
  schoolGet<TodaySchedule>(`/getTodayGame?date=${encodeURIComponent(date)}`, { fresh });

/** One day's game, already narrowed to a pack the student can actually open. */
export type ResolvedDay = {
  date: string;
  gameId: string;
  setId: string | null;
  itemId: string | null;
  title: string | null;
  status: string;
  /**
   * False when the pack was inferred rather than authored for this grade —
   * either the student has no class on file, or their class is outside the
   * grades the day names. Surfaces are free to say so; none of them may
   * withhold the game over it.
   */
  gradeMatched: boolean;
};

/** Every distinct pack a day points at, ignoring which grade points at it. */
const distinctPacks = (byGrade: TodaySchedule['byGrade']) => {
  const seen = new Map<string, { setId: string | null; itemId: string | null }>();
  for (const entry of Object.values(byGrade ?? {})) {
    if (!entry) continue;
    seen.set(`${entry.setId ?? ''}|${entry.itemId ?? ''}`, entry);
  }
  return [...seen.values()];
};

/**
 * The pack for a grade, and the answer when that grade is not on the day.
 *
 * The programme's days are authored per grade but, in practice, every grade on
 * a day points at the SAME pack — so refusing to pick one for an unlisted class
 * withholds a game for no reason at all. The order here is deliberate:
 *
 *   1. the grade's own entry, when the day names it;
 *   2. the day's only pack, when every grade shares one — no ambiguity to lose;
 *   3. the nearest grade's pack, when they genuinely differ, which at least
 *      gives a class 11 student the class 10 pack rather than nothing.
 */
function packFor(
  byGrade: TodaySchedule['byGrade'],
  grade: number | null,
): { setId: string | null; itemId: string | null; matched: boolean } {
  const exact = grade != null ? byGrade?.[String(grade)] : null;
  if (exact) return { setId: exact.setId ?? null, itemId: exact.itemId ?? null, matched: true };

  const packs = distinctPacks(byGrade);
  if (packs.length === 1) {
    return { setId: packs[0].setId ?? null, itemId: packs[0].itemId ?? null, matched: false };
  }

  const grades = Object.keys(byGrade ?? {})
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (!grades.length) return { setId: null, itemId: null, matched: false };

  const nearest =
    grade == null
      ? grades[0]
      : grades.reduce((best, n) => (Math.abs(n - grade) < Math.abs(best - grade) ? n : best));
  const entry = byGrade?.[String(nearest)];
  return { setId: entry?.setId ?? null, itemId: entry?.itemId ?? null, matched: false };
}

/**
 * What is on for one date — the single call every game surface should make.
 *
 * It exists because the two schedule routes each answer half the question and
 * both of them used to be able to hand a student an empty day for a day that is
 * scheduled:
 *
 *   - `getTodayGameByGrade` knows the pack but only for the grades the day was
 *     authored for. Class 6, 7, 11 and 12 get "No game configured for grade",
 *     which surfaced as "Nothing scheduled" on a day that has a game.
 *   - `getTodayGame` knows every day but leaves the pack inside `byGrade`, and
 *     callers with no class on file read `byGrade[null]` — so the day loaded,
 *     the game named itself, and then no questions could be fetched because the
 *     set id was null. That is the "question pack isn't available" screen.
 *
 * So the graded route is asked first (it is the authored answer) and the
 * ungraded one backs it up for everyone else. Both are cached and deduped by
 * path, so asking for both costs one round trip on a repeat.
 *
 * A fault is still a fault: only the "nothing here" envelope — which is what an
 * unlisted grade answers — falls through to the second route. A malformed or
 * genuinely failing response throws, so an outage reads as one.
 */
export async function resolveDay(
  date: string,
  grade: number | null,
  fresh = false,
): Promise<ResolvedDay | null> {
  if (grade != null) {
    const graded = await getTodayGameByGrade(date, grade, fresh);
    if (graded?.gameId) {
      return {
        date: graded.date ?? date,
        gameId: graded.gameId,
        setId: graded.setId ?? null,
        itemId: graded.itemId ?? null,
        title: graded.title ?? null,
        status: graded.status ?? 'scheduled',
        gradeMatched: true,
      };
    }
  }

  const schedule = await getSchedule(date, fresh);
  if (!schedule?.gameId) return null;

  const pack = packFor(schedule.byGrade, grade);
  return {
    date: schedule.date ?? date,
    gameId: schedule.gameId,
    setId: pack.setId,
    itemId: pack.itemId,
    title: schedule.title ?? null,
    status: schedule.status ?? 'scheduled',
    gradeMatched: pack.matched,
  };
}

export const getSet = (setId: string, fresh = false) =>
  schoolGet<GameSet>(`/getGameSetById?setId=${encodeURIComponent(setId)}`, { fresh });

export const getSession = (studentId: string, date: string, fresh = false) =>
  schoolGet<GameSession>(
    `/getGameSession?studentId=${encodeURIComponent(studentId)}&date=${encodeURIComponent(date)}`,
    { fresh },
  );

/** Persist a completed attempt and let the backend update student progress. */
export async function createGameSession(input: CreateGameSession): Promise<GameSession> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error('Game session date must use yyyy-mm-dd.');
  }

  const payload: CreateGameSession = {
    ...input,
    studentId: input.studentId.trim(),
    gameId: input.gameId.trim(),
    setId: input.setId?.trim() || null,
    score: Math.max(0, Math.round(input.score)),
  };
  if (!payload.studentId || !payload.gameId) {
    throw new Error('A student and game are required to save the session.');
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/api/schoolStudent/createGameSession`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let data: unknown = null;
  try {
    data = raw.trim() ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`We couldn't save this game (HTTP ${response.status}).`);
  }

  if (!response.ok || (typeof data === 'object' && data !== null && 'success' in data && data.success === false)) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `We couldn't save this game (HTTP ${response.status}).`;
    throw new Error(message);
  }

  invalidateSchoolCache('getGameSession');
  invalidateSchoolCache('getSchoolStudentById');
  invalidateSchoolCache('getAllSchoolStudents');
  return (data ?? payload) as GameSession;
}

// ── Small helpers the game surfaces share ────────────────────────────────────

export { today, parseGrade } from '@/api/schoolStudentApi';

/** 120 → "2 min", 90 → "1 min 30 s", 45 → "45 s". */
export function duration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '\u2014';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (!mins) return `${secs} s`;
  if (!secs) return `${mins} min`;
  return `${mins} min ${secs} s`;
}

/** What a student earns, phrased from the scoring fields the game carries. */
export function scoringLabel(game: Game): string {
  if (game.pointsPerCorrect) {
    return `${game.pointsPerCorrect} point${game.pointsPerCorrect === 1 ? '' : 's'} per correct answer`;
  }
  if (game.solvePoints) return `${game.solvePoints} points for solving it`;
  return 'Points on completion';
}
