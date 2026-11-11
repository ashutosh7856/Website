import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { CourseType } from "@/types/course";
import CourseCard from "./CourseCard";
import { SeeAllButton } from "../components/LeftRightButton";
import {
  getAllCounsellorCoursesForGuest,
  getAllCounsellorCoursesForUser,
  getBoughtCourses,
  type GetCoursesResponse,
} from "@/api/course";
import { useNavigate } from "react-router-dom";
import { COURSES_SNAPSHOT } from "@/data/contentSnapshot";
import type { RawCourseRow, RawListResponse } from "./rawListRows";

// Snapshot rows omit `discount`, which nothing reading this cache uses.
const COURSES_SEED = COURSES_SNAPSHOT.length
  ? ({ data: COURSES_SNAPSHOT, message: "snapshot" } as unknown as GetCoursesResponse)
  : undefined;

type CourseTab = "my-courses" | "trending" | "all-courses";

interface CourseWithMeta extends CourseType {
  isPurchased: boolean;
  isTrending: boolean;
}

const tabOptions: { id: CourseTab; label: string }[] = [
  { id: "my-courses", label: "My Course" },
  { id: "trending", label: "Trending" },
];

const formatRatingToOneDecimal = (rating: unknown) => {
  const numeric = Number(rating);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "0.0";
};

