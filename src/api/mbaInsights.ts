import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type ExamId, type ExamSectionId, type SectionId } from "@/api/mba";

/**
 * ProCounsel MBA — mock analyst, insights, question reports and the daily
 * leaderboard. Types copied from procounsel-neet-api/docs/mba-api.md
 * ("Mock analyst, insights, question reports, daily leaderboard").
 */

const MBA = "/mba";

// ── Mock analyst ──────────────────────────────────────────────────────────────
export type Outcome = "correct" | "incorrect" | "skipped";
export type Difficulty = "easy" | "medium" | "hard";
export interface QuestionRef {
  questionId: string;
  section: SectionId;
  number: number;
  topic: string | null;
  difficulty: Difficulty | null;
  outcome: Outcome;
  timeSpentMs: number;
}
export interface TimeSink extends QuestionRef {
  sectionMedianMs: number;
  ratio: number;
}
export interface Bucket {
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number | null;
}
export interface PracticeLink {
  id: string;
  label: string;
  href: string;
}
export interface DeterministicAnalysis {
  attemptId: string;
  title: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  questionCount: number;
  attempted: number;
  lowEvidence: boolean;
  evidenceNote: string | null;
  sections: {
    id: SectionId;
    questionCount: number;
    score: number;
    maxScore: number;
    attempted: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    accuracy: number | null;
    timeSpentMs: number;
    medianTimeMs: number | null;
  }[];
  byDifficulty: (Bucket & { difficulty: Difficulty | "unrated" })[];
  byTopic: (Bucket & { section: SectionId; topic: string; timeSpentMs: number })[];
  missedEasy: QuestionRef[];
  timeSinks: TimeSink[];
  selection: {
    easySkipped: number;
    easyIncorrect: number;
    hardAttempted: number;
    hardCorrect: number;
    timeOnIncorrectMs: number;
    timeOnHardIncorrectMs: number;
    timeSinkCount: number;
  };
  links: PracticeLink[];
}
export interface AiAnalysis {
  summary: string;
  strengths: string[];
  priorities: { title: string; detail: string; nextSteps: string[]; link: PracticeLink }[];
  selectionAdvice: string;
  generatedAt: string;
  model: string;
}
export interface AttemptAnalysisResponse {
  attemptId: string;
  analysis: DeterministicAnalysis;
  ai: AiAnalysis | null;
  remainingToday: number | null;
}

// ── Insights ──────────────────────────────────────────────────────────────────
export type TopicStatus = "weak" | "ok" | "strong" | "low_evidence";
export interface TopicInsight {
  /** CAT: VARC/DILR/QA; other exams: their own section ids. */
  section: ExamSectionId;
  topic: string;
  questions: number;
  attempts: number;
  correct: number;
  accuracy: number | null;
  avgTimeMs: number | null;
  timedAnswers: number;
  confidence: "sufficient" | "low";
  status: TopicStatus;
  href: string;
}
export interface TrendPoint {
  attemptId: string;
  title: string;
  kind: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  sections: { id: ExamSectionId; score: number; maxScore: number; accuracy: number | null }[];
}
export interface MbaInsights {
  topics: TopicInsight[];
  weakTopics: TopicInsight[];
  lowEvidenceCount: number;
  trend: TrendPoint[];
  rules: { minAttempts: number; weakBelow: number; strongFrom: number };
}

// ── Reports ───────────────────────────────────────────────────────────────────
export type ReportCategory = "wrong_answer" | "unclear" | "typo" | "solution_error" | "other";
export type ReportStatus = "open" | "resolved" | "rejected";
export interface MyReport {
  questionId: string;
  category: ReportCategory;
  note: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
export const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: "wrong_answer", label: "Answer key looks wrong" },
  { id: "solution_error", label: "Mistake in the solution" },
  { id: "unclear", label: "Question is unclear" },
  { id: "typo", label: "Typo or formatting" },
  { id: "other", label: "Something else" },
];

// ── Leaderboard ───────────────────────────────────────────────────────────────
export interface LeaderboardPrefs {
  optedIn: boolean;
  displayName: string;
  suggestedName: string;
}
export interface DailyEntry {
  rank: number;
  displayName: string;
  answered: number;
  correct: number;
  accuracy: number;
  isYou: boolean;
}
export interface DailyBoard {
  date: string;
  questionCount: number;
  participants: number;
  optedIn: boolean;
  entries: DailyEntry[];
  you: DailyEntry | null;
  rule: string;
}
export interface WeeklyEntry {
  rank: number;
  displayName: string;
  daysActive: number;
  answered: number;
  accuracy: number;
  previousAccuracy: number | null;
  improvement: number | null;
  isYou: boolean;
}
export interface WeeklyBoard {
  weekStart: string;
  weekEnd: string;
  participants: number;
  optedIn: boolean;
  entries: WeeklyEntry[];
  you: WeeklyEntry | null;
  rule: string;
}

