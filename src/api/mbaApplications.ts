import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type ShortlistItem } from "@/api/mba";

/**
 * MBA application tracker (document checklist) and "Talk to my counsellor" requests.
 * Contract: procounsel-neet-api/docs/mba-api.md → "Application tracker & counsellor requests".
 */

const MBA = "/mba";

/** A file uploaded against a checklist item (private to the student unless shared). */
export interface ApplicationDocument {
  id: string;
  itemId: string;
  fileName: string;
  contentType: string;
  /** Bytes. */
  size: number;
  status: "pending" | "ready";
  /** Per-document consent: the assigned counsellor may open it. */
  shareWithCounsellor: boolean;
  uploadedAt: string | null;
  createdAt: string;
}

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
  /** Uploaded files, oldest first. */
  documents: ApplicationDocument[];
}

export type OutcomeResult = "admit" | "waitlist" | "reject";
export type OutcomeDecision = "accepted" | "declined";
/** null = the stage is not reached (or not recorded). Dates are YYYY-MM-DD and optional. */
export interface Outcome {
  applied: { date: string | null } | null;
  /** Called for WAT / GD / PI. */
  shortlisted: { date: string | null } | null;
  interviewDone: { date: string | null } | null;
  result: { value: OutcomeResult; date: string | null } | null;
  decision: { value: OutcomeDecision; date: string | null } | null;
}
export interface OutcomeFunnel {
  applications: number;
  applied: number;
  shortlisted: number;
  interviewDone: number;
  admit: number;
  waitlist: number;
  reject: number;
  accepted: number;
  declined: number;
}
export interface DocumentsConfig {
  /** false = uploads are not configured on the server yet. */
  enabled: boolean;
  maxBytes: number;
  allowedTypes: string[];
}
export interface ApplicationsResponse {
  items: Application[];
  funnel: OutcomeFunnel;
  documents: DocumentsConfig;
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
  outcome: Outcome & { updatedAt: string | null };
}

export type CounsellorTopic = "shortlisting" | "applications" | "wat-pi" | "mock_interview" | "other";
export type SlotTime = "morning" | "afternoon" | "evening";
export interface PreferredSlot {
  /** YYYY-MM-DD, India time. */
  date: string;
  time: SlotTime;
}
export type CounsellorRequestStatus = "new" | "contacted" | "in_progress" | "converted" | "closed";
export interface CounsellorRequest {
  id: string;
  topic: CounsellorTopic;
  preferredTime: string | null;
  /** Mock interview requests: 1-3 slots the student can do. */
  preferredSlots: PreferredSlot[];
  note: string | null;
  slug: string | null;
  status: CounsellorRequestStatus;
  /** The assigned counsellor's name, once one is assigned. */
  counsellorName: string | null;
  /** Student consent: the counsellor may see their MBA profile, shortlist and mock summary. */
  shareWithCounsellor: boolean;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  /** When it was completed or closed. */
  closedAt: string | null;
  /** Oldest first. */
  timeline: { at: string; text: string }[];
}
export interface CounsellorRequestInput {
  topic: CounsellorTopic;
  preferredTime?: string | null;
  note?: string | null;
  slug?: string | null;
  shareWithCounsellor?: boolean;
  preferredSlots?: PreferredSlot[];
}

export const SLOT_TIMES: { id: SlotTime; label: string }[] = [
  { id: "morning", label: "Morning (9 am–12 pm)" },
  { id: "afternoon", label: "Afternoon (12–4 pm)" },
  { id: "evening", label: "Evening (4–8 pm)" },
];
export const MAX_SLOTS = 3;

export const COUNSELLOR_TOPICS: { id: CounsellorTopic; label: string }[] = [
  { id: "shortlisting", label: "Shortlisting colleges" },
  { id: "applications", label: "Applications & documents" },
  { id: "wat-pi", label: "WAT / GD / PI prep" },
  { id: "mock_interview", label: "Mock interview with a counsellor" },
  { id: "other", label: "Something else" },
];

interface UploadStart {
  document: ApplicationDocument;
  upload: { url: string; fields: Record<string, string>; expiresAt: string };
  maxBytes: number;
}

const DOCS = `${MBA}/me/application-docs`;

