import axios from "axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";

/**
 * ProCounsel MBA (CAT prep) — client for procounsel-neet-api `/api/v1/mba`.
 *
 * Types are copied from procounsel-neet-api/docs/mba-api.md (the contract).
 * Change the contract first, then these types. Nothing here invents a field.
 *
 * The API returns absent optional fields as `null` rather than omitting them,
 * so every optional field below is typed `?: T | null`.
 *
 * All 🔒 endpoints ride on `procounselApi`, which attaches the Java login JWT.
 */

const MBA = "/mba";

// ── Shared types ──────────────────────────────────────────────────────────────
export type Source = {
  kind: "official" | "licensed" | "faculty" | "original";
  title: string;
  /** Required for "official" and "licensed". */
  url?: string | null;
  year?: number | null;
  retrievedAt?: string | null;
};
/** CAT sections. CAT-only features (drills, planner, estimator, insights) use these. */
export type SectionId = "VARC" | "DILR" | "QA";
/** Any exam's section id (CAT: VARC/DILR/QA; XAT: VALR/DM/QADI/GK; SNAP: GE/ALR/QDIDS/EMV …). */
export type ExamSectionId = string;
/** "cat" | "xat" | "snap" | "nmat" | "cmat" | "mat" | "gmat" | "mah-mba-cet". */
export type ExamId = string;
export type QuestionType = "MCQ" | "TITA";

export interface ExamSection {
  id: ExamSectionId;
  name: string;
  /** null = not announced. */
  questionCount: number | null;
  /** null = no timer of its own (the section shares a timer block). */
  durationMinutes: number | null;
  /** false: scored and shown on its own, not added to the total (XAT GK). */
  countsInTotal?: boolean;
}
export interface MarkingRule {
  type: QuestionType;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** null = every section; otherwise only these. */
  sections?: ExamSectionId[] | null;
}
/** Sections sharing one timer; the student moves freely between them while it runs. */
export interface TimerBlock {
  id: string;
  name?: string | null;
  sectionIds: ExamSectionId[];
  durationMinutes: number;
}
export interface ExamVersion {
  year: number;
  sections: ExamSection[];
  marking: MarkingRule[];
  totalDurationMinutes: number;
  /** false: the student picks the order of the timer blocks (NMAT, GMAT). */
  sectionOrderLocked: boolean;
  source: Source;
  /** null = every section has its own timer (CAT). */
  timerBlocks?: TimerBlock[] | null;
  /** XAT: `marks` per unanswered question of `sections` beyond the first `freeCount`. */
  unansweredPenalty?: { sections: ExamSectionId[]; freeCount: number; marks: number } | null;
  /** "practice" = not the exam's own (scaled / adaptive) score. */
  scoring?: "official" | "practice";
  /** Plain-language marking and timing summary for the instructions screen. */
  scoringNote?: string | null;
}
export interface Exam {
  id: ExamId;
  name: string;
  conductingBody: string;
  officialUrl: string;
  versions: ExamVersion[];
  /** The real exam is computer-adaptive; ProCounsel tests are fixed-form practice. */
  adaptive?: boolean;
}

/** The CAT config (sections are always VARC / DILR / QA). */
export type CatExamSection = ExamSection & { id: SectionId };
export type CatExamVersion = Omit<ExamVersion, "sections"> & { sections: CatExamSection[] };
export type CatExam = Omit<Exam, "id" | "versions"> & { id: "cat"; versions: CatExamVersion[] };

export interface QuestionSet {
  id: string;
  kind: "passage" | "dilr_set" | "data";
  title?: string | null;
  contentHtml: string;
  images?: string[] | null;
}
export interface QuestionPublic {
  id: string;
  examId: ExamId;
  paperId?: string | null;
  section: ExamSectionId;
  topic?: string | null;
  subtopic?: string | null;
  type: QuestionType;
  stemHtml: string;
  /** MCQ only. */
  options?: { id: string; textHtml: string }[] | null;
  setId?: string | null;
  set?: QuestionSet | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  year?: number | null;
  slot?: number | null;
  source: Source;
  /** From an actual past CAT paper — label it "CAT {year} Slot {slot}". */
  isPyq?: boolean;
}
/** A question in the practice list, with the student's bookmark state. */
export interface PracticeQuestion extends QuestionPublic {
  bookmarked: boolean;
}

