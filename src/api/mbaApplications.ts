import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type ShortlistItem } from "@/api/mba";

/**
 * MBA application tracker (document checklist) and "Talk to my counsellor" requests.
 * Contract: procounsel-neet-api/docs/mba-api.md → "Application tracker & counsellor requests".
 */

const MBA = "/mba";

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string | null;
  custom: boolean;
  /** May be marked not applicable. */
  optional: boolean;
  done: boolean;
  notApplicable: boolean;
  doneAt: string | null;
}
export interface OfficialDates {
  /** YYYY-MM-DD, or YYYY-MM when only the month is published. */
  applicationOpens: string | null;
  applicationDeadline: string | null;
  examDate: string | null;
  notes: string | null;
  sourceUrl: string | null;
}
export interface Application extends ShortlistItem {
  officialDates: OfficialDates | null;
  effectiveDeadline: string | null;
  deadlineSource: "student" | "official" | null;
  checklist: ChecklistItem[];
  progress: { done: number; total: number };
}

export type CounsellorTopic = "shortlisting" | "applications" | "wat-pi" | "other";
export type CounsellorRequestStatus = "open" | "assigned" | "done";
export interface CounsellorRequest {
  id: string;
  topic: CounsellorTopic;
  preferredTime: string | null;
  note: string | null;
  slug: string | null;
  status: CounsellorRequestStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  doneAt: string | null;
}
export interface CounsellorRequestInput {
  topic: CounsellorTopic;
  preferredTime?: string | null;
  note?: string | null;
  slug?: string | null;
}

export const COUNSELLOR_TOPICS: { id: CounsellorTopic; label: string }[] = [
  { id: "shortlisting", label: "Shortlisting colleges" },
  { id: "applications", label: "Applications & documents" },
  { id: "wat-pi", label: "WAT / GD / PI prep" },
  { id: "other", label: "Something else" },
];

export const mbaApplicationsApi = {
  getApplications: () => procounselApi.get<{ items: Application[] }>(`${MBA}/me/applications`).then((r) => r.data),
  patchChecklistItem: (slug: string, itemId: string, body: { done?: boolean; notApplicable?: boolean }) =>
    procounselApi
      .patch<Application>(`${MBA}/me/applications/${encodeURIComponent(slug)}/checklist/${encodeURIComponent(itemId)}`, body)
      .then((r) => r.data),
  addChecklistItem: (slug: string, label: string) =>
    procounselApi.post<Application>(`${MBA}/me/applications/${encodeURIComponent(slug)}/checklist`, { label }).then((r) => r.data),
  deleteChecklistItem: (slug: string, itemId: string) =>
    procounselApi
      .delete<Application>(`${MBA}/me/applications/${encodeURIComponent(slug)}/checklist/${encodeURIComponent(itemId)}`)
      .then((r) => r.data),
  getCounsellorRequests: () =>
    procounselApi.get<{ requests: CounsellorRequest[] }>(`${MBA}/me/counsellor-requests`).then((r) => r.data),
  createCounsellorRequest: (body: CounsellorRequestInput) =>
    procounselApi.post<CounsellorRequest>(`${MBA}/me/counsellor-requests`, body).then((r) => r.data),
};

/** Under the shortlist key, so a shortlist save (which invalidates ["mba","shortlist"]) refreshes these too. */
export const mbaApplicationKeys = {
  applications: ["mba", "shortlist", "applications"] as const,
  counsellorRequests: ["mba", "counsellor-requests"] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useMbaApplications = (enabled = true) =>
  useQuery({ queryKey: mbaApplicationKeys.applications, queryFn: mbaApplicationsApi.getApplications, retry, enabled, staleTime: 0 });

/** Replace one application in the cached list with the server's answer. */
function useApplyApplication() {
  const qc = useQueryClient();
  return (app: Application) =>
    qc.setQueryData<{ items: Application[] }>(mbaApplicationKeys.applications, (prev) =>
      prev ? { items: prev.items.map((a) => (a.slug === app.slug ? app : a)) } : prev,
    );
}

export const useToggleChecklistItem = () => {
  const apply = useApplyApplication();
  return useMutation({
    mutationFn: ({ slug, itemId, ...body }: { slug: string; itemId: string; done?: boolean; notApplicable?: boolean }) =>
      mbaApplicationsApi.patchChecklistItem(slug, itemId, body),
    onSuccess: apply,
  });
};

export const useAddChecklistItem = () => {
  const apply = useApplyApplication();
  return useMutation({
    mutationFn: ({ slug, label }: { slug: string; label: string }) => mbaApplicationsApi.addChecklistItem(slug, label),
    onSuccess: apply,
  });
};

export const useDeleteChecklistItem = () => {
  const apply = useApplyApplication();
  return useMutation({
    mutationFn: ({ slug, itemId }: { slug: string; itemId: string }) => mbaApplicationsApi.deleteChecklistItem(slug, itemId),
    onSuccess: apply,
  });
};

export const useCounsellorRequests = (enabled = true) =>
  useQuery({
    queryKey: mbaApplicationKeys.counsellorRequests,
    queryFn: mbaApplicationsApi.getCounsellorRequests,
    retry,
    enabled,
    staleTime: 30_000,
  });

export const useCreateCounsellorRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mbaApplicationsApi.createCounsellorRequest,
    onSuccess: () => void qc.invalidateQueries({ queryKey: mbaApplicationKeys.counsellorRequests }),
  });
};
