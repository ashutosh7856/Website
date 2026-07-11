import type { CourseType } from "@/types/course";
import type { CourseContent, CourseDetails } from "@/api/course";
import { Bookmark, Check, Users, Calendar, Star } from "lucide-react";
import type { ReactNode } from "react";

type DetailsCardProps = {
  role: string;
  courseId: string;
  course: CourseType;
  courseDetails?: CourseDetails;
  description?: string;
  children?: ReactNode;
  isPurchased?: boolean;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onBuyCourse?: () => void;
  isBookmarking?: boolean;
  isBuying?: boolean;
  isCourseOwner?: boolean;
};

function normalizeTime(courseHours = 0, courseMinutes = 0) {
  const MINUTES_IN_HOUR = 60;
  const HOURS_IN_DAY = 24;
  const DAYS_IN_MONTH = 30;
  const DAYS_IN_YEAR = 365;

  let totalMinutes = courseHours * MINUTES_IN_HOUR + courseMinutes;
  const minutes = totalMinutes % MINUTES_IN_HOUR;
  let totalHours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
  const hours = totalHours % HOURS_IN_DAY;
  let totalDays = Math.floor(totalHours / HOURS_IN_DAY);
  const years = Math.floor(totalDays / DAYS_IN_YEAR);
  totalDays %= DAYS_IN_YEAR;
  const months = Math.floor(totalDays / DAYS_IN_MONTH);
  const days = totalDays % DAYS_IN_MONTH;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}min`);

  return parts.length > 0 ? parts.join(" ") : "0min";
}

function formatUpdatedAt(updatedAt?: { seconds: number; nanos?: number }) {
  if (!updatedAt?.seconds) return "Recently";
  try {
    return new Date(updatedAt.seconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function buildIncludesList(contents: CourseContent[] | undefined) {
  const list: string[] = ["Full lifetime access"];
  if (!contents?.length) {
    list.push("Structured course materials");
    list.push("Performance analytics & progress tracking");
    return list;
  }
  const videos = contents.filter((c) => c.type === "video" || c.type === "link").length;
  const files = contents.filter((c) =>
    ["doc", "pdf", "image"].includes(c.type)
  ).length;
  const rootItems = contents.filter((c) => c.parentPath === "root").length;
  if (videos > 0 || files > 0) {
    const parts: string[] = [];
    if (videos > 0) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
    if (files > 0) parts.push(`${files} file${files === 1 ? "" : "s"}`);
    list.push(parts.join(", "));
  } else if (rootItems > 0) {
    list.push(`${rootItems} learning module${rootItems === 1 ? "" : "s"}`);
  } else {
    list.push("Structured course materials");
  }
  list.push("Performance analytics & progress tracking");
  return list;
}

export default function DetailsCard({
  role,
  course,
  courseDetails,
  description,
  children,
  isPurchased,
  isBookmarked,
  onBookmark,
  onBuyCourse,
  isBookmarking,
  isBuying,
  isCourseOwner,
}: DetailsCardProps) {
  const totalBought = courseDetails?.soldCount ?? 0;
  const moneyEarned = courseDetails
    ? (courseDetails.soldCount || 0) * (courseDetails.coursePriceAfterDiscount || 0)
    : 0;
  const displayPrice =
    (courseDetails?.coursePriceAfterDiscount ?? Number(course.price)) || 0;
  const ratingNum = course.rating != null ? Number(course.rating) : null;
  const reviewCount = courseDetails?.counsellorCourseReviewResponse?.length ?? 0;
  const includes = buildIncludesList(courseDetails?.courseContents);

  const scrollToContent = () => {
    document.getElementById("course-content")?.scrollIntoView({ behavior: "smooth" });
  };

  const mainCard = (
    <div className="min-w-0 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm md:p-3">
      <div className="flex flex-row gap-3 items-start">
        <div className="relative shrink-0">
          <img loading="lazy" decoding="async"
            src={course.image}
            alt=""
            className="h-[86px] w-[86px] rounded-xl object-cover md:h-[132px] md:w-[132px]"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2 text-left">
          <h1 className="text-[14px] md:text-[24px] font-semibold leading-tight text-[#0E1629]">
            {course.name}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {courseDetails && (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#E1EDFA] px-2 py-1 text-[8px] md:text-[14px] font-medium text-[#226CBD]">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {totalBought > 99 ? "99+" : totalBought} courses bought
              </span>
            )}
            {role === "counselor" && courseDetails && (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#FDEFE2] px-2 py-1 text-[8px] md:text-[14px] font-medium text-[#EF7F21]">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="" className="h-3.5 w-3.5" />
                {moneyEarned} earned
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#E7FAF9] px-2 py-1 text-[8px] md:text-[14px] font-medium text-[#058C91]">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Last updated {formatUpdatedAt(courseDetails?.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#F3F4F6] px-2 py-1 text-[8px] md:text-[14px] font-medium text-[#4B5563]">
              <img loading="lazy" decoding="async" src="/greenClock.svg" alt="" className="h-3.5 w-3.5" />
              {normalizeTime(course.courseTimeHours, course.courseTimeMinutes)}
            </span>
            {role !== "counselor" && (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#FDEFE2] px-2 py-1 text-[8px] font-medium text-[#EF7F21] md:hidden">
                <Star className="h-3.5 w-3.5 fill-[#EF7F21] text-[#EF7F21]" aria-hidden />
                {ratingNum != null && !Number.isNaN(ratingNum)
                  ? Math.round(ratingNum * 10) / 10
                  : "—"}{" "}
                (
                {reviewCount || Number(course.reviews) || 0}
                 ratings) 
              </span>
            )}
          </div>

          {role !== "counselor" && (
            <div className="hidden md:flex items-center gap-1.5 text-sm text-[#0E1629]">
              <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
              <span className="font-medium">
                {ratingNum != null && !Number.isNaN(ratingNum)
                  ? Math.round(ratingNum * 10) / 10
                  : "—"}
              </span>
              <span className="text-[#6B7280]">
                (
                {reviewCount || Number(course.reviews) || 0}{" "}
                {(reviewCount || Number(course.reviews) || 0) === 1
                  ? "review"
                  : "reviews"}
                )
              </span>
            </div>
          )}
        </div>
      </div>

      {description != null && description !== "" && (
        <section className="mt-6 border-t border-gray-100 pt-6">
          <h2 className="text-[14px] md:text-[20px] font-semibold text-[#0E1629]">
            Course description
          </h2>
          <p className="mt-3 text-[12px] md:text-[16px] font-normal leading-relaxed text-[#6B7280]">
            {description}
          </p>
        </section>
      )}

      {children != null && (
        <div className="mt-6 border-t border-gray-100 pt-6 hidden lg:block">{children}</div>
      )}
    </div>
  );

  const purchaseSidebar =
    role !== "counselor" ? (
      <aside className="hidden min-w-0 space-y-4 lg:block">
        <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="" className="h-5 w-5 shrink-0" />
              <span className="text-[16px] font-medium text-[#0E1629]">
                {displayPrice} ProCoins
              </span>
            </div>
            {onBookmark && (
              <button
                type="button"
                onClick={onBookmark}
                disabled={isBookmarking}
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0E1629] transition hover:opacity-80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Bookmark
                  className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
                  aria-hidden
                />
                Bookmark course
              </button>
            )}
          </div>

          {courseDetails?.coursePrice != null &&
            courseDetails.coursePriceAfterDiscount != null &&
            courseDetails.coursePrice > courseDetails.coursePriceAfterDiscount && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[#9CA3AF] line-through">
                  ₹{courseDetails.coursePrice}
                </span>
                <span className="font-semibold text-[#059669]">
                  {Math.round(
                    ((courseDetails.coursePrice - courseDetails.coursePriceAfterDiscount) /
                      courseDetails.coursePrice) *
                      100
                  )}
                  % off
                </span>
              </div>
            )}

          {!isPurchased && onBuyCourse && (
            <button
              type="button"
              onClick={onBuyCourse}
              disabled={isBuying}
              className="mt-4 w-full rounded-xl bg-[#0E1629] py-3 text-center text-[16px] font-medium text-white transition hover:bg-[#151e35] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBuying ? "Processing…" : "Buy now"}
            </button>
          )}

          {isPurchased && (
            <button
              type="button"
              onClick={scrollToContent}
              className="mt-4 w-full rounded-xl border-2 border-[#0E1629] bg-white py-3 text-center text-[16px] font-medium text-[#0E1629] transition hover:bg-gray-50 cursor-pointer"
            >
              View content
            </button>
          )}

          <p className="mt-3 text-center text-xs text-[#6B7280]">
            100% satisfaction guarantee
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm">
          <h3 className="text-[18px] font-semibold text-[#0E1629]">
            This course includes:
          </h3>
          <ul className="mt-4 space-y-3">
            {includes.map((line) => (
              <li key={line} className="flex gap-3 text-[16px] font-medium text-[#4B5563]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#2F43F2]">
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    ) : null;

  const mobileIncludesCard =
    role !== "counselor" ? (
      <div className="mt-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm lg:hidden">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-[#0E1629]">
          This course includes:
        </h3>
        <ul className="mt-4 space-y-3">
          {includes.map((line) => (
            <li key={line} className="flex gap-3 text-[14px] md:text-[16px] font-medium text-[#4B5563]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#2F43F2]">
                <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const mobileContentCard =
    children != null ? (
      <div className="mt-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm lg:hidden">
        {children}
      </div>
    ) : null;

  const mobileBottomBar =
    role !== "counselor" ? (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-center gap-2">
            <img loading="lazy" decoding="async" src="/coin.svg" alt="" className="h-5 w-5 shrink-0" />
            {courseDetails?.coursePrice != null &&
              courseDetails.coursePriceAfterDiscount != null &&
              courseDetails.coursePrice > courseDetails.coursePriceAfterDiscount && (
                <span className="text-[16px] text-[#9CA3AF] line-through">
                  {courseDetails.coursePrice}
                </span>
              )}
            <span className="text-[32px] font-semibold text-[#0E1629]">
              {displayPrice}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onBookmark}
              disabled={isBookmarking || !onBookmark}
              className="h-12 rounded-[14px] border-2 border-[#0E1629] bg-white text-[16px] font-medium text-[#0E1629] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bookmark
            </button>

            {!isPurchased ? (
              <button
                type="button"
                onClick={onBuyCourse}
                disabled={isBuying || !onBuyCourse}
                className="h-12 rounded-[14px] bg-[#0E1629] text-[16px] font-medium text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBuying ? "Processing..." : "Buy Now"}
              </button>
            ) : (
              <button
                type="button"
                onClick={scrollToContent}
                className="h-12 rounded-[14px] bg-[#0E1629] text-[16px] font-medium text-white cursor-pointer"
              >
                View Content
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null;

  if (isCourseOwner) {
    return <div className="min-w-0">{mainCard}</div>;
  }

  return (
    <>
      <div className="min-w-0 lg:col-span-1">{mainCard}</div>
      {mobileContentCard}
      {mobileIncludesCard}
      {purchaseSidebar}
      {mobileBottomBar}
    </>
  );
}