export interface QuestionReveal {
  correctAnswer: string;
  solutionHtml?: string | null;
  isCorrect?: boolean | null;
  /** Other ways to solve it (HTML), shown after the main solution. */
  alternativeApproaches?: string[] | null;
  /** Video solution — always an https:// link (YouTube etc.). */
  videoUrl?: string | null;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export type MbaLevel = "beginner" | "intermediate" | "advanced";
export interface MbaProfileInput {
  targetExam: "cat";
  examDate?: string | null;
  targetPercentile?: number | null;
  currentLevel: MbaLevel;
  weeklyStudyHours: number;
  studyDays: number[];
  targetPrograms?: string[] | null;
  /** Every exam the student prepares for (null = CAT only). */
  targetExams?: ExamId[] | null;
}
export interface MbaProfile extends MbaProfileInput {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Attempts ──────────────────────────────────────────────────────────────────
export type AttemptStatus = "in_progress" | "submitted";
export interface AttemptSummary {
  id: string;
  testId: string;
  title: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
}
/** Optional self-rating of an answer (practice modes). */
export type Confidence = "sure" | "unsure" | "guess";
export interface ConfidenceBucket {
  answered: number;
  correct: number;
  incorrect: number;
}
/** Answered questions of a result by self-rating; `unrated` = answered without one. */
export interface ConfidenceBreakdown {
  sure: ConfidenceBucket;
  unsure: ConfidenceBucket;
  guess: ConfidenceBucket;
  unrated: ConfidenceBucket;
}
export interface AttemptResponse {
  answer: string | null;
  markedForReview: boolean;
  timeSpentMs: number;
  /** Kept by the server only together with an answer. */
  confidence?: Confidence | null;
}
export interface Attempt {
  id: string;
  testId: string;
  title: string;
  status: AttemptStatus;
  /** First section of the current timer block. */
  currentSection: ExamSectionId;
  sectionOrder: ExamSectionId[];
  /** End of the current timer block. */
  sectionEndsAt: string;
  serverNow: string;
  questions: (QuestionPublic & { sectionIndex: number })[];
  responses: Record<string, AttemptResponse>;
  savedSeq: number;
  examId?: ExamId;
  /** In attempt order; answers can change in any section of the current block. */
  timerBlocks?: TimerBlock[];
  currentBlock?: string | null;
}
export interface AttemptResultSection {
  id: ExamSectionId;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number | null;
  timeSpentMs: number;
  /** false: not part of score / maxScore (XAT GK). */
  countsInTotal?: boolean;
  /** Unanswered-question penalty included in the score (XAT). */
  penalty?: number;
}
export type AttemptResultQuestion = QuestionPublic &
  QuestionReveal & { yourAnswer: string | null; timeSpentMs: number; marks: number; confidence?: Confidence | null };
/** Standing among ProCounsel students' first attempts of the same test — never an official CAT percentile. */
export interface ProcounselPercentile {
  /** 0–100; null until at least `minStudents` other students have taken the test. */
  percentile: number | null;
  /** Other students compared with. */
  students: number;
  minStudents: number;
  score: number;
  basis: "first_attempt";
  note: string;
}
export interface AttemptResult {
  id: string;
  testId: string;
  title: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  sections: AttemptResultSection[];
  questions: AttemptResultQuestion[];
  confidence?: ConfidenceBreakdown | null;
  isPyq?: boolean;
  year?: number | null;
  slot?: number | null;
  procounselPercentile?: ProcounselPercentile | null;
  examId?: ExamId;
}
export interface SaveResponsesBody {
  seq: number;
  responses: ({ questionId: string } & AttemptResponse)[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export type PriorityKind =
  | "resume_mock"
  | "review_mistakes"
  | "practice_weak_section"
  | "take_diagnostic"
  | "daily_challenge";
export interface MbaDashboard {
  profile: MbaProfile | null;
  daysToExam: number | null;
  sections: { id: SectionId; attempted: number; correct: number; accuracy: number | null }[];
  totals: {
    questionsAttempted: number;
    correct: number;
    bookmarked: number;
    mistakesDue: number;
    mocksCompleted: number;
  };
  recentAttempts: AttemptSummary[];
  inProgressAttempt: AttemptSummary | null;
  priorities: { kind: PriorityKind; title: string; detail: string; href: string }[];
  streak: { current: number; lastActiveDate: string | null };
}

// ── Practice / mistakes / daily ───────────────────────────────────────────────
export type PracticeFilter = "all" | "unsolved" | "incorrect" | "bookmarked";
/** Previous-year papers vs ProCounsel originals. */
export type QuestionSource = "all" | "pyq" | "original";
export interface QuestionQuery {
  /** Default "cat". */
  examId?: ExamId;
  section?: ExamSectionId;
  source?: QuestionSource;
  topic?: string;
  year?: number;
  slot?: number;
  paperId?: string;
  filter?: PracticeFilter;
  limit?: number;
  cursor?: string;
}
export type PracticeAnswerResult = QuestionReveal & { stats: { attempts: number; correct: number } };

export type MistakeCategory =
  | "concept"
  | "calculation"
  | "misread"
  | "selection"
  | "time_pressure"
  | "guess";
export interface MistakeItem {
  question: QuestionPublic;
  lastAnswer: string;
  category?: MistakeCategory | null;
  note?: string | null;
  nextReviewAt?: string | null;
  retries: number;
}
export interface DailyChallenge {
  date: string;
  questions: QuestionPublic[];
  completed: number;
}

export interface MbaTest {
  id: string;
  title: string;
  kind: "full_mock" | "sectional";
  paperId: string;
  paperTitle?: string;
  sections: ExamSectionId[];
  durationMinutes: number;
  questionCount: number;
  /** Previous-year CAT paper (vs a ProCounsel original). */
  isPyq?: boolean;
  year?: number | null;
  slot?: number | null;
  examVersionYear?: number | null;
  examId?: ExamId;
  timerBlocks?: TimerBlock[];
  /** false: pick the order of the timer blocks when starting. */
  sectionOrderLocked?: boolean;
}
export interface PaperSummary {
  id: string;
  title: string;
  examVersionYear: number;
  year: number | null;
  slot: number | null;
  questionCount: number;
  sections: { id: ExamSectionId; questionCount: number }[];
  source: Source;
  isPyq?: boolean;
}

export type HintLevel = 1 | 2 | 3;
export interface HintResponse {
  text: string;
  level: HintLevel;
  remainingToday: number;
  grounded: true;
}

// ── Phase D: programmes, official CAT minimums, eligibility, shortlist ───────
/** Every Phase D fee / intake / salary / cutoff figure carries one of these. */
export type OfficialSource = {
  kind: "official";
  title: string;
  url: string;
  year: number | null;
  retrievedAt: string;
};
/** PwD is the separate `pwd` flag, not a category. */
export type MbaCategory = "General" | "EWS" | "NC-OBC" | "SC" | "ST";
export type MbaGender = "Male" | "Female" | "Transgender";
export interface DataFreshness {
  /** Latest source retrieval, YYYY-MM-DD. */
  retrievedAt: string | null;
  /** e.g. ["2026-28", "2027-29"]. */
  cutoffPolicyBatches: string[];
  note: string;
}
export interface ProgramKeyFacts {
  code: string;
  name: string;
  durationYears: number | null;
  /** INR, whole programme. */
  feeTotal: number | null;
  intake: number | null;
  /** INR per annum. */
  medianSalary: number | null;
  /** Graduating year. */
  medianSalaryYear: number | null;
}
export interface ProgramDetail extends ProgramKeyFacts {
  feeNote: string | null;
  feeSource: OfficialSource | null;
  intakeNote: string | null;
  intakeSource: OfficialSource | null;
  salaryNote: string | null;
  salarySource: OfficialSource | null;
}
export interface Cutoff {
  policyBatch: string;
  stage: "shortlisting";
  programCode: string;
  category: MbaCategory;
  pwd: boolean;
  /** null = all genders. */
  gender: MbaGender | null;
  overall: number | null;
  varc: number | null;
  dilr: number | null;
  qa: number | null;
  notes: string | null;
  source: OfficialSource;
}
export interface InstituteSummary {
  slug: string;
  name: string;
  shortName: string;
  city: string | null;
  state: string | null;
  website: string | null;
  programs: ProgramKeyFacts[];
  hasCutoffs: boolean;
  dataFreshness: DataFreshness;
}
export interface InstituteDetail extends Omit<InstituteSummary, "programs"> {
  programs: ProgramDetail[];
  cutoffs: Cutoff[];
  cutoffNotes: string | null;
  /** Distinct, all used on the page. */
  sources: OfficialSource[];
}
export interface ProgramsResponse {
  institutes: InstituteSummary[];
  dataFreshness: DataFreshness;
}

export interface EligibilityInput {
  category: MbaCategory;
  pwd?: boolean;
  gender?: MbaGender;
  /** 0–100. */
  overall: number;
  varc?: number;
  dilr?: number;
  qa?: number;
}
export type EligibilityStatus = "meets_minimum" | "below_minimum" | "unknown";
export type EligibilityPart = "overall" | "VARC" | "DILR" | "QA";
export interface EligibilityThresholds {
  overall: number | null;
  varc: number | null;
  dilr: number | null;
  qa: number | null;
}
export interface EligibilityResult {
  slug: string;
  name: string;
  shortName: string;
  programCode: string | null;
  programName: string | null;
  policyBatch: string | null;
  status: EligibilityStatus;
  /** Below the published minimum. */
  failedOn: EligibilityPart[];
  /** A minimum exists but no percentile was given. */
  notChecked: EligibilityPart[];
  /** The minimums used. */
  thresholds: EligibilityThresholds | null;
  notes: string | null;
  source: OfficialSource | null;
}
export interface EligibilityResponse {
  input: EligibilityInput;
  results: EligibilityResult[];
  counts: Record<EligibilityStatus, number>;
  /** Show verbatim near the results. */
  methodology: string;
  /** Show verbatim near the results. */
  limitations: string;
  dataFreshness: DataFreshness;
}

export type ShortlistStatus = "interested" | "shortlisted" | "applied" | "interview" | "offer" | "declined";
export interface ShortlistItem {
  slug: string;
  /** null if the institute is no longer listed. */
  name: string | null;
  shortName: string | null;
  status: ShortlistStatus;
  /** YYYY-MM-DD. */
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
/** PUT is a full replace of the entry (createdAt is kept). */
export interface ShortlistInput {
  status?: ShortlistStatus;
  deadline?: string | null;
  /** ≤ 2000 characters. */
  notes?: string | null;
}

// ── Requests ──────────────────────────────────────────────────────────────────
const clean = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );

// In-app college list (contract: docs/mba-api.md → GET /colleges)
export type CollegeKind = "iim" | "other";
export interface CollegeQuery {
  q?: string;
  city?: string;
  state?: string;
  kind?: CollegeKind;
}
export interface CollegeProgram {
  /** IIMs only. */
  code: string | null;
  name: string;
  durationYears: number | null;
  feeTotal: number | null;
  intake: number | null;
  medianSalary: number | null;
  salaryYear: string | null;
}
export interface CollegeSummary {
  slug: string;
  name: string;
  shortName: string;
  kind: CollegeKind;
  type: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  examsAccepted: string[];
  programs: CollegeProgram[];
  /** Official minimum CAT thresholds on record (IIMs; used by the eligibility check). */
  hasCutoffs: boolean;
  /** Official, YYYY-MM-DD or YYYY-MM. */
  applicationDeadline: string | null;
  /** Official admissions page for the figures shown. */
  sourceUrl: string | null;
}
export interface CollegesResponse {
  colleges: CollegeSummary[];
  total: number;
  cities: string[];
}

export const mbaApi = {
  getExams: () => procounselApi.get<{ exams: Exam[] }>(`${MBA}/exams`).then((r) => r.data),
  getExam: (examId = "cat") => procounselApi.get<Exam>(`${MBA}/exams/${examId}`).then((r) => r.data),
  getPapers: (examId = "cat") =>
    procounselApi
      .get<{ papers: PaperSummary[] }>(`${MBA}/papers`, { params: { examId } })
      .then((r) => r.data),

  /** Resolves to null when the student has not onboarded (404). */
  getProfile: async (): Promise<MbaProfile | null> => {
    try {
      const { data } = await procounselApi.get<MbaProfile>(`${MBA}/me/profile`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },
  putProfile: (body: MbaProfileInput) =>
    procounselApi.put<MbaProfile>(`${MBA}/me/profile`, body).then((r) => r.data),
  getDashboard: () => procounselApi.get<MbaDashboard>(`${MBA}/me/dashboard`).then((r) => r.data),

  getQuestions: (q: QuestionQuery) =>
    procounselApi
      .get<{ questions: PracticeQuestion[]; nextCursor: string | null }>(`${MBA}/questions`, {
        params: clean(q),
      })
      .then((r) => r.data),
  answerPractice: (body: { questionId: string; answer: string; timeSpentMs: number; confidence?: Confidence }) =>
    procounselApi.post<PracticeAnswerResult>(`${MBA}/practice/answers`, body).then((r) => r.data),
  setBookmark: (questionId: string, on: boolean) =>
    (on
      ? procounselApi.put<{ bookmarked: boolean }>(`${MBA}/me/bookmarks/${encodeURIComponent(questionId)}`)
      : procounselApi.delete<{ bookmarked: boolean }>(`${MBA}/me/bookmarks/${encodeURIComponent(questionId)}`)
    ).then((r) => r.data),

  getMistakes: (q: { section?: ExamSectionId; due?: boolean; examId?: ExamId }) =>
    procounselApi
      .get<{ items: MistakeItem[] }>(`${MBA}/me/mistakes`, {
        params: clean({ section: q.section, due: q.due ? "true" : undefined, examId: q.examId }),
      })
      .then((r) => r.data),
  patchMistake: (questionId: string, body: { category?: MistakeCategory; note?: string }) =>
    procounselApi
      .patch<MistakeItem>(`${MBA}/me/mistakes/${encodeURIComponent(questionId)}`, body)
      .then((r) => r.data),
  getDaily: () => procounselApi.get<DailyChallenge>(`${MBA}/daily`).then((r) => r.data),

  getTests: (examId: ExamId = "cat") =>
    procounselApi.get<{ tests: MbaTest[] }>(`${MBA}/tests`, { params: { examId } }).then((r) => r.data),
  /** `sectionOrder`: timer-block order, only for tests with `sectionOrderLocked: false`. */
  startAttempt: (testId: string, sectionOrder?: string[]) =>
    procounselApi
      .post<Attempt>(`${MBA}/attempts`, sectionOrder ? { testId, sectionOrder } : { testId })
      .then((r) => r.data),
  getAttempt: (id: string) => procounselApi.get<Attempt>(`${MBA}/attempts/${id}`).then((r) => r.data),
  saveResponses: (id: string, body: SaveResponsesBody) =>
    procounselApi
      .patch<{ savedSeq: number }>(`${MBA}/attempts/${id}/responses`, body)
      .then((r) => r.data),
  submitSection: (id: string, sectionId: ExamSectionId) =>
    procounselApi.post<Attempt>(`${MBA}/attempts/${id}/sections/${sectionId}/submit`).then((r) => r.data),
  submitAttempt: (id: string) =>
    procounselApi.post<AttemptResult>(`${MBA}/attempts/${id}/submit`).then((r) => r.data),
  getResult: (id: string) =>
    procounselApi.get<AttemptResult>(`${MBA}/attempts/${id}/result`).then((r) => r.data),
  getMyAttempts: () =>
    procounselApi.get<{ attempts: AttemptSummary[] }>(`${MBA}/me/attempts`).then((r) => r.data),

  getHint: (body: { questionId: string; level: HintLevel; studentAnswer?: string }) =>
    procounselApi.post<HintResponse>(`${MBA}/ai/hint`, body).then((r) => r.data),

  // Phase D — public
  getPrograms: (q: { state?: string; q?: string } = {}) =>
    procounselApi.get<ProgramsResponse>(`${MBA}/programs`, { params: clean(q) }).then((r) => r.data),
  /** Every institute a student can shortlist: IIMs + the bundled non-IIM colleges. */
  getColleges: (q: CollegeQuery = {}) =>
    procounselApi.get<CollegesResponse>(`${MBA}/colleges`, { params: clean(q) }).then((r) => r.data),
  getProgram: (slug: string) =>
    procounselApi.get<InstituteDetail>(`${MBA}/programs/${encodeURIComponent(slug)}`).then((r) => r.data),
  /** Public: works without a login (the token is attached only if present). */
  checkEligibility: (body: EligibilityInput) =>
    procounselApi.post<EligibilityResponse>(`${MBA}/eligibility`, body).then((r) => r.data),

  // Phase D — student 🔒
  getShortlist: () => procounselApi.get<{ items: ShortlistItem[] }>(`${MBA}/me/shortlist`).then((r) => r.data),
  putShortlistItem: (slug: string, body: ShortlistInput) =>
    procounselApi.put<ShortlistItem>(`${MBA}/me/shortlist/${encodeURIComponent(slug)}`, body).then((r) => r.data),
  deleteShortlistItem: (slug: string) =>
    procounselApi.delete<{ removed: boolean }>(`${MBA}/me/shortlist/${encodeURIComponent(slug)}`).then((r) => r.data),
};

/** The `{detail}` message the API returns, or a fallback. */
export function mbaErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (!err.response) return "Could not reach the server. Check your connection and try again.";
  }
  return fallback;
}

export const mbaStatus = (err: unknown): number | null =>
  axios.isAxiosError(err) ? (err.response?.status ?? null) : null;

// ── React Query hooks ────────────────────────────────────────────────────────
export const mbaKeys = {
  all: ["mba"] as const,
  profile: ["mba", "profile"] as const,
  dashboard: ["mba", "dashboard"] as const,
  exam: ["mba", "exam"] as const,
  exams: ["mba", "exams"] as const,
  examById: (examId: ExamId) => ["mba", "exam", examId] as const,
  papers: ["mba", "papers"] as const,
  questions: (q: QuestionQuery) => ["mba", "questions", q] as const,
  mistakes: (q: { section?: ExamSectionId; due?: boolean; examId?: ExamId }) => ["mba", "mistakes", q] as const,
  daily: ["mba", "daily"] as const,
  tests: ["mba", "tests"] as const,
  testsFor: (examId: ExamId) => ["mba", "tests", examId] as const,
  attempts: ["mba", "attempts"] as const,
  result: (id: string) => ["mba", "result", id] as const,
  programs: (q: { state?: string; q?: string }) => ["mba", "programs", q] as const,
  program: (slug: string) => ["mba", "program", slug] as const,
  colleges: (q: CollegeQuery) => ["mba", "colleges", q] as const,
  shortlist: ["mba", "shortlist"] as const,
};

/** 4xx answers are final — retrying a 404 just delays the empty state. */
const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useMbaProfile = (enabled = true) =>
  useQuery({ queryKey: mbaKeys.profile, queryFn: mbaApi.getProfile, retry, enabled, staleTime: 5 * 60_000 });

export const useSaveMbaProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mbaApi.putProfile,
    onSuccess: (profile) => {
      qc.setQueryData(mbaKeys.profile, profile);
      void qc.invalidateQueries({ queryKey: mbaKeys.dashboard });
    },
  });
};

export const useMbaDashboard = (enabled = true) =>
  useQuery({ queryKey: mbaKeys.dashboard, queryFn: mbaApi.getDashboard, retry, enabled, staleTime: 30_000 });

export const useMbaExam = () =>
  useQuery({ queryKey: mbaKeys.exam, queryFn: () => mbaApi.getExam("cat"), retry, staleTime: 60 * 60_000 });

export const useMbaPapers = () =>
  useQuery({ queryKey: mbaKeys.papers, queryFn: () => mbaApi.getPapers("cat"), retry, staleTime: 60 * 60_000 });

/** Cursor-paged question bank for practice. `q.cursor` is managed here. */
export const useMbaQuestionPages = (q: Omit<QuestionQuery, "cursor">) =>
  useInfiniteQuery({
    queryKey: mbaKeys.questions(q),
    queryFn: ({ pageParam }) => mbaApi.getQuestions({ ...q, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    retry,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

export const useMbaMistakes = (q: { section?: ExamSectionId; due?: boolean; examId?: ExamId }) =>
  useQuery({ queryKey: mbaKeys.mistakes(q), queryFn: () => mbaApi.getMistakes(q), retry, staleTime: 0 });

export const useMbaDaily = () =>
  useQuery({ queryKey: mbaKeys.daily, queryFn: mbaApi.getDaily, retry, staleTime: 5 * 60_000 });

/** CAT tests (the key stays `["mba","tests"]` so existing invalidations keep working). */
export const useMbaTests = () =>
  useQuery({ queryKey: mbaKeys.tests, queryFn: () => mbaApi.getTests("cat"), retry, staleTime: 5 * 60_000 });

/** Tests of one exam. CAT reuses `useMbaTests`' cache entry. */
export const useMbaExamTests = (examId: ExamId) =>
  useQuery({
    queryKey: examId === "cat" ? mbaKeys.tests : mbaKeys.testsFor(examId),
    queryFn: () => mbaApi.getTests(examId),
    retry,
    staleTime: 5 * 60_000,
  });

/** Every exam config the API has (CAT plus the other MBA exams once seeded). */
export const useMbaExams = () =>
  useQuery({ queryKey: mbaKeys.exams, queryFn: mbaApi.getExams, retry, staleTime: 60 * 60_000 });

export const useMbaExamConfig = (examId: ExamId) =>
  useQuery({
    queryKey: examId === "cat" ? mbaKeys.exam : mbaKeys.examById(examId),
    queryFn: () => mbaApi.getExam(examId),
    retry,
    staleTime: 60 * 60_000,
  });

export const useMbaAttempts = () =>
  useQuery({ queryKey: mbaKeys.attempts, queryFn: mbaApi.getMyAttempts, retry, staleTime: 0 });

export const useMbaResult = (id: string | undefined) =>
  useQuery({
    queryKey: mbaKeys.result(id ?? ""),
    queryFn: () => mbaApi.getResult(id as string),
    enabled: !!id,
    retry,
  });

export const usePracticeAnswer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mbaApi.answerPractice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mbaKeys.dashboard });
    },
  });
};

