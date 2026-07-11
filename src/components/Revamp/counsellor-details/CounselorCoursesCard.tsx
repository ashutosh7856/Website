import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCoursesForCounsellorByCounsellorId, getCoursesForUserByCounsellorId, getPublicCoursesForCounsellorId } from '@/api/course';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronUp, Users, Star } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';

const PAGE_SIZE = 4;

type CounselorCoursesCardProps = {
  counsellorId: string;
  userRole?: "user" | "student" | "counselor" | "proBuddy";
};

export default function RevampCounselorCoursesCard({ counsellorId, userRole = "user" }: CounselorCoursesCardProps) {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isCounselor = userRole === 'counselor';
  const isUserOrStudent = userRole === 'user' || userRole === 'student';

  const { data, isLoading, error } = useQuery({
    queryKey: ['counsellorCourses', counsellorId, userId, userRole],
    queryFn: () => {
      if (isCounselor) {
        return getCoursesForCounsellorByCounsellorId(counsellorId);
      } else if (isUserOrStudent && userId) {
        return getCoursesForUserByCounsellorId(userId, counsellorId);
      } else if (isUserOrStudent && !userId) {
        return getPublicCoursesForCounsellorId(counsellorId);
      }
      throw new Error('Unauthorized access');
    },
    enabled: !!counsellorId,
  });

  const courses = data?.data || [];
  const displayedCourses = courses.slice(0, visibleCount);
  const hasMore = visibleCount < courses.length;
  const isExpanded = visibleCount > PAGE_SIZE;

  if (isLoading) {
    return (
      <div className="w-full max-w-[580px] bg-white rounded-[16px] border border-[#EFEFEF] p-6 sm:p-8 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F43F2]" />
      </div>
    );
  }

  if (error || !courses || courses.length === 0) {
    return null; 
  }

  return (
    <div className="w-full max-w-[580px] bg-white rounded-[16px] border border-[#EFEFEF] p-[10px] sm:p-[12px] font-poppins shadow-sm">
      
      {/* Header */}
      <div className="flex items-center px-[4px]">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E1629] leading-none">
          Courses
        </h2>
      </div>

      {/* Course Cards List */}
      <div className="mt-[16px] sm:mt-[20px] flex flex-col gap-[10px] sm:gap-[12px]">
        {displayedCourses.map((course: any) => (
          <div
            key={course.courseId}
            onClick={() => navigate(`/courses/detail/${course.courseId}/${userRole}`)}
            className="w-full min-h-[152px] sm:h-[180px] bg-[#F5F5F5] rounded-[12px] p-[10px] sm:p-[12px] flex gap-[10px] sm:gap-[16px] cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <img loading="lazy" decoding="async"
              src={course.courseThumbnailUrl || '/placeholder-course.jpg'}
              alt={course.courseName}
              className="w-[96px] h-[96px] sm:w-[184px] sm:h-[155px] rounded-[9px] object-cover shrink-0"
            />

            {/* Details Wrapper */}
            <div className="flex flex-col flex-1 min-w-0 sm:pl-[4px]">

              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-[15px] sm:text-[20px] font-medium text-[#343C6A] leading-[120%] line-clamp-2 wrap-break-word">
                  {course.courseName}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-[8px] sm:gap-[12px] mt-[8px] sm:mt-[12px]">
                  <span className="bg-[#E1EDFA] text-[#226CBD] flex items-center gap-[4px] px-[6px] py-[4px] rounded-[4px]">
                    <Users className="w-[12px] h-[12px]" />
                    <span className="text-[10px] font-medium leading-none mt-[1px]">100+ Courses bought</span>
                  </span>

                  <span className="bg-[#FDEFE2] text-[#EF7F21] flex items-center gap-[4px] px-[6px] py-[4px] rounded-[4px]">
                    <Star className="w-[12px] h-[12px] fill-current" />
                    <span className="text-[10px] font-medium leading-none mt-[1px]">
                      {course.rating ? Number(course.rating).toFixed(1) : '4.7'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Price anchored to bottom */}
              <div className="mt-auto flex items-center gap-[6px] sm:gap-[8px] pb-[2px] sm:pb-[4px]">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="Procoins" className="w-[24px] h-[24px]" />
                <div className="flex items-center gap-[4px]">
                  <span className="text-[14px] sm:text-[16px] font-medium text-[#0E1629] leading-none">
                    {course.coursePriceAfterDiscount}
                  </span>
                  <span className="text-[14px] sm:text-[16px] font-medium text-[#6B7280] leading-none">
                    Procoins
                  </span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* See more / See less */}
      {(hasMore || isExpanded) && (
        <div className="flex justify-center mt-[12px]">
          {hasMore ? (
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="flex items-center gap-[2px] text-[12px] sm:text-[14px] font-semibold text-[#3D3D3D] leading-none cursor-pointer hover:text-[#2F43F2] transition-colors"
            >
              See more <ChevronRight className="w-[16px] h-[16px]" />
            </button>
          ) : (
            <button
              onClick={() => setVisibleCount(PAGE_SIZE)}
              className="flex items-center gap-[2px] text-[12px] sm:text-[14px] font-semibold text-[#3D3D3D] leading-none cursor-pointer hover:text-[#2F43F2] transition-colors"
            >
              See less <ChevronUp className="w-[16px] h-[16px]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}