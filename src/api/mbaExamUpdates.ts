import { useQuery } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus } from "@/api/mba";

/**
 * Official exam updates (admit card, answer key, results, registration dates) posted by the ProCounsel team,
 * each linking the exam body's own page. Contract: procounsel-neet-api/docs/mba-api.md → "Exam updates".
 */

export type ExamUpdateKind = "registration" | "admit_card" | "exam_date" | "answer_key" | "result" | "other";

export interface ExamUpdate {
  id: string;
  exam: string;
  examLabel: string;
  kind: ExamUpdateKind;
  kindLabel: string;
  title: string;
  detail: string | null;
  /** YYYY-MM-DD the update is about (e.g. result day). */
  eventDate: string | null;
  /** The official page; always https. */
  sourceUrl: string;
  publishedAt: string | null;
}

export interface ExamUpdatesResponse {
  /** The exams the list is filtered by (the student's targets; CAT when unset). */
  exams: string[];
  updates: ExamUpdate[];
}

export const mbaExamUpdatesApi = {
  getMine: () => procounselApi.get<ExamUpdatesResponse>("/mba/me/exam-updates").then((r) => r.data),
};

export const useMbaExamUpdates = () =>
  useQuery({
    queryKey: ["mba", "exam-updates"] as const,
    queryFn: mbaExamUpdatesApi.getMine,
    staleTime: 5 * 60_000,
    retry: (count, err) => {
      const status = mbaStatus(err);
      if (status !== null && status >= 400 && status < 500) return false;
      return count < 1;
    },
  });
