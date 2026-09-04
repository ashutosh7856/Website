import { useOutletContext } from 'react-router-dom';
import type { SchoolStudent } from '@/api/schoolStudentApi';
import type { DashboardView, Progress } from '@/lib/schoolStudentProgress';

/**
 * What SchoolStudentLayout hands down to every page inside the school shell.
 *
 * Lives here rather than in the layout so pages can import the hook without
 * importing the layout module — that circular import is what would otherwise
 * pull the whole shell into every child chunk.
 */
export type SchoolShellContext = {
  view: DashboardView;
  progress: Progress;
  /** Persist a change and re-render the whole shell. */
  update: (next: Progress) => void;
  /**
   * The backend's record for this student, or null when it has no row for them.
   * Authoritative for points, streak, class and the psychometric report link —
   * prefer it over anything AuthStore persisted at signup.
   */
  record: SchoolStudent | null;
  /** Re-read the record after something changes it (a profile save). */
  refreshRecord: () => void;
  /**
   * Who this student is to /api/schoolStudent — the id every game read and
   * write must use. Derived once here so the play page cannot file a run under
   * one id while the games page looks for it under another.
   */
  studentId: string | null;
  /** Their class as a number, from the server record first. Null if unknown. */
  grade: number | null;
  /** The class as written, for display. */
  className: string | null;
};

export const useSchoolShell = () => useOutletContext<SchoolShellContext>();

/**
 * The student's first name, or null.
 *
 * `mapSchoolStudentToUser` fills a missing profile with the literal placeholders
 * "School" / "Student", so `user.firstName` is the string "School" whenever the
 * persisted profile is absent — which is how the dashboard ended up greeting
 * people as "Welcome back, School". Those two strings are treated as absent
 * here, and the server record is preferred over anything persisted.
 */
const PLACEHOLDERS = new Set(['school', 'student', '']);

export function firstNameOf(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const candidate of candidates) {
    const name = candidate?.trim();
    if (name && !PLACEHOLDERS.has(name.toLowerCase())) return name;
  }
  return null;
}
