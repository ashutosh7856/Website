import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus } from "@/api/mba";

/**
 * ProCounsel MBA — GDPI (WAT / GD / PI) preparation and the AI mock interview.
 * Contract: procounsel-neet-api/docs/mba-api.md "GDPI". All endpoints are 🔒 mbaStudent.
 */

const MBA = "/mba";

export type GdpiKind = "wat" | "gd" | "pi";
export type TopicGroup = "business" | "economy" | "technology" | "society" | "abstract";
export type PiGroup = "personal" | "academics" | "work" | "current_affairs" | "hobbies" | "situational" | "stress";
export type Background = "engineering" | "commerce" | "arts" | "science";

export interface GdpiAngle {
  angle: string;
  forView: string;
  againstView: string;
}
export interface GdpiItem {
  id: string;
  kind: GdpiKind;
  group: TopicGroup | PiGroup;
  /** The topic or the question. */
  prompt: string;
  /** WAT/GD: framing note. PI: what the panel is assessing. */
  framing: string;
  lookFor: string[];
  /** GD only (3–4). */
  angles: GdpiAngle[];
  structure: string[];
  avoid: string[];
  background: Background | null;
  source: { kind: "original"; title: string };
}

export interface FeedbackScores {
  structure: number;
  clarity: number;
  relevance: number;
  completeness: number;
}
export interface GdpiFeedback {
  /** null only when `fallback` is true. */
  scores: FeedbackScores | null;
  strengths: string[];
  improvements: string[];
  betterOutline: string[];
  /** The AI reply was unusable; not counted against the quota and the answer can be resubmitted. */
  fallback: boolean;
}
export interface SessionAnswer {
  questionId: string;
  answerText: string;
  wordCount: number;
  overtime: boolean;
  feedback: GdpiFeedback;
  answeredAt: string;
}
export interface GdpiSession {
  id: string;
  kind: "pi" | "wat";
  status: "in_progress" | "completed";
  title: string;
  focus: string | null;
  background: Background | null;
  durationMinutes: number | null;
  startedAt: string;
  endsAt: string | null;
  serverNow: string;
  completedAt: string | null;
  questions: GdpiItem[];
  answers: SessionAnswer[];
  summary: { answered: number; total: number; averageScores: FeedbackScores | null; overall: number | null };
}
export interface GdpiSessionSummary {
  id: string;
  kind: "pi" | "wat";
  status: "in_progress" | "completed";
  title: string;
  focus: string | null;
  answered: number;
  total: number;
  overall: number | null;
  startedAt: string;
  completedAt: string | null;
}
export interface SessionInput {
  kind: "pi" | "wat";
  focus?: string;
  background?: Background;
  itemId?: string;
  durationMinutes?: 15 | 20;
}
export interface AnswerResponse {
  answer: SessionAnswer;
  session: GdpiSession;
  remainingToday: number;
}
export interface ItemQuery {
  kind?: GdpiKind;
  group?: string;
  background?: Background;
}

export const PI_MAX_CHARS = 2000;
export const WAT_MAX_CHARS = 3000;
export const MIN_ANSWER_CHARS = 20;

export const TOPIC_GROUPS: { id: TopicGroup; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "economy", label: "Economy" },
  { id: "technology", label: "Technology" },
  { id: "society", label: "Society" },
  { id: "abstract", label: "Abstract" },
];
export const PI_GROUPS: { id: PiGroup; label: string }[] = [
  { id: "personal", label: "Personal & goals" },
  { id: "academics", label: "Academics" },
  { id: "work", label: "Work experience" },
  { id: "current_affairs", label: "Current affairs" },
  { id: "hobbies", label: "Hobbies" },
  { id: "situational", label: "Situational & ethical" },
  { id: "stress", label: "Stress questions" },
];
export const BACKGROUNDS: { id: Background; label: string }[] = [
  { id: "engineering", label: "Engineering" },
  { id: "commerce", label: "Commerce" },
  { id: "arts", label: "Arts & humanities" },
  { id: "science", label: "Science" },
];
export const SCORE_LABELS: { key: keyof FeedbackScores; label: string }[] = [
  { key: "structure", label: "Structure" },
  { key: "clarity", label: "Clarity" },
  { key: "relevance", label: "Relevance" },
  { key: "completeness", label: "Completeness" },
];

export const groupLabel = (group: string | null | undefined): string =>
  [...TOPIC_GROUPS, ...PI_GROUPS].find((g) => g.id === group)?.label ?? group ?? "";

export const wordCount = (text: string): number => (text.match(/\S+/g) ?? []).length;

const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export const gdpiApi = {
  getItems: (q: ItemQuery = {}) =>
    procounselApi.get<{ items: GdpiItem[] }>(`${MBA}/gdpi/items`, { params: clean(q) }).then((r) => r.data),
  createSession: (body: SessionInput) =>
    procounselApi.post<GdpiSession>(`${MBA}/me/gdpi/sessions`, body).then((r) => r.data),
  getSessions: () =>
    procounselApi.get<{ sessions: GdpiSessionSummary[] }>(`${MBA}/me/gdpi/sessions`).then((r) => r.data),
  getSession: (id: string) =>
    procounselApi.get<GdpiSession>(`${MBA}/me/gdpi/sessions/${encodeURIComponent(id)}`).then((r) => r.data),
  submitAnswer: (id: string, body: { questionId: string; answerText: string }) =>
    procounselApi
      .post<AnswerResponse>(`${MBA}/me/gdpi/sessions/${encodeURIComponent(id)}/answers`, body)
      .then((r) => r.data),
};

export const gdpiKeys = {
  items: (q: ItemQuery) => ["mba", "gdpi", "items", q] as const,
  sessions: ["mba", "gdpi", "sessions"] as const,
  session: (id: string) => ["mba", "gdpi", "session", id] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useGdpiItems = (q: ItemQuery = {}) =>
  useQuery({ queryKey: gdpiKeys.items(q), queryFn: () => gdpiApi.getItems(q), retry, staleTime: 10 * 60_000 });

export const useGdpiSessions = (enabled = true) =>
  useQuery({ queryKey: gdpiKeys.sessions, queryFn: gdpiApi.getSessions, retry, enabled, staleTime: 0 });

export const useGdpiSession = (id: string | null | undefined) =>
  useQuery({
    queryKey: gdpiKeys.session(id ?? ""),
    queryFn: () => gdpiApi.getSession(id as string),
    retry,
    enabled: !!id,
    staleTime: 0,
  });

export const useCreateGdpiSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gdpiApi.createSession,
    onSuccess: (session) => {
      qc.setQueryData(gdpiKeys.session(session.id), session);
      void qc.invalidateQueries({ queryKey: gdpiKeys.sessions });
    },
  });
};

export const useSubmitGdpiAnswer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...body }: { sessionId: string; questionId: string; answerText: string }) =>
      gdpiApi.submitAnswer(sessionId, body),
    onSuccess: (res) => {
      qc.setQueryData(gdpiKeys.session(res.session.id), res.session);
      void qc.invalidateQueries({ queryKey: gdpiKeys.sessions });
    },
  });
};

/** Copy for the AI feedback errors (503 not configured / 429 shared daily quota). */
export function gdpiErrorMessage(err: unknown, fallback: string): string {
  switch (mbaStatus(err)) {
    case 429:
      return "You've used today's AI feedback limit (shared with practice hints). It resets at midnight IST.";
    case 503:
      return "AI feedback isn't available right now. Please try again later.";
    default: {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      return typeof detail === "string" && detail.trim() ? detail : fallback;
    }
  }
}