export const mbaApplicationsApi = {
  getApplications: () => procounselApi.get<ApplicationsResponse>(`${MBA}/me/applications`).then((r) => r.data),
  startUpload: (slug: string, itemId: string, body: { fileName: string; contentType: string; size: number }) =>
    procounselApi
      .post<UploadStart>(
        `${MBA}/me/applications/${encodeURIComponent(slug)}/checklist/${encodeURIComponent(itemId)}/documents`,
        body,
      )
      .then((r) => r.data),
  completeUpload: (docId: string) =>
    procounselApi.post<Application>(`${DOCS}/${encodeURIComponent(docId)}/complete`).then((r) => r.data),
  downloadLink: (docId: string) =>
    procounselApi.get<{ url: string; expiresAt: string }>(`${DOCS}/${encodeURIComponent(docId)}/download`).then((r) => r.data),
  setDocumentSharing: (docId: string, shareWithCounsellor: boolean) =>
    procounselApi.patch<Application>(`${DOCS}/${encodeURIComponent(docId)}`, { shareWithCounsellor }).then((r) => r.data),
  deleteDocument: (docId: string) =>
    procounselApi.delete<Application>(`${DOCS}/${encodeURIComponent(docId)}`).then((r) => r.data),
  putOutcome: (slug: string, outcome: Outcome) =>
    procounselApi.put<Application>(`${MBA}/me/applications/${encodeURIComponent(slug)}/outcome`, outcome).then((r) => r.data),
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
  setCounsellorSharing: (id: string, shareWithCounsellor: boolean) =>
    procounselApi
      .patch<CounsellorRequest>(`${MBA}/me/counsellor-requests/${encodeURIComponent(id)}`, { shareWithCounsellor })
      .then((r) => r.data),
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

/** Replace one application in the cached list with the server's answer (the funnel is refetched). */
function useApplyApplication() {
  const qc = useQueryClient();
  return (app: Application) =>
    qc.setQueryData<ApplicationsResponse>(mbaApplicationKeys.applications, (prev) =>
      prev ? { ...prev, items: prev.items.map((a) => (a.slug === app.slug ? app : a)) } : prev,
    );
}

export const ALLOWED_DOC_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

/** Plain-language check before anything is sent; null = fine. */
export function documentProblem(file: File, maxBytes = MAX_DOC_BYTES): string | null {
  if (!ALLOWED_DOC_TYPES[file.type]) return "Upload a PDF, JPG or PNG file.";
  if (file.size > maxBytes) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * Upload = ask the API for a signed form, POST the file straight to storage, then let the API check it.
 * The file never passes through our API server.
 */
async function uploadDocument(slug: string, itemId: string, file: File): Promise<Application> {
  const start = await mbaApplicationsApi.startUpload(slug, itemId, {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  const form = new FormData();
  for (const [key, value] of Object.entries(start.upload.fields)) form.append(key, value);
  form.append("file", file);
  const res = await fetch(start.upload.url, { method: "POST", body: form });
  if (!res.ok) throw new Error("The upload didn't go through. Check your connection and try again.");
  return mbaApplicationsApi.completeUpload(start.document.id);
}

export const useUploadDocument = () => {
  const apply = useApplyApplication();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, itemId, file }: { slug: string; itemId: string; file: File }) => uploadDocument(slug, itemId, file),
    onSuccess: apply,
    // A failed upload may have left nothing or a pending doc; either way the server's list is the truth.
    onError: () => void qc.invalidateQueries({ queryKey: mbaApplicationKeys.applications }),
  });
};

export const useSetDocumentSharing = () => {
  const apply = useApplyApplication();
  return useMutation({
    mutationFn: ({ docId, share }: { docId: string; share: boolean }) => mbaApplicationsApi.setDocumentSharing(docId, share),
    onSuccess: apply,
  });
};

export const useDeleteDocument = () => {
  const apply = useApplyApplication();
  return useMutation({ mutationFn: (docId: string) => mbaApplicationsApi.deleteDocument(docId), onSuccess: apply });
};

export const useSaveOutcome = () => {
  const qc = useQueryClient();
  const apply = useApplyApplication();
  return useMutation({
    mutationFn: ({ slug, outcome }: { slug: string; outcome: Outcome }) => mbaApplicationsApi.putOutcome(slug, outcome),
    onSuccess: (app) => {
      apply(app);
      void qc.invalidateQueries({ queryKey: mbaApplicationKeys.applications }); // funnel counts
    },
  });
};

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

export const useSetCounsellorSharing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, share }: { id: string; share: boolean }) => mbaApplicationsApi.setCounsellorSharing(id, share),
    onSuccess: (fresh) =>
      qc.setQueryData<{ requests: CounsellorRequest[] }>(mbaApplicationKeys.counsellorRequests, (prev) =>
        prev ? { requests: prev.requests.map((r) => (r.id === fresh.id ? fresh : r)) } : prev,
      ),
  });
};
