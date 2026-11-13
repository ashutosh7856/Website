import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaStatus, type SectionId } from "@/api/mba";

/**
 * ProCounsel MBA — CAT syllabus (section → topic → subtopic) with concept notes and the
 * student's lesson progress, bookmarks and private notes. Types copied from
 * procounsel-neet-api/docs/mba-api.md ("Syllabus").
 */

const MBA = "/mba";

export interface SyllabusSubtopic {
  id: string;
  title: string;
  notes: string[];
  questionCount: number;
  bankSubtopics: string[];
  practiceHref: string;
  drillHref: string | null;
  completed: boolean;
  completedAt: string | null;
  bookmarked: boolean;
  note: string | null;
}
export interface SyllabusTopic {
  id: string;
  title: string;
  questionCount: number;
  practiceHref: string;
  completed: number;
  total: number;
  subtopics: SyllabusSubtopic[];
}
export interface SyllabusSection {
  id: SectionId;
  title: string;
  completed: number;
  total: number;
  topics: SyllabusTopic[];
}
export interface SyllabusResponse {
  examId: string;
  version: number;
  sections: SyllabusSection[];
  progress: { completed: number; total: number; bookmarked: number };
}
export interface SyllabusItemPatch {
  completed?: boolean;
  bookmarked?: boolean;
  note?: string | null;
}
export interface SyllabusItemState {
  subtopicId: string;
  completed: boolean;
  completedAt: string | null;
  bookmarked: boolean;
  note: string | null;
  updatedAt: string | null;
}

export const NOTE_MAX = 2000;

export const syllabusApi = {
  get: () => procounselApi.get<SyllabusResponse>(`${MBA}/syllabus`).then((r) => r.data),
  patch: (subtopicId: string, body: SyllabusItemPatch) =>
    procounselApi.patch<SyllabusItemState>(`${MBA}/me/syllabus/${encodeURIComponent(subtopicId)}`, body).then((r) => r.data),
};

export const syllabusKey = ["mba", "syllabus"] as const;

const retry = (count: number, err: unknown) => {
  const status = mbaStatus(err);
  if (status !== null && status >= 400 && status < 500) return false;
  return count < 1;
};

export const useSyllabus = (enabled = true) =>
  useQuery({ queryKey: syllabusKey, queryFn: syllabusApi.get, enabled, retry, staleTime: 5 * 60_000 });

/** Apply a saved item state to the cached syllabus (counts recomputed). */
export function applyItemState(data: SyllabusResponse, state: SyllabusItemState): SyllabusResponse {
  const sections = data.sections.map((section) => {
    const topics = section.topics.map((topic) => {
      const subtopics = topic.subtopics.map((s) =>
        s.id === state.subtopicId
          ? { ...s, completed: state.completed, completedAt: state.completedAt, bookmarked: state.bookmarked, note: state.note }
          : s,
      );
      return { ...topic, subtopics, completed: subtopics.filter((s) => s.completed).length };
    });
    return { ...section, topics, completed: topics.reduce((n, t) => n + t.completed, 0) };
  });
  const all = sections.flatMap((s) => s.topics.flatMap((t) => t.subtopics));
  return {
    ...data,
    sections,
    progress: { completed: all.filter((s) => s.completed).length, total: all.length, bookmarked: all.filter((s) => s.bookmarked).length },
  };
}

export const usePatchSyllabusItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subtopicId, body }: { subtopicId: string; body: SyllabusItemPatch }) => syllabusApi.patch(subtopicId, body),
    onSuccess: (state) =>
      qc.setQueryData<SyllabusResponse>(syllabusKey, (current) => (current ? applyItemState(current, state) : current)),
  });
};