export const useBookmark = () =>
  useMutation({
    mutationFn: ({ questionId, on }: { questionId: string; on: boolean }) =>
      mbaApi.setBookmark(questionId, on),
  });

export const usePatchMistake = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, ...body }: { questionId: string; category?: MistakeCategory; note?: string }) =>
      mbaApi.patchMistake(questionId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mba", "mistakes"] });
    },
  });
};

export const useHint = () => useMutation({ mutationFn: mbaApi.getHint });

export const useMbaColleges = (q: CollegeQuery = {}) =>
  useQuery({
    queryKey: mbaKeys.colleges(q),
    queryFn: () => mbaApi.getColleges(q),
    retry,
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

export const useMbaPrograms = (q: { state?: string; q?: string } = {}) =>
  useQuery({
    queryKey: mbaKeys.programs(q),
    queryFn: () => mbaApi.getPrograms(q),
    retry,
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

export const useMbaProgram = (slug: string | null | undefined) =>
  useQuery({
    queryKey: mbaKeys.program(slug ?? ""),
    queryFn: () => mbaApi.getProgram(slug as string),
    enabled: !!slug,
    retry,
    staleTime: 10 * 60_000,
  });

export const useEligibilityCheck = () => useMutation({ mutationFn: mbaApi.checkEligibility });

export const useMbaShortlist = (enabled = true) =>
  useQuery({ queryKey: mbaKeys.shortlist, queryFn: mbaApi.getShortlist, retry, enabled, staleTime: 0 });

export const useSaveShortlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, ...body }: ShortlistInput & { slug: string }) => mbaApi.putShortlistItem(slug, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mbaKeys.shortlist }),
  });
};

