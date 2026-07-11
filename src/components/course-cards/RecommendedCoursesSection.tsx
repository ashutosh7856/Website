import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAllCounsellorCoursesForGuest,
  getAllCounsellorCoursesForUser,
} from "@/api/course";
import CourseCard from "@/components/Revamp/courses/CourseCard";
import type { CourseType } from "@/types/course";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentCourseId: string;
  category?: string;
};

function toCourseType(item: Record<string, unknown>, index: number): CourseType {
  return {
    id: String(item?.courseId ?? `course-${index}`),
    name: String(item?.courseName ?? "Course"),
    image: String(item?.courseThumbnailUrl ?? "/course/2.webp"),
    subject: String(item?.category ?? "General"),
    price: `₹${Number(item?.coursePriceAfterDiscount ?? item?.coursePrice ?? 0).toLocaleString("en-IN")}`,
    rating: String(Number(item?.rating ?? 0).toFixed(1)),
    courseTimeHours: Number(item?.courseTimeHours ?? 0),
    courseTimeMinutes: Number(item?.courseTimeMinutes ?? 0),
    isBookmarked: Boolean(item?.bookmarkedByMe),
  };
}

type CourseRow = { course: CourseType; purchased: boolean };

export default function RecommendedCoursesSection({
  currentCourseId,
  category,
}: Props) {
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);
  const userId = localStorage.getItem("phone") || "";
  const token = localStorage.getItem("jwt") || "";
  const isUserLoggedIn = Boolean(userId && token);

  const { data, isLoading } = useQuery({
    queryKey: ["recommended-courses", isUserLoggedIn ? userId : "guest"],
    queryFn: () =>
      isUserLoggedIn
        ? getAllCounsellorCoursesForUser(userId)
        : getAllCounsellorCoursesForGuest(),
    staleTime: 60_000,
  });

  const items = useMemo((): CourseRow[] => {
    const list = Array.isArray(data?.data) ? data.data : [];
    const others = list.filter(
      (row: Record<string, unknown>) =>
        String(row?.courseId ?? "") !== currentCourseId
    );
    const mapped: CourseRow[] = others.map((row: Record<string, unknown>, i: number) => ({
      course: toCourseType(row, i),
      purchased: Boolean(row?.purchasedByMe),
    }));
    if (category) {
      const same = mapped.filter((c) => c.course.subject === category);
      const rest = mapped.filter((c) => c.course.subject !== category);
      return [...same, ...rest].slice(0, 4);
    }
    return mapped.slice(0, 4);
  }, [data, currentCourseId, category]);

  if (!isLoading && items.length === 0) return null;

  const scrollMobileTrack = (direction: "prev" | "next") => {
    if (!mobileTrackRef.current) return;
    const offset = direction === "next" ? 216 : -216;
    mobileTrackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="mt-12 border-t border-gray-200/80 pt-10 pb-6">
      {/* Heading + description — same layout/typography as Admissions COUNSELLORS section */}
      <div className="mb-6 flex flex-col items-start justify-between gap-[12px] md:mb-10 md:flex-row md:gap-0">
        <div className="flex h-[26px] w-fit max-w-full shrink-0 items-center justify-center gap-[8px] rounded-[4px] bg-white px-[12px] py-[4px] md:h-auto md:gap-2 md:rounded-md md:px-3 md:py-1">
          <div
            className="h-[16px] min-h-[16px] w-[16px] min-w-[16px] shrink-0 bg-[#0E1629] md:h-4 md:w-4"
            aria-hidden
          />
          <p className="font-[Poppins] text-[12px] font-semibold uppercase leading-none tracking-[0.07em] text-[#0E1629] md:text-[14px] md:leading-normal md:tracking-wider">
            Recommended courses
          </p>
        </div>
        <p className="font-[Poppins] text-[12px] font-medium leading-none text-[#0E1629] max-w-[350px] md:max-w-[682px] md:text-[24px] md:leading-normal h-[54px] md:h-auto">
          Discover curated programs across mental wellness, assessments, admissions, and
          upskilling led by experienced professionals, built around your needs.
        </p>
      </div>

      {/* Mobile: horizontal slider cards (reference style) */}
      <div className="md:hidden">
        <div
          ref={mobileTrackRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={`m-sk-${i}`} className="shrink-0 snap-start">
                  <CourseCard isLoading isBaught={false} />
                </div>
              ))
            : items.map(({ course: c, purchased }) => (
                <div key={c.id} className="shrink-0 snap-start">
                  <CourseCard
                    course={c}
                    isBaught={purchased}
                    isLoading={false}
                  />
                </div>
              ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-10 rounded-full bg-[#0E1629]" />
            <span className="h-1 w-10 rounded-full bg-[#0E1629]/25" />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollMobileTrack("prev")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#0E1629]/20 bg-white text-[#0E1629] cursor-pointer"
              aria-label="Previous courses"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMobileTrack("next")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#0E1629]/20 bg-white text-[#0E1629] cursor-pointer"
              aria-label="Next courses"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: keep existing grid layout */}
      <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <CourseCard
                key={`sk-${i}`}
                isLoading
                isBaught={false}
                useListingMobileCard
              />
            ))
          : items.map(({ course: c, purchased }) => (
              <CourseCard
                key={c.id}
                course={c}
                isBaught={purchased}
                isLoading={false}
                useListingMobileCard
              />
            ))}
      </div>
    </section>
  );
}
