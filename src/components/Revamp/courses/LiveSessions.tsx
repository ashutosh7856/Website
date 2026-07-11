import type { CourseType } from "@/types/course";
import LiveSessionCard from "./LiveSessionCard";

interface CourseWithMeta extends CourseType {
    isPurchased: boolean;
    isTrending: boolean;
}

const courseImages = ["/course/2.webp", "/course/3.webp"];

const coursesData: CourseWithMeta[] = [
    {
        id: "course-1",
        image: courseImages[0],
        rating: "4.8",
        name: "Foundations of Mental Wellness",
        subject: "Mental",
        price: "INR 4,999",
        courseTimeHours: 12,
        courseTimeMinutes: 0,
        isPurchased: true,
        isTrending: true,
    },
    {
        id: "course-2",
        image: courseImages[1],
        rating: "4.6",
        name: "Psychometric Test Mastery",
        subject: "Psychometric",
        price: "INR 3,499",
        courseTimeHours: 9,
        courseTimeMinutes: 30,
        isPurchased: false,
        isTrending: true,
    },
    {
        id: "course-3",
        image: courseImages[0],
        rating: "4.7",
        name: "Admission Strategy Blueprint",
        subject: "Admission",
        price: "INR 5,299",
        courseTimeHours: 14,
        courseTimeMinutes: 15,
        isPurchased: true,
        isTrending: false,
    },
    {
        id: "course-4",
        image: courseImages[1],
        rating: "4.5",
        name: "Career Upskilling Essentials",
        subject: "Upskilling",
        price: "INR 2,999",
        courseTimeHours: 8,
        courseTimeMinutes: 45,
        isPurchased: false,
        isTrending: true,
    },
    {
        id: "course-5",
        image: courseImages[1],
        rating: "4.9",
        name: "Personal Growth Lab",
        subject: "Mental",
        price: "INR 3,999",
        courseTimeHours: 10,
        courseTimeMinutes: 0,
        isPurchased: true,
        isTrending: false,
    },
    {
        id: "course-6",
        image: courseImages[0],
        rating: "4.4",
        name: "College Readiness Bootcamp",
        subject: "Admission",
        price: "INR 2,499",
        courseTimeHours: 7,
        courseTimeMinutes: 20,
        isPurchased: false,
        isTrending: true,
    },
    {
        id: "course-7",
        image: courseImages[0],
        rating: "4.8",
        name: "Student Success Mindset",
        subject: "Mental",
        price: "INR 3,799",
        courseTimeHours: 11,
        courseTimeMinutes: 10,
        isPurchased: true,
        isTrending: false,
    },
    {
        id: "course-8",
        image: courseImages[1],
        rating: "4.7",
        name: "Scholarship Interview Accelerator",
        subject: "Admission",
        price: "INR 3,299",
        courseTimeHours: 9,
        courseTimeMinutes: 50,
        isPurchased: false,
        isTrending: true,
    },
];

export default function LiveSection() {
    const isLoadingCourses = false;

    const visibleCourses = coursesData;

    return (
        <div className="w-full pt-10">
            <div className="max-w-[1440px] h-full mx-auto px-[60px]">
                <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md">
                        <div className="w-4 h-4 bg-[#0E1629]" />
                        <p className="font-[Poppins] font-semibold text-[14px] text-[#0E1629] uppercase tracking-wider">
                            LIVE SESSIONS
                        </p>
                    </div>

                    <p className="font-[Poppins] font-medium text-[24px] text-[#0E1629] max-w-[682px] leading-normal">
                        Join live, exam-focused sessions for JEE, MHT-CET, and other test series with strategy, practice, and real-time doubt solving.
                    </p>
                </div>

                <div className="flex gap-[25px] mb-6 min-h-[451px] items-start overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth [touch-action:pan-x]">
                    {isLoadingCourses ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                            <div key={`skeleton-${idx}`} className="shrink-0 snap-start">
                                <LiveSessionCard isLoading={true} />
                            </div>
                        ))
                    ) : visibleCourses.length > 0 ? (
                        visibleCourses.map((course) => (
                            <div key={course.id} className="shrink-0 snap-start">
                                <LiveSessionCard
                                    title={course.name}
                                    coverImage={course.image}
                                    sessionDate="26 Mar, 2026"
                                    duration={`${course.courseTimeMinutes}m`}
                                    ctaLabel="Join Session"
                                    isLoading={false}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="font-[Poppins] text-[14px] text-[#6B7280] self-center">
                            No courses found.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}