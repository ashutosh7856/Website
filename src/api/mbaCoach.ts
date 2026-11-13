import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type SectionId } from "@/api/mba";

/**
 * ProCounsel MBA — AI section coaches (VARC / DILR / Quant) and "Explain my plan".
 * Types copied from procounsel-neet-api/docs/mba-api.md ("AI section coaches").
 */

const MBA = "/mba";

export type CoachId = "varc" | "dilr" | "quant";
export interface CoachTurn {
  role: "user" | "assistant";
  text: string;
  at: string;
}
export interface CoachContext {
  topics: { topic: string; attempts: number; correct: number; accuracy: number | null; status: "weak" | "ok" | "strong" | "low_evidence" }[];
  recentMistakeTopics: string[];
  estimate: { expected: number; low: number; high: number; maxScore: number; confidence: "low" | "medium" | "high" | null } | null;
  inRunningTest: boolean;
}
export interface CoachChat {
  coach: CoachId;
  section: SectionId;
  title: string;
  turns: CoachTurn[];
  context: CoachContext;
  dailyLimit: number;
  remainingToday: number;
  /** False when the AI is not set up on the server (sending returns 503). */
  configured: boolean;
}
export interface PlanExplanation {
  weekStart: string;
  text: string;
  generatedAt: string;
  cached: boolean;
  remainingToday: number | null;
}

export const COACHES: { id: CoachId; section: SectionId; label: string; blurb: string; starters: string[] }[] = [
  {
    id: "varc",
    section: "VARC",
    label: "VARC coach",
    blurb: "Reading comprehension strategy, para jumbles, odd sentence out, summaries and vocabulary in context.",
    starters: [
      "How should I read an RC passage so I don't have to reread it?",
      "What's a reliable method for para jumbles?",
      "How do I spot the odd sentence out?",
    ],
  },
  {
    id: "dilr",
    section: "DILR",
    label: "DILR coach",
    blurb: "Choosing which sets to attempt, building grids from clues, and an approach for each kind of set.",
    starters: [
      "How do I decide which DILR sets to attempt first?",
      "How do I build a grid for an arrangement set?",
      "I get stuck on tournament sets. Where do I start?",
    ],
  },
  {
    id: "quant",
    section: "QA",
    label: "Quant coach",
    blurb: "Concept explanations, shortcuts (and when they work), and checking your working step by step.",
    starters: [
      "Explain successive percentage change with an example.",
      "Which topic should I fix first, based on my accuracy?",
      "Can you check my steps for a time and work problem?",
    ],
  },
];

const q = encodeURIComponent;

export const coachApi = {
  get: (coach: CoachId) => procounselApi.get<CoachChat>(`${MBA}/me/coach/${q(coach)}`).then((r) => r.data),
  send: (coach: CoachId, message: string) =>
    procounselApi.post<CoachChat>(`${MBA}/me/coach/${q(coach)}/messages`, { message }).then((r) => r.data),
  clear: (coach: CoachId) => procounselApi.delete<{ deleted: boolean }>(`${MBA}/me/coach/${q(coach)}`).then((r) => r.data),
  getPlanExplanation: (week: string) =>
    procounselApi
      .get<{ explanation: PlanExplanation | null }>(`${MBA}/me/plan/explain`, { params: week ? { week } : {} })
      .then((r) => r.data),
  explainPlan: (week: string) =>
    procounselApi.post<PlanExplanation>(`${MBA}/me/plan/explain`, null, { params: week ? { week } : {} }).then((r) => r.data),
};

export const coachKeys = {
  chat: (coach: CoachId) => ["mba", "coach", coach] as const,
  plan: (week: string) => ["mba", "coach", "plan", week] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useCoachChat = (coach: CoachId) =>
  useQuery({ queryKey: coachKeys.chat(coach), queryFn: () => coachApi.get(coach), retry, staleTime: 30_000 });

export const useSendCoachMessage = (coach: CoachId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => coachApi.send(coach, message),
    onSuccess: (chat) => qc.setQueryData(coachKeys.chat(coach), chat),
  });
};

export const useClearCoachChat = (coach: CoachId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => coachApi.clear(coach),
    onSuccess: () => void qc.invalidateQueries({ queryKey: coachKeys.chat(coach) }),
  });
};

/** `week` = the plan's weekStart (YYYY-MM-DD). */
export const usePlanExplanation = (week: string, enabled = true) =>
  useQuery({
    queryKey: coachKeys.plan(week),
    queryFn: () => coachApi.getPlanExplanation(week),
    enabled: enabled && !!week,
    retry,
    staleTime: 60_000,
  });

export const useExplainPlan = (week: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => coachApi.explainPlan(week),
    onSuccess: (explanation) => qc.setQueryData(coachKeys.plan(week), { explanation }),
  });
};
