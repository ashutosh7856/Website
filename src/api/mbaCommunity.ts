import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type SectionId } from "@/api/mba";
import type { WeeklyBoard } from "@/api/mbaInsights";

/**
 * ProCounsel MBA — doubts, study groups, doubt hours / webinars and help-centre
 * tickets. Types copied from procounsel-neet-api/docs/mba-api.md
 * ("Community: doubts, study groups, events, help").
 */

const MBA = "/mba";
const q = encodeURIComponent;

// ── Doubts (question doubts and group posts share one thread model) ──────────
export type DoubtScope = "question" | "group";
export type DoubtStatus = "open" | "resolved";
export type PostReportReason = "spam" | "abusive" | "off_platform" | "wrong" | "other";

export interface DoubtReply {
  id: string;
  by: "student" | "faculty";
  authorName: string;
  isYours: boolean;
  text: string;
  verified: boolean;
  upvotes: number;
  youUpvoted: boolean;
  youReported: boolean;
  /** Only ever true on your own reply (others' hidden replies are left out). */
  hidden: boolean;
  createdAt: string;
}
export interface DoubtThread {
  id: string;
  scope: DoubtScope;
  questionId: string | null;
  groupId: string | null;
  authorName: string;
  isYours: boolean;
  text: string;
  status: DoubtStatus;
  hidden: boolean;
  upvotes: number;
  youUpvoted: boolean;
  youReported: boolean;
  replyCount: number;
  facultyAnswered: boolean;
  createdAt: string;
  lastActivityAt: string;
}
export interface DoubtDetail extends DoubtThread {
  /** Plain text, at most 160 characters (question doubts). */
  questionPreview: string | null;
  replies: DoubtReply[];
}
export interface QuestionThreads {
  threads: DoubtThread[];
  question: { id: string; section: SectionId | null; number: number | null; stemHtml: string };
}

export const REPORT_REASONS: { id: PostReportReason; label: string }[] = [
  { id: "wrong", label: "Wrong or misleading" },
  { id: "off_platform", label: "Asks to chat outside ProCounsel" },
  { id: "spam", label: "Spam or ads" },
  { id: "abusive", label: "Rude or abusive" },
  { id: "other", label: "Something else" },
];

// ── Study groups ─────────────────────────────────────────────────────────────
export interface GroupInfo {
  id: string;
  label: string;
  exam: string;
  year: number;
  members: number;
}
export interface GroupsResponse {
  groups: GroupInfo[];
  mine: GroupInfo | null;
  suggestedId: string | null;
}
export interface GroupBoard extends WeeklyBoard {
  groupId: string;
  members: number;
}

// ── Doubt hours and webinars ─────────────────────────────────────────────────
export interface MbaEvent {
  id: string;
  title: string;
  description: string | null;
  kind: "doubt_hour" | "webinar";
  startsAt: string;
  endsAt: string;
  link: string | null;
  host: string | null;
  exams: string[];
  status: "scheduled" | "cancelled";
}

// ── Help-centre tickets ──────────────────────────────────────────────────────
export type TicketCategory = "account" | "mocks" | "questions" | "technical" | "data" | "feedback" | "other";
export type TicketStatus = "open" | "answered" | "closed";
export interface TicketMessage {
  by: "student" | "support";
  authorName: string;
  text: string;
  at: string;
}
export interface Ticket {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  attemptId: string | null;
  questionId: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}
export interface TicketInput {
  category: TicketCategory;
  subject: string;
  message: string;
  attemptId?: string;
  questionId?: string;
}
export const TICKET_CATEGORIES: { id: TicketCategory; label: string }[] = [
  { id: "mocks", label: "Mocks and scores" },
  { id: "questions", label: "A question or solution" },
  { id: "technical", label: "App not working" },
  { id: "account", label: "Login and account" },
  { id: "data", label: "My data and privacy" },
  { id: "feedback", label: "Feedback or idea" },
  { id: "other", label: "Something else" },
];
export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Waiting for support",
  answered: "Support replied",
  closed: "Closed",
};

