import { useQuery } from "@tanstack/react-query";
import { getAllCounsellorCoursesForGuest, getBoughtCourses } from "@/api/course";

/**
 * MBA "Learn" tab: the existing counsellor-course platform (Java backend, YouTube lessons,
 * wallet / Razorpay purchase in CoursePage), filtered to MBA / CAT courses. The public /courses routes
 * are retired, so MBA students open CoursePage inside their shell at /mba/learn/:courseId.
 *
 * Courses have no exam tag yet (CounsellorCourse.category is free text, "COURSE" on most), so a
 * course counts as MBA when its name or category mentions one of MBA_COURSE_TERMS. Until a real
 * tag exists, admins should put "MBA" or "CAT" in the course title.
 */

export const MBA_COURSE_TERMS = ["CAT", "MBA", "XAT", "SNAP", "NMAT", "IIM", "IIMs", "CMAT", "GMAT", "PGDM", "GDPI", "GD-PI", "WAT-PI"];
const TERM_RE = new RegExp(`(^|[^A-Za-z0-9])(${MBA_COURSE_TERMS.map((t) => t.replace(/-/g, "\\-")).join("|")})(?=$|[^A-Za-z0-9])`, "i");

export interface MbaCourse {
  courseId: string;
  courseName: string;
  thumbnailUrl: string | null;
  category: string | null;
  counsellorName: string | null;
  /** Price after discount, in rupees. 0 = free. */
  price: number;
  /** List price when it is higher than `price`. */
  listPrice: number | null;
  rating: number | null;
  soldCount: number;
  enrolled: boolean;
}

type Row = Record<string, unknown>;

const rowsOf = (response: unknown): Row[] => {
  if (Array.isArray(response)) return response as Row[];
  const data = (response as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as Row[]) : [];
};
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export function isMbaCourse(row: { courseName?: unknown; category?: unknown }): boolean {
  return TERM_RE.test(`${str(row.courseName) ?? ""} ${str(row.category) ?? ""}`);
}

/** MBA courses from the course-list response: free first, then best-selling, then by name. */
export function selectMbaCourses(response: unknown, enrolledIds: ReadonlySet<string> = new Set()): MbaCourse[] {
  const out: MbaCourse[] = [];
  const seen = new Set<string>();
  for (const row of rowsOf(response)) {
    const courseId = str(row.courseId);
    const courseName = str(row.courseName);
    if (!courseId || !courseName || seen.has(courseId) || !isMbaCourse(row)) continue;
    seen.add(courseId);
    const list = num(row.coursePrice);
    const price = Math.max(0, num(row.coursePriceAfterDiscount) ?? list ?? 0);
    out.push({
      courseId,
      courseName,
      thumbnailUrl: str(row.courseThumbnailUrl),
      category: str(row.category),
      counsellorName: str(row.counsellorName) ?? str(row.counselorName),
      price,
      listPrice: list !== null && list > price ? list : null,
      rating: num(row.rating) || null,
      soldCount: num(row.soldCount) ?? 0,
      enrolled: enrolledIds.has(courseId) || row.purchasedByMe === true,
    });
  }
  return out.sort(
    (a, b) =>
      Number(a.price > 0) - Number(b.price > 0) || b.soldCount - a.soldCount || a.courseName.localeCompare(b.courseName),
  );
}

/** Course detail / purchase page (the existing CoursePage, routed inside the MBA shell). */
export const courseDetailPath = (courseId: string) => `/mba/learn/${encodeURIComponent(courseId)}`;

export function useMbaCourses(userId: string | null | undefined) {
  const all = useQuery({
    queryKey: ["mba", "learn", "courses"],
    queryFn: getAllCounsellorCoursesForGuest,
    staleTime: 10 * 60_000,
    retry: 1,
  });
  // Best effort: mark the courses this student already bought. A failure just hides the badge.
  const bought = useQuery({
    queryKey: ["mba", "learn", "bought", userId ?? ""],
    queryFn: () => getBoughtCourses(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });
  const enrolledIds = new Set(rowsOf(bought.data).map((r) => str(r.courseId)).filter((id): id is string => !!id));
  return {
    courses: all.data ? selectMbaCourses(all.data, enrolledIds) : [],
    isPending: all.isPending,
    isError: all.isError,
    refetch: all.refetch,
  };
}
