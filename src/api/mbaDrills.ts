import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import {
  mbaKeys,
  mbaStatus,
  type Attempt,
  type AttemptSummary,
  type Confidence,
  type QuestionSource,
  type SectionId,
} from "@/api/mba";

/**
 * ProCounsel MBA — practice modes: the test builder (timed drills, weak-topic and
 * mixed sets) and self-rated confidence. Types copied from
 * procounsel-neet-api/docs/mba-api.md ("Practice modes").
 *
 * A built test is an ordinary attempt: it opens in the mock player at
 * `/mba/exam/{testId}` (POST /attempts resumes it) and its result in MbaResult.
 */

const MBA = "/mba";

export type DrillMode = "timed" | "weak" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";

export interface DrillOptions {
  sections: {
    id: SectionId;
    questionCount: number;
    /** Automatic pace (official section minutes ÷ questions). */
    minutesPerQuestion: number;
    topics: { topic: string; questionCount: number; subtopics: { subtopic: string; questionCount: number }[] }[];
  }[];
  sources: { all: number; pyq: number; original: number };
  weakTopics: { section: SectionId; topic: string; attempts: number; accuracy: number }[];
  mistakesDue: number;
  luckyGuesses: number;
  inProgress: AttemptSummary | null;
  limits: { maxCount: number; maxMinutes: number };
}

export interface DrillCreate {
  /** New per "Start" click — a repeat (double tap, retry) returns the same test. */
  clientToken: string;
  mode: DrillMode;
  /** Empty = all; "timed" needs exactly one. */
  sections?: SectionId[];
  topics?: string[];
  subtopics?: string[];
  difficulty?: Difficulty[];
  source?: QuestionSource;
  count: number;
  /** null = automatic (CAT pace). */
  timeLimitMinutes?: number | null;
}

export interface ConfidenceSummary {
  levels: { level: Confidence; answers: number; correct: number; accuracy: number | null }[];
  ratedAnswers: number;
  unratedAnswers: number;
  sureButWrong: number;
  luckyGuesses: number;
  luckyGuessQuestions: number;
  topics: { section: SectionId; topic: string; sureButWrong: number; luckyGuesses: number; href: string }[];
  totals: { answered: number; correct: number; incorrect: number };
}

export const isDrillTestId = (testId: string) => testId.startsWith("drill-");

export const mbaDrillsApi = {
  getOptions: () => procounselApi.get<DrillOptions>(`${MBA}/drills/options`).then((r) => r.data),
  createDrill: (body: DrillCreate) => procounselApi.post<Attempt>(`${MBA}/drills`, body).then((r) => r.data),
  getConfidence: () => procounselApi.get<ConfidenceSummary>(`${MBA}/me/confidence`).then((r) => r.data),
};

export const drillKeys = {
  options: ["mba", "drills", "options"] as const,
  confidence: ["mba", "confidence"] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useDrillOptions = () =>
  useQuery({ queryKey: drillKeys.options, queryFn: mbaDrillsApi.getOptions, retry, staleTime: 0 });

export const useCreateDrill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mbaDrillsApi.createDrill,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: drillKeys.options });
      void qc.invalidateQueries({ queryKey: mbaKeys.attempts });
      void qc.invalidateQueries({ queryKey: mbaKeys.dashboard });
    },
  });
};

export const useMbaConfidence = () =>
  useQuery({ queryKey: drillKeys.confidence, queryFn: mbaDrillsApi.getConfidence, retry, staleTime: 60_000 });

/** A fresh idempotency token for one "Start" click. */
export const newClientToken = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
