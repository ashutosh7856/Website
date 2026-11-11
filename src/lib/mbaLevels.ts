import type { SectionId } from '@/api/mba';

/**
 * Road to IIM — the MBA dashboard's levels.
 *
 * Seven camps on one climb. Every rule reads a number that
 * GET /api/v1/mba/me/dashboard already returns, so a camp is earned only by
 * work the server has recorded; nothing here stores, guesses or rounds up.
 *
 * Camps are climbed in order: the student stands at the highest camp for which
 * it AND every camp below it is reached. Accuracy-based camps follow the live
 * numbers, so a camp can be lost again if accuracy drops — the page says so.
 *
 * Counting notes, from the API contract (docs/mba-api.md):
 *  - `sections[].attempted/correct` and `totals.questionsAttempted` count
 *    distinct questions; `correct` means the last answer was correct.
 *  - `totals.mocksCompleted` is submitted attempts of ANY kind, so a sectional
 *    counts as a test here. The copy says "tests", not "full mocks".
 *  - Accuracy is computed from the counts (correct / attempted), never from the
 *    `accuracy` field, whose scale the contract leaves ambiguous elsewhere.
 */

export const SECTION_ORDER: readonly SectionId[] = ['VARC', 'DILR', 'QA'];

const SECTION_NAME: Record<SectionId, string> = { VARC: 'VARC', DILR: 'DILR', QA: 'Quant' };

export type CampId =
  | 'base'
  | 'first-steps'
  | 'diagnostic'
  | 'ridge'
  | 'strong-sections'
  | 'high-camp'
  | 'summit';

export interface ClimbInput {
  /** True once the onboarding profile exists. */
  onboarded: boolean;
  totals: { questionsAttempted: number; mocksCompleted: number };
  sections: readonly { id: SectionId; attempted: number; correct: number }[];
}

export interface CampCheck {
  key: string;
  /** What has to be true, in the student's words. */
  label: string;
  /** Where they are against it, e.g. "38/100 questions". */
  value: string;
  met: boolean;
  /** 0–1. Exactly 1 when met. */
  progress: number;
}

export interface Camp {
  id: CampId;
  /** 1-based position on the route. */
  number: number;
  name: string;
  /** One-line rule summary. */
  rule: string;
  checks: CampCheck[];
  reached: boolean;
  /** 0–1: share of this camp's requirements done. */
  progress: number;
}

export type CampState = 'reached' | 'next' | 'ahead';

