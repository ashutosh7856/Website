/** Role the Java backend returns for users whose interestedCourse is "mba". */
export const MBA_STUDENT_ROLE = "mbaStudent" as const;

/** Mirrors the backend check (`"mba".equalsIgnoreCase(interestedCourse)`). */
export const isMbaCourse = (courseName: string | null | undefined): boolean =>
  (courseName ?? "").trim().toLowerCase() === "mba";

const INTENDED_COURSE_KEY = "pc:intendedCourse";

/**
 * "Start free CAT prep" on the public MBA pages opens the normal login. A new
 * user then lands on the onboarding course grid; this remembers that they came
 * for MBA so the grid can start with that tile selected. Session-scoped and
 * best-effort: storage failures just mean nothing is preselected.
 */
export function rememberIntendedCourse(courseName: string): void {
  try {
    sessionStorage.setItem(INTENDED_COURSE_KEY, courseName);
  } catch {
    /* storage unavailable */
  }
}

/** The remembered course, if any. Pure read, so it is safe in a state initialiser. */
export function readIntendedCourse(): string | null {
  try {
    return sessionStorage.getItem(INTENDED_COURSE_KEY);
  } catch {
    return null;
  }
}

export function forgetIntendedCourse(): void {
  try {
    sessionStorage.removeItem(INTENDED_COURSE_KEY);
  } catch {
    /* storage unavailable */
  }
}
