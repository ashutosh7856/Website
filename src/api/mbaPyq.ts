import { useQuery } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type ProcounselPercentile, type SectionId, type Source } from "@/api/mba";

/**
 * ProCounsel MBA — previous-year CAT papers and the CAT score estimator.
 * Types copied from procounsel-neet-api/docs/mba-api.md
 * ("Previous-year papers, ProCounsel percentile, score estimator").
 */

const MBA = "/mba";

// ── Previous-year papers ─────────────────────────────────────────────────────
export interface PyqTest {
  testId: string;
  kind: "full_mock" | "sectional";
  title: string;
  sections: SectionId[];
  durationMinutes: number;
  questionCount: number;
  /** Submitted attempts. */
  attempts: number;
  inProgressAttemptId: string | null;
  /** Latest submitted attempt, for the result link. */
  lastAttemptId: string | null;
  bestScore: number | null;
  firstScore: number | null;
  maxScore: number | null;
  /** ProCounsel students with a first attempt of this test. */
  takenBy: number;
  /** Of the student's first attempt; relative to ProCounsel students only. */
  procounselPercentile: ProcounselPercentile | null;
}
export interface PyqPaper {
  paperId: string;
  title: string;
  year: number;
  slot: number;
  examVersionYear: number | null;
  questionCount: number;
  durationMinutes: number;
  sections: { id: SectionId; questionCount: number; durationMinutes: number }[];
  source: Source | null;
  tests: PyqTest[];
}
export interface PyqResponse {
  papers: PyqPaper[];
  minStudents: number;
  percentileNote: string;
}

// ── Score estimator ──────────────────────────────────────────────────────────
export interface EstimateTypeRow {
  type: "MCQ" | "TITA";
  questionCount: number;
  attemptRate: number | null;
  accuracy: number | null;
  answered: number;
  expected: number;
}
export interface EstimateSection {
  id: SectionId;
  questionCount: number;
  maxScore: number;
  expected: number;
  low: number;
  high: number;
  timedTests: number;
  answered: number;
  types: EstimateTypeRow[];
}
export interface EstimateTip {
  title: string;
  detail: string;
  href: string;
}
export interface ScoreEstimate {
  ready: boolean;
  pattern: { year: number; totalDurationMinutes: number; mixBasis: string } | null;
  expected: number | null;
  low: number | null;
  high: number | null;
  maxScore: number | null;
  confidence: "low" | "medium" | "high" | null;
  confidenceReason: string;
  sections: EstimateSection[];
  inputs: {
    pyqAttempts: number;
    mockAttempts: number;
    fullLength: number;
    timedQuestions: number;
    timedAnswered: number;
    practiceQuestions: number;
    dailyQuestions: number;
    lastTimedAt: string | null;
  };
  needs: { section: SectionId; timedTestsNeeded: number; questionsNeeded: number }[];
  /** 0–1 towards the minimum data. */
  progress: number;
  tips: EstimateTip[];
  rules: Record<string, number>;
  disclaimer: string;
}

export const mbaPyqApi = {
  getPyq: () => procounselApi.get<PyqResponse>(`${MBA}/me/pyq`).then((r) => r.data),
  getScoreEstimate: () => procounselApi.get<ScoreEstimate>(`${MBA}/me/score-estimate`).then((r) => r.data),
};

export const pyqKeys = {
  pyq: ["mba", "pyq"] as const,
  estimate: ["mba", "score-estimate"] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useMbaPyq = () => useQuery({ queryKey: pyqKeys.pyq, queryFn: mbaPyqApi.getPyq, retry, staleTime: 0 });

export const useScoreEstimate = () =>
  useQuery({ queryKey: pyqKeys.estimate, queryFn: mbaPyqApi.getScoreEstimate, retry, staleTime: 60_000 });
