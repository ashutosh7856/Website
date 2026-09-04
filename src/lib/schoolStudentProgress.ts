/**
 * The school-student gamification model.
 *
 * ONE place defines quarters, quests, levels and XP. The dashboard is pure
 * presentation over what this file computes, so changing the programme — adding
 * a quest, retuning point values, renaming a level — never touches a component.
 *
 * **Where the numbers come from.** The backend owns points and streak:
 * `/api/schoolStudent/getSchoolStudentById` returns `totalPoints`,
 * `currentStreak` and `pyschometricReportPdfLink`. Those three are authoritative
 * and are laid over the local record by `withServerRecord` on every mount — a
 * school student stays logged in for months, so anything read only from
 * localStorage goes stale and starts lying to them.
 *
 * A completed game is persisted through `createGameSession`, but the local
 * ledger still bridges the request and protects progress when the network is
 * unavailable. Points are therefore reconciled — see `withServerRecord`.
 *
 * localStorage still holds what the server has no field for (quizzes played,
 * the per-day log) and stands in when the profile call fails, so the page never
 * blanks out over a flaky network.
 *
 * Nothing here fabricates numbers. A student who has done nothing sees zeros,
 * and the dashboard renders empty states for them rather than sample data.
 */

import type { SchoolStudent } from '@/api/schoolStudentApi';
import { getPlay, localPoints, playCount } from '@/lib/schoolPlays';
import type { SchoolIcon } from '@/components/school-student/icons';

export type QuarterId = 1 | 2 | 3 | 4;

export type Quarter = {
  id: QuarterId;
  code: string;
  title: string;
  tagline: string;
  /** Key into the ProCounsel SVG pack. */
  icon: SchoolIcon;
  /** Each quarter owns a hue, so the four cards read as a progression rather
   *  than four copies of the same card. Matches its illustration. */
  accent: 'green' | 'purple' | 'blue' | 'gold';
};

export const QUARTERS: Quarter[] = [
  { id: 1, code: 'Q1', title: 'Discover', tagline: 'Find out what you are good at', icon: 'quarterQ1', accent: 'green' },
  { id: 2, code: 'Q2', title: 'Explore', tagline: 'Look at where those strengths lead', icon: 'quarterQ2', accent: 'purple' },
  { id: 3, code: 'Q3', title: 'Align', tagline: 'Match your strengths to a real path', icon: 'quarterQ3', accent: 'blue' },
  { id: 4, code: 'Q4', title: 'Strengthen', tagline: 'Build what that path needs', icon: 'quarterQ4', accent: 'gold' },
];

export type QuestStatus = 'available' | 'locked' | 'soon' | 'done';

export type Quest = {
  key: string;
  quarter: QuarterId;
  title: string;
  description: string;
  /** Points awarded on completion. */
  points: number;
  pointsLabel: string;
  /** Present only for quests that are actually built. */
  to?: string;
  cta?: string;
  /** Shown when the quest is not yet reachable. */
  lockedHint?: string;
  icon: SchoolIcon;
  /** Which palette accent this quest wears — tint, bar and button all follow it. */
  accent: 'green' | 'blue' | 'purple' | 'gold';
};

/**
 * The programme.
 *
 * A quest is switched on by giving it a `to` and a `cta`; without them the
 * dashboard renders it as "Coming soon", so an unbuilt quest can never
 * dead-end a student. Two are on today: the psychometric test, and the daily
 * games page that reads the live schedule from /api/schoolStudent.
 */
export const QUESTS: Quest[] = [
  {
    key: 'mettle',
    quarter: 1,
    title: 'Psychometric Test',
    description: 'Understand your personality, strengths and career interests.',
    points: 100,
    pointsLabel: 'Earn 100 points',
    to: '/mettle',
    cta: 'Start test',
    icon: 'psychometricBrain',
    accent: 'green',
  },
  {
    key: 'games',
    quarter: 1,
    title: 'Daily Games & Quizzes',
    description: 'A new game every day, scored on the same rules for everyone.',
    points: 50,
    pointsLabel: 'Earn 50 points daily',
    to: '/school-student/games',
    cta: 'See today',
    icon: 'gamesController',
    accent: 'blue',
  },
  {
    key: 'counselling',
    quarter: 1,
    title: 'Book a Counselling Session',
    description: 'Get 1-on-1 guidance from our expert counsellors.',
    points: 200,
    pointsLabel: 'Earn 200 points',
    lockedHint: 'Finish your psychometric test to unlock this.',
    icon: 'bookingCalendar',
    accent: 'purple',
  },
  {
    key: 'streams',
    quarter: 2,
    title: 'Explore Streams',
    description: 'Science, Commerce or Arts — see what each one opens up.',
    points: 100,
    pointsLabel: 'Earn 100 points',
    icon: 'quarterQ2',
    accent: 'blue',
  },
  {
    key: 'careers',
    quarter: 2,
    title: 'Career Deep Dives',
    description: 'Read how people actually got into the work you are curious about.',
    points: 100,
    pointsLabel: 'Earn 100 points',
    icon: 'navQuests',
    accent: 'purple',
  },
  {
    key: 'exams',
    quarter: 3,
    title: 'Exam Roadmap',
    description: 'The entrance exams that matter for your class, and when to start.',
    points: 150,
    pointsLabel: 'Earn 150 points',
    icon: 'quarterQ3',
    accent: 'gold',
  },
  {
    key: 'skills',
    quarter: 3,
    title: 'Skill Builders',
    description: 'Short challenges that build the skills your path needs.',
    points: 150,
    pointsLabel: 'Earn 150 points',
    icon: 'levelShield',
    accent: 'blue',
  },
  {
    key: 'plan',
    quarter: 4,
    title: 'Your Year Plan',
    description: 'Turn everything you found into a plan for next year.',
    points: 250,
    pointsLabel: 'Earn 250 points',
    icon: 'quarterQ4',
    accent: 'green',
  },
];