export interface ClimbView {
  camps: Camp[];
  /** Highest camp reached in order, or null before Base Camp. */
  current: Camp | null;
  /** The camp being climbed toward, or null at the summit. */
  next: Camp | null;
  /** State of each camp, aligned with `camps`. */
  states: CampState[];
  /** 0–1 along the whole route: camps reached plus the part-climbed leg. */
  routeProgress: number;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
const safeCount = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function countCheck(key: string, label: string, current: number, target: number, unit: [string, string]): CampCheck {
  const met = current >= target;
  return {
    key,
    label,
    value: `${Math.min(current, target)}/${target} ${plural(target, unit[0], unit[1])}`,
    met,
    progress: met ? 1 : clamp01(current / target),
  };
}

/**
 * One section held at `minAccuracy`% over at least `minAttempted` questions.
 * Integer comparison (correct·100 ≥ target·attempted) so 49.99% never passes,
 * and the shown percentage is floored so an unmet check never reads "50%".
 */
function sectionCheck(
  id: SectionId,
  stats: { attempted: number; correct: number },
  minAccuracy: number,
  minAttempted: number,
  keyPrefix: string,
): CampCheck {
  const attempted = safeCount(stats.attempted);
  const correct = Math.min(safeCount(stats.correct), attempted);
  const volumeMet = attempted >= minAttempted;
  const accuracyMet = attempted > 0 && correct * 100 >= minAccuracy * attempted;
  const accuracy = attempted > 0 ? Math.floor((correct * 100) / attempted) : null;
  const met = volumeMet && accuracyMet;

  const value =
    attempted === 0
      ? `0/${minAttempted} questions`
      : !volumeMet
        ? `${attempted}/${minAttempted} questions, ${accuracy}%`
        : `${accuracy}% over ${attempted} questions`;

  const volume = clamp01(attempted / minAttempted);
  const quality = accuracy === null ? 0 : clamp01(accuracy / minAccuracy);
  return {
    key: `${keyPrefix}-${id}`,
    label: `${SECTION_NAME[id]} at ${minAccuracy}%+ over ${minAttempted} questions`,
    value,
    met,
    progress: met ? 1 : Math.min(0.99, (volume + quality) / 2),
  };
}

function campOf(
  id: CampId,
  number: number,
  name: string,
  rule: string,
  checks: CampCheck[],
): Camp {
  const reached = checks.every((c) => c.met);
  const progress = reached ? 1 : checks.reduce((sum, c) => sum + c.progress, 0) / checks.length;
  return { id, number, name, rule, checks, reached, progress };
}

export function buildCamps(input: ClimbInput): Camp[] {
  const questions = safeCount(input.totals.questionsAttempted);
  const tests = safeCount(input.totals.mocksCompleted);
  const byId = new Map(input.sections.map((s) => [s.id, s]));
  const statsFor = (id: SectionId) => byId.get(id) ?? { attempted: 0, correct: 0 };
  const sections = (minAccuracy: number, minAttempted: number, prefix: string) =>
    SECTION_ORDER.map((id) => sectionCheck(id, statsFor(id), minAccuracy, minAttempted, prefix));

  return [
    campOf('base', 1, 'Base Camp', 'Set up your CAT profile', [
      {
        key: 'onboarded',
        label: 'CAT profile set up',
        value: input.onboarded ? 'Done' : 'Not yet',
        met: input.onboarded,
        progress: input.onboarded ? 1 : 0,
      },
    ]),
    campOf('first-steps', 2, 'First Steps', 'Practise your first 10 questions', [
      countCheck('questions-10', 'Practise 10 questions', questions, 10, ['question', 'questions']),
    ]),
    campOf('diagnostic', 3, 'Diagnostic', 'Submit your first mock or sectional', [
      countCheck('tests-1', 'Submit 1 mock or sectional', tests, 1, ['test', 'tests']),
    ]),
    campOf('ridge', 4, 'Ridge', 'Practise 100 questions', [
      countCheck('questions-100', 'Practise 100 questions', questions, 100, ['question', 'questions']),
    ]),
    campOf(
      'strong-sections',
      5,
      'Strong Sections',
      'Every section at 50%+ over 20 questions',
      sections(50, 20, 'strong'),
    ),
    campOf('high-camp', 6, 'High Camp', 'Submit 3 mocks or sectionals', [
      countCheck('tests-3', 'Submit 3 mocks or sectionals', tests, 3, ['test', 'tests']),
    ]),
    campOf('summit', 7, 'Summit: CAT-ready', 'Every section at 60%+ over 50 questions, and 3 tests', [
      ...sections(60, 50, 'summit'),
      countCheck('summit-tests-3', 'Submit 3 mocks or sectionals', tests, 3, ['test', 'tests']),
    ]),
  ];
}

export function climbFrom(input: ClimbInput): ClimbView {
  const camps = buildCamps(input);

  // Highest consecutive camp reached.
  let currentIndex = -1;
  while (currentIndex + 1 < camps.length && camps[currentIndex + 1].reached) currentIndex += 1;

  const current = currentIndex >= 0 ? camps[currentIndex] : null;
  const next = camps[currentIndex + 1] ?? null;
  const states: CampState[] = camps.map((_, i) =>
    i <= currentIndex ? 'reached' : i === currentIndex + 1 ? 'next' : 'ahead',
  );

  const legs = camps.length - 1;
  const routeProgress = next
    ? clamp01((Math.max(0, currentIndex) + (currentIndex >= 0 ? next.progress : 0)) / legs)
    : 1;

  return { camps, current, next, states, routeProgress };
}

/**
 * How far along a camp is, in words.
 *
 * A one-rule camp reads as a percentage ("65%"). A camp with several rules
 * reads as rules met ("3 of 4 met"): averaging an accuracy gap with counts that
 * are already done gives "99%" for a student whose DILR is still three points
 * short, which says "nearly there" about a gap that may take weeks.
 */
export function campProgressLabel(camp: Camp): string {
  if (camp.reached) return 'Reached';
  if (camp.checks.length === 1) return `${Math.round(camp.progress * 100)}%`;
  const met = camp.checks.filter((c) => c.met).length;
  return `${met} of ${camp.checks.length} met`;
}