export const mbaCommunityApi = {
  questionDoubts: (questionId: string) =>
    procounselApi.get<QuestionThreads>(`${MBA}/questions/${q(questionId)}/doubts`).then((r) => r.data),
  askDoubt: (questionId: string, text: string) =>
    procounselApi.post<DoubtDetail>(`${MBA}/questions/${q(questionId)}/doubts`, { text }).then((r) => r.data),
  myDoubts: () => procounselApi.get<{ threads: DoubtThread[] }>(`${MBA}/me/doubts`).then((r) => r.data),
  doubt: (id: string) => procounselApi.get<DoubtDetail>(`${MBA}/doubts/${q(id)}`).then((r) => r.data),
  reply: (id: string, text: string) =>
    procounselApi.post<DoubtDetail>(`${MBA}/doubts/${q(id)}/replies`, { text }).then((r) => r.data),
  setStatus: (id: string, status: DoubtStatus) =>
    procounselApi.patch<DoubtDetail>(`${MBA}/doubts/${q(id)}`, { status }).then((r) => r.data),
  vote: (id: string, up: boolean, replyId?: string) =>
    procounselApi
      .put<DoubtDetail>(`${MBA}/doubts/${q(id)}${replyId ? `/replies/${q(replyId)}` : ""}/vote`, { up })
      .then((r) => r.data),
  report: (id: string, reason: PostReportReason, replyId?: string) =>
    procounselApi
      .post<DoubtDetail>(`${MBA}/doubts/${q(id)}${replyId ? `/replies/${q(replyId)}` : ""}/report`, { reason })
      .then((r) => r.data),
  groups: () => procounselApi.get<GroupsResponse>(`${MBA}/groups`).then((r) => r.data),
  joinGroup: (groupId: string) => procounselApi.put<GroupInfo>(`${MBA}/me/group`, { groupId }).then((r) => r.data),
  leaveGroup: () => procounselApi.delete(`${MBA}/me/group`).then(() => undefined),
  groupPosts: (groupId: string) =>
    procounselApi.get<{ threads: DoubtThread[] }>(`${MBA}/groups/${q(groupId)}/posts`).then((r) => r.data),
  groupPost: (groupId: string, text: string) =>
    procounselApi.post<DoubtDetail>(`${MBA}/groups/${q(groupId)}/posts`, { text }).then((r) => r.data),
  groupBoard: (groupId: string) =>
    procounselApi.get<GroupBoard>(`${MBA}/groups/${q(groupId)}/leaderboard`).then((r) => r.data),
  events: () => procounselApi.get<{ events: MbaEvent[] }>(`${MBA}/events`).then((r) => r.data),
  tickets: () => procounselApi.get<{ tickets: Ticket[] }>(`${MBA}/me/tickets`).then((r) => r.data),
  createTicket: (body: TicketInput) => procounselApi.post<Ticket>(`${MBA}/me/tickets`, body).then((r) => r.data),
  ticketMessage: (id: string, text: string) =>
    procounselApi.post<Ticket>(`${MBA}/me/tickets/${q(id)}/messages`, { text }).then((r) => r.data),
  closeTicket: (id: string) =>
    procounselApi.patch<Ticket>(`${MBA}/me/tickets/${q(id)}`, { status: "closed" }).then((r) => r.data),
};

export const communityKeys = {
  all: ["mba", "community"] as const,
  questionDoubts: (questionId: string) => ["mba", "community", "question", questionId] as const,
  myDoubts: ["mba", "community", "mine"] as const,
  doubt: (id: string) => ["mba", "community", "doubt", id] as const,
  groups: ["mba", "community", "groups"] as const,
  groupPosts: (groupId: string) => ["mba", "community", "group", groupId, "posts"] as const,
  groupBoard: (groupId: string) => ["mba", "community", "group", groupId, "board"] as const,
  events: ["mba", "community", "events"] as const,
  tickets: ["mba", "community", "tickets"] as const,
};

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useQuestionDoubts = (questionId: string | undefined) =>
  useQuery({
    queryKey: communityKeys.questionDoubts(questionId ?? ""),
    queryFn: () => mbaCommunityApi.questionDoubts(questionId!),
    enabled: !!questionId,
    retry,
    staleTime: 30_000,
  });

export const useMyDoubts = () =>
  useQuery({ queryKey: communityKeys.myDoubts, queryFn: mbaCommunityApi.myDoubts, retry, staleTime: 30_000 });

export const useDoubt = (id: string | undefined) =>
  useQuery({
    queryKey: communityKeys.doubt(id ?? ""),
    queryFn: () => mbaCommunityApi.doubt(id!),
    enabled: !!id,
    retry,
    staleTime: 15_000,
  });