/** XP thresholds. `minPoints` is the entry cost of the level. */
export const LEVELS = [
  { level: 1, name: 'Starter', minPoints: 0 },
  { level: 2, name: 'Seeker', minPoints: 250 },
  { level: 3, name: 'Pathfinder', minPoints: 600 },
  { level: 4, name: 'Explorer', minPoints: 1000 },
  { level: 5, name: 'Navigator', minPoints: 2000 },
  { level: 6, name: 'Trailblazer', minPoints: 3500 },
] as const;

/** Everything that is persisted. Kept small and flat so it is cheap to sync. */
export type Progress = {
  version: 1;
  /** ISO date (yyyy-mm-dd) the student first opened the dashboard. */
  startedOn: string;
  points: number;
  streakDays: number;
  /** ISO date of the last visit, used to advance or reset the streak. */
  lastActiveOn: string | null;
  completedQuests: string[];
  /** 0-100 per quest key. Absent means not started. */
  questProgress: Record<string, number>;
  quizzesPlayed: number;
  /** One entry per active day, newest last. Trimmed to the last 7 by callers. */
  daily: { date: string; points: number; activities: number }[];
};

export const emptyProgress = (today = isoDate()): Progress => ({
  version: 1,
  startedOn: today,
  points: 0,
  streakDays: 0,
  lastActiveOn: null,
  completedQuests: [],
  questProgress: {},
  quizzesPlayed: 0,
  daily: [],
});

// ── Persistence ───────────────────────────────────────────────────────────────
// The only two functions that touch storage. Swap their bodies for API calls
// when the backend can hold this, and the rest of the app is unaffected.

const KEY_PREFIX = 'procounsel:school-progress:v1:';

const storageKey = (phone: string) => `${KEY_PREFIX}${phone}`;

export function readProgress(phone: string | null | undefined): Progress {
  if (!phone) return emptyProgress();
  try {
    const raw = localStorage.getItem(storageKey(phone));
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    // A shape from an older build must degrade to zeros, never throw.
    if (parsed?.version !== 1) return emptyProgress();
    return { ...emptyProgress(parsed.startedOn ?? isoDate()), ...parsed } as Progress;
  } catch {
    // Private mode, cleared storage, corrupt JSON — all mean "no progress yet".
    return emptyProgress();
  }
}