export const useRemoveShortlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => mbaApi.deleteShortlistItem(slug),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mbaKeys.shortlist }),
  });
};

export const SHORTLIST_STATUSES: { id: ShortlistStatus; label: string }[] = [
  { id: "interested", label: "Interested" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "declined", label: "Declined" },
];

export const MBA_CATEGORIES: { id: MbaCategory; label: string }[] = [
  { id: "General", label: "General" },
  { id: "EWS", label: "EWS" },
  { id: "NC-OBC", label: "NC-OBC" },
  { id: "SC", label: "SC" },
  { id: "ST", label: "ST" },
];

/** Every exam a student can target (profile multi-select). CAT is the default everywhere. */
export const MBA_EXAMS: { id: ExamId; label: string; name: string }[] = [
  { id: "cat", label: "CAT", name: "Common Admission Test" },
  { id: "xat", label: "XAT", name: "Xavier Aptitude Test" },
  { id: "snap", label: "SNAP", name: "Symbiosis National Aptitude Test" },
  { id: "nmat", label: "NMAT", name: "NMAT by GMAC" },
  { id: "cmat", label: "CMAT", name: "Common Management Admission Test" },
  { id: "mat", label: "MAT", name: "Management Aptitude Test" },
  { id: "gmat", label: "GMAT", name: "GMAT Exam" },
  { id: "mah-mba-cet", label: "MAH-CET", name: "MAH-MBA/MMS-CET" },
];
export const examLabel = (id: ExamId | null | undefined): string =>
  MBA_EXAMS.find((e) => e.id === id)?.label ?? (id ? id.toUpperCase() : "CAT");

export const SECTION_LABEL: Record<SectionId, string> = {
  VARC: "Verbal Ability & Reading Comprehension",
  DILR: "Data Interpretation & Logical Reasoning",
  QA: "Quantitative Ability",
};
export const SECTIONS: SectionId[] = ["VARC", "DILR", "QA"];
