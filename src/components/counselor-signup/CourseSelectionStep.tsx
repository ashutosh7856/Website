import { useState, useEffect, useMemo } from 'react';
import { getCoursesOnborading } from '@/api/auth';
import type { CousrseApiLogin } from '@/types';
import { Loader2, Search, Check } from 'lucide-react';

interface CourseSelectionStepProps {
  selectedCourses: string[];
  onCourseSelect: (courseName: string) => void;
}

// Cache for courses to prevent reloading
let cachedCourses: CousrseApiLogin[] | null = null;
let coursesFetchPromise: Promise<CousrseApiLogin[]> | null = null;

export default function CourseSelectionStep({ selectedCourses, onCourseSelect }: CourseSelectionStepProps) {
  const [courses, setCourses] = useState<CousrseApiLogin[]>(cachedCourses || []);
  const [loading, setLoading] = useState(!cachedCourses);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // If we already have cached data, use it
    if (cachedCourses) {
      setCourses(cachedCourses);
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (coursesFetchPromise) {
      coursesFetchPromise
        .then(data => {
          cachedCourses = data;
          setCourses(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to fetch courses');
          setLoading(false);
        });
      return;
    }

    // Start a new fetch
    const fetchCourses = async () => {
      try {
        const courseData = await getCoursesOnborading();
        cachedCourses = courseData;
        setCourses(courseData);
        return courseData;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses');
        throw err;
      } finally {
        setLoading(false);
        coursesFetchPromise = null;
      }
    };

    coursesFetchPromise = fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => 
    courses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [courses, searchTerm]
  );

  if (loading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="font-montserrat">
        <div className="relative mb-3 md:mb-6">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#FA660F]" size={18} />
            <input
                type="text"
                placeholder="Search Courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-[#B2B2B2] py-2 md:py-3 pl-10 md:pl-12 pr-4 text-sm md:text-base shadow-2xs focus:border-[#FA660F] focus:outline-none"
            />
        </div>

        <div className="p-1">
          <div className="grid grid-cols-2 gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
                const isSelected = selectedCourses.includes(course.name);
                return (
                    <button
                        key={course.courseId}
                        onClick={() => onCourseSelect(course.name)}
                      className={`relative transform rounded-xl border p-3 md:p-5 text-center transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'border-[#FA660F] bg-orange-50 shadow-lg ring-2 ring-[#FA660F] ring-offset-0' 
                              : 'bg-white hover:shadow-lg border-gray-200'
                        }`}
                    >
                        <img loading="lazy" decoding="async" src={course.imageStorage} alt={`${course.name} icon`} className="mb-2 md:mb-4 h-16 w-16 md:h-24 md:w-24 object-contain mx-auto" />
                        <h3 className={`text-sm md:text-lg font-bold ${isSelected ? 'text-[#FA660F]' : 'text-gray-800'} line-clamp-2`}>
                            {course.name}
                        </h3>
                        <p className={`text-xs md:text-sm ${isSelected ? 'text-orange-600' : 'text-gray-500'} line-clamp-1`}>
                            {course.duration}
                        </p>
                        <p className={`mt-1 md:mt-2 text-xs md:text-sm ${isSelected ? 'text-orange-600' : 'text-gray-500'} line-clamp-2`}>
                            {course.tagline}
                        </p>
                        {isSelected && (
                            <div className="absolute top-2 right-2 md:top-3 md:right-3 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-[#FA660F] text-white">
                                <Check size={14} className="md:w-4 md:h-4" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                );
            })}
          </div>
        </div>
    </div>
  );
}