const normalizeCourses = (response: unknown, isPurchasedFallback = false): CourseWithMeta[] => {
  const res = response as RawListResponse<RawCourseRow>;
  const list: RawCourseRow[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

  return list.map((course) => {
    const soldCount = Number(course?.soldCount ?? 0);
    return {
      id: String(course?.courseId ?? ""),
      image: String(course?.courseThumbnailUrl ?? "/course/2.webp"),
      rating: formatRatingToOneDecimal(course?.rating),
      name: String(course?.courseName ?? "Course"),
      counselorName: String(course?.counsellorName ?? course?.counselorName ?? ""),
      counsellorName: String(course?.counsellorName ?? course?.counselorName ?? ""),
      subject: String(course?.category ?? "General"),
      price: `₹${Number(course?.coursePriceAfterDiscount ?? course?.coursePrice ?? 0).toLocaleString("en-IN")}`,
      courseTimeHours: Number(course?.courseTimeHours ?? 0),
      courseTimeMinutes: Number(course?.courseTimeMinutes ?? 0),
      isPurchased: Boolean(course?.purchasedByMe ?? isPurchasedFallback),
      isTrending: Boolean(course?.isTrending ?? soldCount > 25),
    };
  });
};

export default function CourseSection() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("phone") || "";
  const token = localStorage.getItem("jwt") || "";
  const isUserLoggedIn = Boolean(userId && token);

  const [activeTab, setActiveTab] = useState<CourseTab>("my-courses");

  const { data: allCoursesResponse, isLoading: isLoadingAllCourses } = useQuery({
    queryKey: ["revamp-all-courses", isUserLoggedIn ? userId : "guest"],
    queryFn: () =>
      isUserLoggedIn
        ? getAllCounsellorCoursesForUser(userId)
        : getAllCounsellorCoursesForGuest(),
    enabled: !isUserLoggedIn || Boolean(userId),
    // Seeded from the build-time snapshot so /courses prerenders with real
    // courses instead of "No courses found for this tab."
    initialData: COURSES_SEED,
    initialDataUpdatedAt: 0,
  });

  const { data: myCoursesResponse, isLoading: isLoadingMyCourses } = useQuery({
    queryKey: ["revamp-my-courses", userId],
    queryFn: () => getBoughtCourses(userId),
    enabled: isUserLoggedIn && Boolean(userId),
  });

  const allCoursesData = useMemo(
    () => normalizeCourses(allCoursesResponse, false),
    [allCoursesResponse]
  );

  const myCoursesData = useMemo(
    () => normalizeCourses(myCoursesResponse, true),
    [myCoursesResponse]
  );

  const hasPurchasedCourses = myCoursesData.length > 0;
  // Only show the tabs (My Courses + Trending) when the user actually has
  // purchased courses. With nothing in "My Courses", a lone Trending tab is
  // pointless, so hide the tabs entirely.
  const visibleTabOptions = isUserLoggedIn && hasPurchasedCourses ? tabOptions : [];

  useEffect(() => {
    if (isUserLoggedIn && !hasPurchasedCourses && activeTab === "my-courses") {
      setActiveTab("trending");
    }
  }, [isUserLoggedIn, hasPurchasedCourses, activeTab]);

  const isLoadingCourses = isUserLoggedIn
    ? activeTab === "my-courses"
      ? isLoadingMyCourses
      : isLoadingAllCourses
    : isLoadingAllCourses;

  const filteredCourses = useMemo(() => {
    if (!isUserLoggedIn) return allCoursesData;

    if (activeTab === "my-courses") {
      return myCoursesData;
    }

    if (activeTab === "trending") {
      return allCoursesData.filter(
        (course) => !course.isPurchased,
      );
    }

    return allCoursesData.filter((course) => !course.isPurchased);
  }, [activeTab, allCoursesData, isUserLoggedIn, myCoursesData]);

  const handleTabChange = (tab: CourseTab) => {
    setActiveTab(tab);
  };

  // A signed-out visitor with no courses at all gets no section, rather than a
  // "No courses found" placeholder — that empty block is what crawlers saw.
  if (!isUserLoggedIn && !isLoadingCourses && allCoursesData.length === 0) return null;

  const shouldShowInlineCourseUpsell =
    isUserLoggedIn && activeTab === "my-courses" && filteredCourses.length <= 1 && !isLoadingCourses;

  const handleSingleCardCta = () => {
    if (isUserLoggedIn && activeTab === "my-courses") {
      handleTabChange("trending");
      return;
    }
    navigate("/courses");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 60,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 12,
        mass: 1,
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.3,
      },
    },
  };

  // One responsive tree, not a `md:hidden` mobile copy plus a `hidden md:block`
  // desktop copy. Both copies used to render the full course list, so every
  // course title was served twice — and Banner mounted this component twice on
  // top of that, putting each title in the HTML up to eight times. React also
  // mounted, hooked and re-rendered the invisible copy on every state change;
  // `display:none` hides pixels, not component lifecycles.
  return (
    <div className="w-full bg-[#F5F5F7] py-[15px] md:py-10">
      <div className="pl-5 md:pl-0 md:mx-auto md:h-full md:max-w-[90rem] md:px-[3.75rem]">
        <div className="flex flex-col items-start gap-3 pr-0 md:mb-10 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-1 md:rounded-md">
            <div className="h-4 w-4 bg-[#0E1629]" />
            <p className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-[#0E1629] md:text-[14px]">
              COURSES
            </p>
          </div>

          <p className="max-w-[682px] text-start font-[Poppins] text-xs font-medium leading-normal text-[#0E1629] md:text-[24px]">
            Discover curated programs across mental wellness, assessments,
            admissions, and upskilling led by experienced professionals, built
            around your needs.
          </p>
        </div>

        {isUserLoggedIn && visibleTabOptions.length > 0 && (
          <div className="flex gap-2.5 pt-2 md:mb-10 md:justify-center md:gap-[60px] md:pt-0">
            {visibleTabOptions.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                className={`cursor-pointer rounded-[5px] px-3 py-1.5 font-[Poppins] text-xs font-medium capitalize transition-all duration-300 md:w-[200px] md:px-5 md:py-2.5 md:text-[14px] ${
                  activeTab === tab.id
                    ? "bg-[#0E1629] text-white md:shadow-lg"
                    : "border border-[rgba(14,22,41,0.25)] text-[#0E1629] hover:border-[#0E1629] md:hover:shadow-md"
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isLoadingCourses ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring" as const, damping: 20 }}
              className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-2 md:mb-6 md:min-h-[451px] md:justify-center md:gap-[25px] md:pb-0"
            >
              {Array.from({ length: 4 }).map((_, idx) => (
                <motion.div
                  key={`skeleton-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring" as const, stiffness: 100, damping: 12, delay: idx * 0.1 }}
                  className="shrink-0"
                >
                  <CourseCard isBaught={false} isLoading={true} />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredCourses.length > 0 || shouldShowInlineCourseUpsell ? (
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex snap-x snap-mandatory items-start justify-start gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-2 [touch-action:pan-x] md:mb-6 md:min-h-[451px] md:gap-[25px] md:pb-0"
            >
              {filteredCourses.map((course) => (
                <motion.div key={course.id} variants={cardVariants} className="shrink-0 snap-start">
                  <CourseCard course={course} isBaught={course.isPurchased} isLoading={false} />
                </motion.div>
              ))}

              {shouldShowInlineCourseUpsell && (
                <motion.div
                  variants={cardVariants}
                  className="flex h-[150px] w-[250px] shrink-0 snap-start items-center justify-center self-center rounded-2xl p-3 text-center md:h-[12.5rem] md:w-[24rem] md:p-5"
                >
                  <div className="flex w-full flex-col items-center gap-3 md:gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0E1629] md:text-lg">
                        Keep your streak active
                      </p>
                      <p className="mx-auto mt-2 max-w-[20rem] text-xs leading-relaxed text-[#6B7280] md:text-sm">
                        You are off to a great start. Add more courses to unlock better outcomes.
                      </p>
                    </div>
                    <button
                      onClick={handleSingleCardCta}
                      className="w-full cursor-pointer rounded-lg bg-[#0E1629] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 md:w-auto md:rounded-xl md:px-4 md:text-sm"
                    >
                      Explore Trending
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring" as const, damping: 20 }}
              className="flex items-center justify-center py-10 md:mb-6 md:min-h-[451px] md:py-0"
            >
              {isUserLoggedIn && activeTab === "my-courses" ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-lg font-semibold text-[#0E1629] md:text-xl">Keep Learning</p>
                  <p className="mx-auto max-w-[20rem] text-sm leading-relaxed text-[#6B7280]">
                    You haven't purchased any courses yet. Explore trending courses and start your learning journey.
                  </p>
                  <button
                    onClick={() => handleTabChange("trending")}
                    className="cursor-pointer rounded-xl bg-[#0E1629] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Explore Trending
                  </button>
                </div>
              ) : (
                <p className="self-center font-[Poppins] text-[14px] text-[#6B7280]">
                  No courses found for this tab.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* "See all" stays desktop-only, as it was before the merge. */}
        <div className="hidden items-center justify-end md:flex">
          <SeeAllButton
            text="See all"
            onClick={() => {
              if (isUserLoggedIn && activeTab === "my-courses") {
                navigate(window.innerWidth < 768
                  ? "/dashboard-student?activeTab=My Courses"
                  : "/profile?activeTab=My Courses"
                );
              } else {
                navigate("/courses/course-listing");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