/** Any change to one thread: store the fresh copy and refresh the lists it appears in. */
const useThreadMutation = <V>(fn: (vars: V) => Promise<DoubtDetail>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (detail) => {
      qc.setQueryData(communityKeys.doubt(detail.id), detail);
      void qc.invalidateQueries({ queryKey: communityKeys.myDoubts });
      if (detail.questionId) void qc.invalidateQueries({ queryKey: communityKeys.questionDoubts(detail.questionId) });
      if (detail.groupId) void qc.invalidateQueries({ queryKey: communityKeys.groupPosts(detail.groupId) });
    },
  });
};

export const useAskDoubt = (questionId: string) =>
  useThreadMutation((text: string) => mbaCommunityApi.askDoubt(questionId, text));
export const useGroupPost = (groupId: string) =>
  useThreadMutation((text: string) => mbaCommunityApi.groupPost(groupId, text));
export const useReply = (id: string) => useThreadMutation((text: string) => mbaCommunityApi.reply(id, text));
export const useSetDoubtStatus = (id: string) =>
  useThreadMutation((status: DoubtStatus) => mbaCommunityApi.setStatus(id, status));
export const useVote = (id: string) =>
  useThreadMutation((v: { up: boolean; replyId?: string }) => mbaCommunityApi.vote(id, v.up, v.replyId));
export const useReportPost = (id: string) =>
  useThreadMutation((v: { reason: PostReportReason; replyId?: string }) => mbaCommunityApi.report(id, v.reason, v.replyId));

export const useGroups = () =>
  useQuery({ queryKey: communityKeys.groups, queryFn: mbaCommunityApi.groups, retry, staleTime: 60_000 });

export const useJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string | null) => (groupId ? mbaCommunityApi.joinGroup(groupId) : mbaCommunityApi.leaveGroup()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: communityKeys.all }),
  });
};

export const useGroupPosts = (groupId: string | null | undefined) =>
  useQuery({
    queryKey: communityKeys.groupPosts(groupId ?? ""),
    queryFn: () => mbaCommunityApi.groupPosts(groupId!),
    enabled: !!groupId,
    retry,
    staleTime: 30_000,
  });

export const useGroupBoard = (groupId: string | null | undefined) =>
  useQuery({
    queryKey: communityKeys.groupBoard(groupId ?? ""),
    queryFn: () => mbaCommunityApi.groupBoard(groupId!),
    enabled: !!groupId,
    retry,
    staleTime: 60_000,
  });

export const useMbaEvents = () =>
  useQuery({ queryKey: communityKeys.events, queryFn: mbaCommunityApi.events, retry, staleTime: 5 * 60_000 });

export const useTickets = () =>
  useQuery({ queryKey: communityKeys.tickets, queryFn: mbaCommunityApi.tickets, retry, staleTime: 30_000 });

const useTicketMutation = <V>(fn: (vars: V) => Promise<Ticket>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (ticket) => {
      qc.setQueryData<{ tickets: Ticket[] }>(communityKeys.tickets, (old) =>
        old ? { tickets: [ticket, ...old.tickets.filter((t) => t.id !== ticket.id)] } : old,
      );
      void qc.invalidateQueries({ queryKey: communityKeys.tickets });
    },
  });
};

export const useCreateTicket = () => useTicketMutation((body: TicketInput) => mbaCommunityApi.createTicket(body));
export const useTicketMessage = () =>
  useTicketMutation((v: { id: string; text: string }) => mbaCommunityApi.ticketMessage(v.id, v.text));
export const useCloseTicket = () => useTicketMutation((id: string) => mbaCommunityApi.closeTicket(id));

// ── .ics for one event (same format rules as the study planner's export) ─────
const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
const icsTime = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const foldIcs = (line: string) => {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
};

export function buildEventIcs(event: MbaEvent, now: Date = new Date()): string {
  const description = [event.description, event.host ? `Host: ${event.host}` : null, event.link].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProCounsel//MBA Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@procounsel-mba-events`,
    `DTSTAMP:${icsTime(now.toISOString())}`,
    `DTSTART:${icsTime(event.startsAt)}`,
    `DTEND:${icsTime(event.endsAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    ...(description ? [`DESCRIPTION:${escapeIcs(description)}`] : []),
    ...(event.link ? [`URL:${event.link}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcs).join("\r\n") + "\r\n";
}