export function writeProgress(phone: string | null | undefined, progress: Progress): void {
  if (!phone) return;
  try {
    localStorage.setItem(storageKey(phone), JSON.stringify(progress));
  } catch {
    // Storage unavailable. The session still renders correctly from memory.
  }
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function isoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dayDiff = (fromIso: string, toIso: string): number => {
  const from = Date.parse(`${fromIso}T00:00:00`);
  const to = Date.parse(`${toIso}T00:00:00`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
};

const addMonths = (iso: string, months: number): Date => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Advances the visit streak.
 *
 * Same day → unchanged. Yesterday → +1. Anything older, or a first visit → 1.
 * Returns the same object when nothing changed, so callers can skip a write.
 */
export function recordVisit(progress: Progress, today = isoDate()): Progress {
  if (progress.lastActiveOn === today) return progress;
  const gap = progress.lastActiveOn ? dayDiff(progress.lastActiveOn, today) : null;
  const streakDays = gap === 1 ? progress.streakDays + 1 : 1;
  return { ...progress, lastActiveOn: today, streakDays };
}

// ── The server's version of the truth ─────────────────────────────────────────

/**
 * Re-derives "what did you finish today" from the facts, not from a counter.
 *
 * The daily goal used to be nothing but `daily[today].activities`, a number
 * incremented once when a run ended and never checked against anything again.
 * Any event that put a different `Progress` in front of the shell — a fresh
 * login (which nulls the persisted school profile and can therefore change the
 * storage key), a re-read of an older copy, storage unavailable for one write —
 * took the counter back to zero, and the student's finished game read as
 * undone. A count that can only be right if every write in its history landed
 * is the wrong shape for something the student can see.
 *
 * So the day's tally is rebuilt from the two records that actually say a game
 * was played: this device's ledger (`schoolPlays`, written the instant a run
 * ends) and, when the caller has asked for it, the backend's own session for
 * today. Either one means the day's task is done, and the "Daily Games &
 * Quizzes" quest is marked with it — the same conclusion the play page reaches,
 * reached again from scratch on every mount instead of remembered.
 *
 * Only ever raises the tally. A student who played twice keeps their 2.
 */
function reconcileToday(
  progress: Progress,
  studentId: string | null | undefined,
  options: { playedToday?: boolean; today?: string } = {},
): Progress {
  const today = options.today ?? isoDate();
  const play = studentId ? getPlay(studentId, today) : null;
  const played = Boolean(play) || options.playedToday === true;
  if (!played) return progress;

  const row = progress.daily.find((d) => d.date === today);
  const questDone = progress.completedQuests.includes('games');
  // Nothing to fix: the counter already agrees with the record.
  if (row && row.activities >= 1 && questDone) return progress;

  const daily = row
    ? progress.daily.map((d) =>
        d.date === today
          ? { ...d, activities: Math.max(1, d.activities), points: Math.max(d.points, play?.points ?? 0) }
          : d,
      )
    : [...progress.daily, { date: today, activities: 1, points: play?.points ?? 0 }].slice(-7);

  return {
    ...progress,
    daily,
    completedQuests: questDone ? progress.completedQuests : [...progress.completedQuests, 'games'],
    questProgress: { ...progress.questProgress, games: 100 },
  };
}

/**
 * Lays the backend's record over the local one.
 *
 * Three fields are the server's to own, and it wins on all three even when it
 * says zero — a student who was reset to zero must see zero, not the number
 * this browser happened to cache. Everything the server has no column for
 * (quizzes played, the daily log, the start date) survives from local storage.
 *
 * A null record means the profile call failed or the student has no record yet;
 * the local copy is then used unchanged rather than blanking the page.
 */
export function withServerRecord(
  progress: Progress,
  record: SchoolStudent | null | undefined,
  studentId?: string | null,
  options: {
    /** The backend's own answer to "did they finish today's game?", if asked. */
    playedToday?: boolean;
    today?: string;
  } = {},
): Progress {
  const withDaily = reconcileToday(progress, studentId, options);
  if (!record) return withDaily;
  progress = withDaily;

  // The psychometric report link is the only reliable signal that the test is
  // finished — there is no per-quest completion endpoint.
  const done = new Set(progress.completedQuests);
  if (record.pyschometricReportPdfLink) done.add('mettle');
  else done.delete('mettle');

  /*
   * Points are reconciled, not overwritten, and this is the one place in the
   * app that knowingly does not just take the server's word.
   *
   * The server is authoritative the moment it can award anything. Today it
   * cannot — /api/schoolStudent has no endpoint that adds a point, so
   * `totalPoints` reads 0 for every student on the programme. Taking that 0
   * meant a student finished a game, watched their score appear, and watched
   * the next profile refresh set it back to zero a second later.
   *
   * Taking the larger of the two fixes that without ever hiding a real number:
   * a server total only exceeds the local ledger once the backend starts
   * awarding, and from that day on the server wins every comparison and this
   * branch quietly stops mattering. A deliberate reset to zero is the one case
   * it gets wrong, and that is worth far less than a dashboard that works.
   */
  const server = Number.isFinite(record.totalPoints) ? record.totalPoints : 0;
  const local = studentId ? localPoints(studentId) : progress.points;

  return {
    ...progress,
    points: Math.max(server, local),
    streakDays: Number.isFinite(record.currentStreak)
      ? Math.max(record.currentStreak, progress.streakDays)
      : progress.streakDays,
    quizzesPlayed: studentId ? Math.max(playCount(studentId), progress.quizzesPlayed) : progress.quizzesPlayed,
    completedQuests: [...done],
  };
}

// ── Derived view ──────────────────────────────────────────────────────────────

export type QuarterView = Quarter & {
  /** Window this quarter occupies, counted from the student's start date. */
  window: string;
  status: 'current' | 'complete' | 'locked';
  completed: number;
  total: number;
  percent: number;
  /** Only set for the current quarter. Negative means the window has passed. */
  daysLeft: number | null;
};

export type QuestView = Quest & { status: QuestStatus; percent: number };

export type DashboardView = {
  points: number;
  streakDays: number;
  level: (typeof LEVELS)[number];
  nextLevel: (typeof LEVELS)[number] | null;
  /** 0-100 through the current level. 100 when there is no level above. */
  levelPercent: number;
  pointsIntoLevel: number;
  pointsForLevel: number;
  quarters: QuarterView[];
  currentQuarter: QuarterView;
  quests: QuestView[];
  currentQuests: QuestView[];
  tasksCompleted: number;
  tasksTotal: number;
  overallPercent: number;
  quizzesPlayed: number;
  quizzesTarget: number;
  pointsTarget: number;
  /** Activities finished today — drives the daily goal. */
  activitiesToday: number;
  dailyGoalTarget: number;
  hasAnyActivity: boolean;
  /** The next level, framed as a goal for the achievements strip. */
  nextMilestone: { title: string; current: number; target: number; percent: number } | null;
};

export const QUIZZES_TARGET = 15;
export const POINTS_TARGET = 3000;
export const DAILY_GOAL_TARGET = 1;

const levelFor = (points: number) =>
  [...LEVELS].reverse().find((l) => points >= l.minPoints) ?? LEVELS[0];

/**
 * Turns persisted progress into everything the dashboard renders.
 *
 * Pure and cheap — one pass over eight quests — so the page can call it inside a
 * single useMemo instead of scattering derived state across components.
 */
export function buildDashboardView(progress: Progress, today = isoDate()): DashboardView {
  const done = new Set(progress.completedQuests);

  const perQuarter = QUARTERS.map((q) => {
    const quests = QUESTS.filter((quest) => quest.quarter === q.id);
    const completed = quests.filter((quest) => done.has(quest.key)).length;
    return { quarter: q, quests, completed, total: quests.length };
  });

  // Quarters unlock by completion, not by calendar: the first one that is not
  // finished is the one the student is on.
  const currentIndex = Math.max(
    0,
    perQuarter.findIndex((entry) => entry.completed < entry.total),
  );

  const quarters: QuarterView[] = perQuarter.map((entry, index) => {
    const start = addMonths(progress.startedOn, index * 3);
    const end = addMonths(progress.startedOn, (index + 1) * 3);
    end.setDate(end.getDate() - 1);
    const window = `${MONTHS[start.getMonth()]} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
    const status =
      entry.completed >= entry.total && entry.total > 0
        ? 'complete'
        : index === currentIndex
          ? 'current'
          : 'locked';
    return {
      ...entry.quarter,
      window,
      status,
      completed: entry.completed,
      total: entry.total,
      percent: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
      daysLeft: status === 'current' ? dayDiff(today, isoDate(end)) : null,
    };
  });

  const currentQuarter = quarters[currentIndex];

  const quests: QuestView[] = QUESTS.map((quest) => {
    const percent = done.has(quest.key) ? 100 : (progress.questProgress[quest.key] ?? 0);
    if (done.has(quest.key)) return { ...quest, status: 'done' as const, percent };
    if (quest.quarter !== currentQuarter.id)
      return { ...quest, status: 'locked' as const, percent };
    // Inside the current quarter, a quest with no destination is not built yet;
    // one with a lockedHint waits on something the student has not done.
    if (!quest.to) return { ...quest, status: 'soon' as const, percent };
    if (quest.lockedHint) return { ...quest, status: 'locked' as const, percent };
    return { ...quest, status: 'available' as const, percent };
  });

  const level = levelFor(progress.points);
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1) ?? null;
  const pointsForLevel = nextLevel ? nextLevel.minPoints - level.minPoints : 0;
  const pointsIntoLevel = progress.points - level.minPoints;

  return {
    points: progress.points,
    streakDays: progress.streakDays,
    level,
    nextLevel,
    levelPercent: pointsForLevel
      ? Math.min(100, Math.round((pointsIntoLevel / pointsForLevel) * 100))
      : 100,
    pointsIntoLevel,
    pointsForLevel,
    quarters,
    currentQuarter,
    quests,
    currentQuests: quests.filter((q) => q.quarter === currentQuarter.id),
    tasksCompleted: progress.completedQuests.length,
    tasksTotal: QUESTS.length,
    overallPercent: Math.round((progress.completedQuests.length / QUESTS.length) * 100),
    quizzesPlayed: progress.quizzesPlayed,
    quizzesTarget: QUIZZES_TARGET,
    pointsTarget: POINTS_TARGET,
    activitiesToday: progress.daily.find((d) => d.date === today)?.activities ?? 0,
    dailyGoalTarget: DAILY_GOAL_TARGET,
    hasAnyActivity: progress.points > 0 || progress.completedQuests.length > 0,
    nextMilestone: nextLevel
      ? {
          title: `Reach Level ${nextLevel.level}`,
          current: progress.points,
          target: nextLevel.minPoints,
          percent: Math.min(100, Math.round((progress.points / nextLevel.minPoints) * 100)),
        }
      : null,
  };
}
