import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBoughtCourses, getBookmarkedCourses } from '@/api/course';
import { useAuthStore } from '@/store/AuthStore';
import { useNavigate } from 'react-router-dom';
import CourseCard from '@/components/course-cards/CourseCard';
import { Loader2 } from 'lucide-react';

type SubTab = 'Purchased' | 'Saved';

export default function MyCoursesTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Purchased');
  const { userId, role } = useAuthStore();
  const navigate = useNavigate();

  const { data: purchasedData, isLoading: loadingPurchased, error: errorPurchased } = useQuery({
    queryKey: ['boughtCourses', userId],
    queryFn: () => getBoughtCourses(userId as string),
    enabled: !!userId && activeSubTab === 'Purchased',
  });

  const { data: bookmarkedData, isLoading: loadingBookmarked, error: errorBookmarked } = useQuery({
    queryKey: ['bookmarkedCourses', userId],
    queryFn: () => getBookmarkedCourses(userId as string),
    enabled: !!userId && activeSubTab === 'Saved',
  });

  const TABS: SubTab[] = ['Purchased', 'Saved'];

  const currentData = activeSubTab === 'Purchased' ? purchasedData : bookmarkedData;
  const isLoading = activeSubTab === 'Purchased' ? loadingPurchased : loadingBookmarked;
  const error = activeSubTab === 'Purchased' ? errorPurchased : errorBookmarked;

  return (
    <div className="md:bg-white md:py-5 md:px-4 md:rounded-2xl md:border md:border-[#EFEFEF]">
      <div className="bg-white p-2 rounded-xl border border-[#EFEFEF] md:bg-transparent md:p-0 md:border-none md:mb-5">
        <div className="flex items-center gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 md:flex-none px-4 cursor-pointer py-2 text-[12px] md:text-base font-medium rounded-full transition-colors duration-200 ${
                activeSubTab === tab 
                  ? 'bg-[#E8E7F2] text-[#13097D]' 
                  : 'bg-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#13097D]" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 text-lg mb-2">Failed to load courses</p>
          <p className="text-gray-500 text-sm">{(error as Error).message}</p>
        </div>
      ) : !currentData?.data || currentData.data.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No {activeSubTab.toLowerCase()} courses yet
          </h3>
          <p className="text-gray-500 text-sm">
            {activeSubTab === 'Purchased' 
              ? 'Start learning by purchasing your first course!'
              : 'Browse courses and save them for later'}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-2">
          {currentData.data.map(course => (
            <div 
              key={course.courseId} 
              className='cursor-pointer' 
              onClick={(e) => {e.preventDefault()
                 navigate(`/courses/detail/${course.courseId}/${role || 'user'}`, { state: { from: 'my-courses' } })

              }}
            >
              <CourseCard 
                course={{
                  id: course.courseId,
                  name: course.courseName,
                  subject: course.category,
                  price: course.coursePriceAfterDiscount.toString(),
                  rating: course.rating?.toString() || undefined,
                  reviews: undefined,
                  image: course.courseThumbnailUrl,
                  isBookmarked: activeSubTab === 'Saved',
                  courseTimeHours: (course as { courseTimeHours?: number }).courseTimeHours || 0,
                  courseTimeMinutes: (course as { courseTimeMinutes?: number }).courseTimeMinutes || 0,
                }} 
                role={(role as "user" | "student" | "counselor") || "user"}
                showBookmark={true}
                userId={userId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
