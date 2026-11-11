/**
 * CAT raw-score arithmetic for the public score calculator (/cat-score-calculator).
 *
 * Pure functions only: the page passes in the marking scheme and question
 * counts from the bundled snapshot (cat_exam.json), so no figure here is typed
 * in by hand. A raw score is not a percentile — the IIMs publish percentiles
 * with the result, and no official score-to-percentile table exists — so
 * nothing in this module estimates one.
 */

export type CatSectionId = "VARC" | "DILR" | "QA";

/** What a student counts from their attempt (or response sheet) for one section. */
export interface SectionAttempt {
  mcqCorrect: number;
  mcqWrong: number;
  titaCorrect: number;
}

export type AttemptField = keyof SectionAttempt;
export const ATTEMPT_FIELDS: AttemptField[] = ["mcqCorrect", "mcqWrong", "titaCorrect"];

/** Marks per answer, as published (wrong answers are negative or zero). */
export interface MarkingScheme {
  mcqCorrect: number;
  mcqWrong: number;
  titaCorrect: number;
  titaWrong: number;
}

interface MarkingRuleLike {
  type: string;
  correct: number;
  incorrect: number;
}

/** The scheme from the snapshot's marking rules, or null if MCQ or TITA is missing. */
export function schemeFromMarking(marking: MarkingRuleLike[]): MarkingScheme | null {
  const mcq = marking.find((m) => m.type === "MCQ");
  const tita = marking.find((m) => m.type === "TITA");
  if (!mcq || !tita) return null;
  return { mcqCorrect: mcq.correct, mcqWrong: mcq.incorrect, titaCorrect: tita.correct, titaWrong: tita.incorrect };
}

/**
 * Upper bound on questions attempted in a section when the official count is
 * not announced (CAT publishes counts only after the test). Recent papers had
 * 22–24 per section; 30 leaves room for a change without accepting typos.
 */
export const UNKNOWN_COUNT_MAX = 30;

export const sectionLimit = (questionCount: number | null | undefined): number =>
  questionCount && questionCount > 0 ? questionCount : UNKNOWN_COUNT_MAX;

/** Form state: what the inputs hold (strings, so a blank stays blank). */
export type SectionDraft = Record<AttemptField, string>;
export const EMPTY_SECTION_DRAFT: SectionDraft = { mcqCorrect: "", mcqWrong: "", titaCorrect: "" };

export type SectionErrors = Partial<Record<AttemptField | "total", string>>;

/** Keep digits only, at most two of them. */
export const cleanCount = (raw: string): string => raw.replace(/\D/g, "").slice(0, 2);

/**
 * A section's draft → its attempt, or the errors that stop it. Blank fields
 * count as 0; each must be a whole number from 0 to the limit, and the three
 * together cannot exceed the limit (you cannot answer more questions than the
 * section has).
 */
export function validateSection(
  draft: SectionDraft,
  limit: number,
): { attempt: SectionAttempt | null; errors: SectionErrors } {
  const errors: SectionErrors = {};
  const values = {} as SectionAttempt;
  for (const field of ATTEMPT_FIELDS) {
    const raw = draft[field].trim();
    const n = raw === "" ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0) errors[field] = "Enter a whole number, 0 or more.";
    else if (n > limit) errors[field] = `Cannot be more than ${limit}.`;
    values[field] = n;
  }
  if (Object.keys(errors).length === 0) {
    const answered = values.mcqCorrect + values.mcqWrong + values.titaCorrect;
    if (answered > limit) errors.total = `Together these come to ${answered}; the section has at most ${limit} questions.`;
  }
  return Object.keys(errors).length ? { attempt: null, errors } : { attempt: values, errors };
}

export interface SectionScore {
  id: CatSectionId;
  attempt: SectionAttempt;
  /** Marks from MCQs: correct × +3 plus wrong × −1. */
  mcqMarks: number;
  /** Marks from TITA questions (wrong TITA answers cost nothing, so not asked). */
  titaMarks: number;
  raw: number;
  /** Highest raw score the section allows with this many questions. */
  max: number;
}

export function scoreSection(
  id: CatSectionId,
  attempt: SectionAttempt,
  scheme: MarkingScheme,
  limit: number,
): SectionScore {
  const mcqMarks = attempt.mcqCorrect * scheme.mcqCorrect + attempt.mcqWrong * scheme.mcqWrong;
  const titaMarks = attempt.titaCorrect * scheme.titaCorrect;
  return { id, attempt, mcqMarks, titaMarks, raw: mcqMarks + titaMarks, max: limit * Math.max(scheme.mcqCorrect, scheme.titaCorrect) };
}

export interface CatScore {
  sections: SectionScore[];
  total: number;
  /** Highest total possible, or null when any section's count is not announced. */
  max: number | null;
  correct: number;
  wrong: number;
}

export function scoreCat(sections: SectionScore[], countsKnown: boolean): CatScore {
  return {
    sections,
    total: sections.reduce((n, s) => n + s.raw, 0),
    max: countsKnown ? sections.reduce((n, s) => n + s.max, 0) : null,
    correct: sections.reduce((n, s) => n + s.attempt.mcqCorrect + s.attempt.titaCorrect, 0),
    wrong: sections.reduce((n, s) => n + s.attempt.mcqWrong, 0),
  };
}

/** One-line summary for sharing: "My CAT 2026 raw score: 98 (VARC 40 · DILR 25 · QA 33)." */
export function scoreSummary(score: CatScore, year: number): string {
  const parts = score.sections.map((s) => `${s.id} ${s.raw}`).join(" · ");
  return `My CAT ${year} raw score: ${score.total} (${parts}), worked out with the official marking scheme.`;
}

/** wa.me link that opens WhatsApp with the text and the page URL filled in. */
export function whatsappShareUrl(text: string, pageUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${pageUrl}`)}`;
}
