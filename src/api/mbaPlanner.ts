import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type SectionId } from "@/api/mba";

/**
 * MBA study planner + in-app notifications — client for procounsel-neet-api
 * `/api/v1/mba/me/plan*` and `/me/notifications*`.
 *
 * Types are copied from procounsel-neet-api/docs/mba-api.md ("Study planner",
 * "Notifications"). Change the contract first, then these types.
 */

const MBA = "/mba";

export type PlanTaskType =
  | "practice"
  | "sectional_mock"
  | "full_mock"
  | "revise_mistakes"
  | "daily_challenge"
  | "learn"
  | "custom";
export type PlanTaskStatus = "pending" | "done" | "skipped";

export interface PlanTask {
  id: string;
  /** YYYY-MM-DD (India time). */
  date: string;
  type: PlanTaskType;
  title: string;
  detail: string | null;
  section: SectionId | null;
  topic: string | null;
  questionCount: number | null;
  minutes: number;
  href: string | null;
  status: PlanTaskStatus;
  source: "generated" | "custom";
  generatedBy: string | null;
  edited: boolean;
  autoCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDay {
  date: string;
  /** 0 = Sunday. */
  weekday: number;
  rest: boolean;
  examDay: boolean;
  plannedMinutes: number;
  tasks: PlanTask[];
}

export interface PlanBasis {
  ruleVersion: string;
  examDate: string | null;
  examDateSource: "profile" | "official" | null;
  weeksToExam: number | null;
  weeklyStudyHours: number;
  studyDays: number[];
  minutesPerStudyDay: number;
  level: string;
  mocksThisWeek: number;
  mistakesDue: number;
  sections: { id: SectionId; attempted: number; accuracy: number | null; weight: number }[];
  rules: string[];
}

export interface WeekPlan {
  weekStart: string;
  weekEnd: string;
  today: string;
  generated: boolean;
  canGenerate: boolean;
  /** Seven days, Monday to Sunday. */
  days: PlanDay[];
  summary: { planned: number; done: number; skipped: number; pending: number; plannedMinutes: number; doneMinutes: number };
  basis: PlanBasis;
}

export interface TaskPatch {
  status?: PlanTaskStatus;
  date?: string;
  title?: string;
  minutes?: number;
}

export interface TaskCreate {
  date: string;
  title: string;
  minutes: number;
  type?: PlanTaskType;
  section?: SectionId | null;
  href?: string | null;
  detail?: string | null;
}

export type NotificationKind =
  | "plan_today"
  | "plan_overdue"
  | "mistakes_due"
  | "resume_mock"
  | "cat_countdown"
  | "shortlist_deadline"
  | "new_mock"
  | "counsellor_update"
  | "doubt_reply"
  | "support_reply"
  | "exam_update";

export interface MbaNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  at: string;
  unread: boolean;
}

export interface NotificationsResponse {
  items: MbaNotification[];
  unreadCount: number;
  lastSeenAt: string | null;
}

export const plannerApi = {
  getPlan: (week?: string) =>
    procounselApi.get<WeekPlan>(`${MBA}/me/plan`, { params: week ? { week } : {} }).then((r) => r.data),
  generate: (week?: string) =>
    procounselApi.post<WeekPlan>(`${MBA}/me/plan/generate`, null, { params: week ? { week } : {} }).then((r) => r.data),
  patchTask: (id: string, body: TaskPatch) =>
    procounselApi.patch<PlanTask>(`${MBA}/me/plan/tasks/${encodeURIComponent(id)}`, body).then((r) => r.data),
  createTask: (body: TaskCreate) => procounselApi.post<PlanTask>(`${MBA}/me/plan/tasks`, body).then((r) => r.data),
  deleteTask: (id: string) =>
    procounselApi.delete<{ deleted: boolean }>(`${MBA}/me/plan/tasks/${encodeURIComponent(id)}`).then((r) => r.data),

  getNotifications: () => procounselApi.get<NotificationsResponse>(`${MBA}/me/notifications`).then((r) => r.data),
  markSeen: (dismissIds: string[] = []) =>
    procounselApi
      .patch<{ lastSeenAt: string; dismissed: number }>(`${MBA}/me/notifications/seen`, { dismissIds })
      .then((r) => r.data),
};

export const plannerKeys = {
  all: ["mba", "plan"] as const,
  week: (week: string) => ["mba", "plan", week] as const,
  notifications: ["mba", "notifications"] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

/** `week` = any date in the week, or "" for this week. */
export const useWeekPlan = (week: string, enabled = true) =>
  useQuery({ queryKey: plannerKeys.week(week), queryFn: () => plannerApi.getPlan(week || undefined), retry, enabled, staleTime: 30_000 });

const useInvalidatePlan = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: plannerKeys.all });
    void qc.invalidateQueries({ queryKey: plannerKeys.notifications });
  };
};

export const useGeneratePlan = () => {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: (week: string) => plannerApi.generate(week || undefined), onSuccess: invalidate });
};

export const usePatchTask = () => {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: ({ id, ...body }: TaskPatch & { id: string }) => plannerApi.patchTask(id, body),
    onSuccess: invalidate,
  });
};

export const useCreateTask = () => {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: (body: TaskCreate) => plannerApi.createTask(body), onSuccess: invalidate });
};

export const useDeleteTask = () => {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: (id: string) => plannerApi.deleteTask(id), onSuccess: invalidate });
};

export const useMbaNotifications = (enabled = true) =>
  useQuery({
    queryKey: plannerKeys.notifications,
    queryFn: plannerApi.getNotifications,
    retry,
    enabled,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

export const useMarkNotificationsSeen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => plannerApi.markSeen(ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: plannerKeys.notifications }),
  });
};