const q = encodeURIComponent;

export const mbaInsightsApi = {
  getAnalysis: (attemptId: string) =>
    procounselApi.get<AttemptAnalysisResponse>(`${MBA}/me/attempts/${q(attemptId)}/analysis`).then((r) => r.data),
  explainAnalysis: (attemptId: string) =>
    procounselApi.post<AttemptAnalysisResponse>(`${MBA}/me/attempts/${q(attemptId)}/analysis`).then((r) => r.data),
  /** One exam's topics and mock trend (default CAT). */
  getInsights: (examId: ExamId = "cat") =>
    procounselApi.get<MbaInsights>(`${MBA}/me/insights`, { params: { examId } }).then((r) => r.data),
  getMyReport: (questionId: string) =>
    procounselApi.get<{ report: MyReport | null }>(`${MBA}/questions/${q(questionId)}/reports`).then((r) => r.data),
  submitReport: (questionId: string, body: { category: ReportCategory; note?: string }) =>
    procounselApi.post<MyReport>(`${MBA}/questions/${q(questionId)}/reports`, body).then((r) => r.data),
  getLeaderboardPrefs: () => procounselApi.get<LeaderboardPrefs>(`${MBA}/me/leaderboard`).then((r) => r.data),
  putLeaderboardPrefs: (body: { optedIn: boolean; displayName?: string }) =>
    procounselApi.put<LeaderboardPrefs>(`${MBA}/me/leaderboard`, body).then((r) => r.data),
  getDailyBoard: (date?: string) =>
    procounselApi.get<DailyBoard>(`${MBA}/leaderboard/daily`, { params: date ? { date } : {} }).then((r) => r.data),
  getWeeklyBoard: (date?: string) =>
    procounselApi.get<WeeklyBoard>(`${MBA}/leaderboard/weekly`, { params: date ? { date } : {} }).then((r) => r.data),
};

export const insightKeys = {
  analysis: (id: string) => ["mba", "analysis", id] as const,
  insights: ["mba", "insights"] as const,
  report: (questionId: string) => ["mba", "report", questionId] as const,
  prefs: ["mba", "leaderboard", "prefs"] as const,
  board: (view: "daily" | "weekly") => ["mba", "leaderboard", view] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useAttemptAnalysis = (attemptId: string | undefined) =>
  useQuery({
    queryKey: insightKeys.analysis(attemptId ?? ""),
    queryFn: () => mbaInsightsApi.getAnalysis(attemptId!),
    enabled: !!attemptId,
    retry,
    staleTime: 5 * 60_000,
  });

export const useExplainAnalysis = (attemptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mbaInsightsApi.explainAnalysis(attemptId),
    onSuccess: (data) => qc.setQueryData(insightKeys.analysis(attemptId), data),
  });
};

export const useMbaInsights = (examId: ExamId = "cat") =>
  useQuery({
    // CAT keeps the original key so existing invalidations still reach it.
    queryKey: examId === "cat" ? insightKeys.insights : ([...insightKeys.insights, examId] as const),
    queryFn: () => mbaInsightsApi.getInsights(examId),
    retry,
    staleTime: 60_000,
  });

export const useMyReport = (questionId: string, enabled: boolean) =>
  useQuery({
    queryKey: insightKeys.report(questionId),
    queryFn: () => mbaInsightsApi.getMyReport(questionId),
    enabled,
    retry,
    staleTime: 60_000,
  });

export const useSubmitReport = (questionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { category: ReportCategory; note?: string }) => mbaInsightsApi.submitReport(questionId, body),
    onSuccess: (report) => qc.setQueryData(insightKeys.report(questionId), { report }),
  });
};

export const useLeaderboardPrefs = () =>
  useQuery({ queryKey: insightKeys.prefs, queryFn: mbaInsightsApi.getLeaderboardPrefs, retry, staleTime: 5 * 60_000 });

export const useSaveLeaderboardPrefs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { optedIn: boolean; displayName?: string }) => mbaInsightsApi.putLeaderboardPrefs(body),
    onSuccess: (prefs) => {
      qc.setQueryData(insightKeys.prefs, prefs);
      void qc.invalidateQueries({ queryKey: ["mba", "leaderboard"] });
    },
  });
};

export const useDailyBoard = () =>
  useQuery({ queryKey: insightKeys.board("daily"), queryFn: () => mbaInsightsApi.getDailyBoard(), retry, staleTime: 30_000 });

export const useWeeklyBoard = (enabled: boolean) =>
  useQuery({
    queryKey: insightKeys.board("weekly"),
    queryFn: () => mbaInsightsApi.getWeeklyBoard(),
    retry,
    enabled,
    staleTime: 60_000,
  });

/** Server-sent hrefs are only followed when they are in-app paths. */
export const isAppPath = (href: string) => href.startsWith("/") && !href.startsWith("//");
