import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// import type { CourseType } from '@/types/course';
import CourseCard from '@/components/course-cards/CourseCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/AuthStore';
import CreateCourseCard from '@/components/course-cards/CreateCourseCard';
import { getCoursesForCounsellorByCounsellorId } from '@/api/course';
import type { CounsellorCourse } from '@/api/course';
import { Loader2, Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTestGroups, deleteTestGroup, publishUnpublishTestGroup } from '@/api/testGroup';
import type { TestGroup } from '@/types/testGroup';

type SubTab = 'Test Groups' | 'Courses';

type CourseTabProps = {
  user: any,
  token: string;
}



export default function CourseTab(props: CourseTabProps) {
  const { user: _user, token: _token } = props;
  const { role, userId } = useAuthStore();
  const navigate = useNavigate();
  const [createCourse, setCreateCourse] = useState(false);

  // Persist active tab in localStorage
  const [activeTab, setActiveTab] = useState<SubTab>(() => {
    const savedTab = localStorage.getItem('counsellorCoursesActiveTab');
    return (savedTab as SubTab) || 'Courses';
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ testGroupId: string; testGroupName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('counsellorCoursesActiveTab', activeTab);
  }, [activeTab]);

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ["counsellorCourses", userId],
    queryFn: () => getCoursesForCounsellorByCounsellorId(userId as string),
    enabled: !!userId,
  });

  const { data: testGroupsData, isLoading: isLoadingTestGroups, error: testGroupsError, refetch: refetchTestGroups } = useQuery({
    queryKey: ["counsellorTestGroups", userId],
    queryFn: async () => {
      const result = await getAllTestGroups(userId as string);
      return result;
    },
    enabled: !!userId && activeTab === 'Test Groups',
  });

  const TABS: SubTab[] = ['Courses', 'Test Groups'];

  const filteredCourses = coursesData?.data || []

  function onClose() {
    setCreateCourse(false);
  }

  const handleDeleteTestGroup = async (testGroupId: string) => {
    setIsDeleting(true);
    try {
      await deleteTestGroup(userId as string, testGroupId);
      toast.success("Test group deleted successfully!");
      refetchTestGroups();
    } catch (error: any) {
      console.error("Error deleting test group:", error);
      toast.error(error.message || "Error deleting test group. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const handleTogglePublish = async (testGroupId: string, currentStatus: boolean) => {
    try {
      await publishUnpublishTestGroup(userId as string, testGroupId, !currentStatus);
      toast.success(`Test group ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      refetchTestGroups();
    } catch (error: any) {
      console.error("Error toggling publish status:", error);
      toast.error(error.message || "Error updating test group status.");
    }
  };


  return (
    <div className="md:bg-white md:py-5 md:px-4 md:rounded-2xl md:border md:border-[#EFEFEF]">
      <div className="bg-white p-2 rounded-xl border border-[#EFEFEF] md:bg-transparent md:p-0 md:border-none md:mb-5">
        <div className='flex justify-between'>
          <div className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 text-[12px] md:text-base font-medium rounded-full transition-colors duration-200 cursor-pointer ${activeTab === tab
                  ? 'bg-[#E8E7F2] text-[#13097D]'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/counselor/test-groups/create')}
              className='flex bg-[#655E95] hover:bg-[#655E95]/90 rounded-2xl md:rounded-[0.75rem] cursor-pointer text-clip border text-xs py-2 lg:py-3 px-3 lg:px-6 text-white items-center justify-center lg:font-semibold'
            >
              Create Test Group
            </button>
            <button
              onClick={() => setCreateCourse(true)}
              className='flex bg-[#655E95] hover:bg-[#655E95]/90 rounded-2xl md:rounded-[0.75rem] cursor-pointer text-clip border text-xs py-2 lg:py-3 px-3 lg:px-6 text-white items-center justify-center lg:font-semibold'
            >
              Create a Course
            </button>
          </div>
        </div>

      </div>

      {activeTab === 'Test Groups' ? (
        isLoadingTestGroups ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#13097D]" />
          </div>
        ) : testGroupsError ? (
          <div className="text-center py-16 text-red-500">
            {(testGroupsError as Error).message || 'Failed to load test groups'}
          </div>
        ) : testGroupsData?.data?.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {testGroupsData.data.map((group: TestGroup) => (
              <div
                key={group.testGroupId}
                onClick={() => navigate(`/counselor/test-groups/${group.testGroupId}`)}
                className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-[#E8EAED] cursor-pointer"
              >
                <div className="relative h-48">
                  {group.bannerImagUrl ? (
                    <img loading="lazy" decoding="async" src={group.bannerImagUrl} alt={group.testGroupName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {group.priceType === 'PAID' && (
                      <span className="text-sm px-3 py-1 bg-white/95 backdrop-blur-sm text-purple-700 rounded-full font-semibold shadow-sm">
                        ₹{group.price}
                      </span>
                    )}
                    {group.priceType === 'FREE' && (
                      <span className="text-sm px-3 py-1 bg-white/95 backdrop-blur-sm text-green-700 rounded-full font-semibold shadow-sm">
                        FREE
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 ${group.published ? 'bg-green-500' : 'bg-gray-500'} text-white rounded-full font-medium shadow-sm`}>
                      {group.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {group.testGroupName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {group.testGroupDescription}
                  </p>
                  <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {group.attachedTestIds?.length || 0} Tests
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {group.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-gray-500">
                      {group.soldCount || 0} sold
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">{group.testType}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/counselor/test-groups/edit/${group.testGroupId}`);
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                      title="Edit Group"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(group.testGroupId, group.published);
                      }}
                      className={`flex items-center justify-center gap-1 py-2 px-3 ${group.published ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors text-sm font-medium cursor-pointer`}
                      title={group.published ? "Unpublish" : "Publish"}
                    >
                      {group.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmation({ testGroupId: group.testGroupId, testGroupName: group.testGroupName });
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No test groups created yet.</p>
            <button
              onClick={() => navigate('/counselor/test-groups/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#655E95] text-white rounded-lg hover:opacity-90 transition-all font-medium cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create Your First Test Group
            </button>
          </div>
        )
      ) : (
        isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#13097D]" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            {(error as Error).message || 'Failed to load courses'}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-2 grid-cols-2 md:grid-col-4 lg:grid-cols-5 mt-2">
            {filteredCourses.map((course: CounsellorCourse) => (
              <div
                key={course.courseId}
                className='cursor-pointer'
                onClick={() => navigate(`/courses/detail/${course.courseId}/${role}`, { state: { from: 'courses' } })}
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
                    courseTimeHours: (course as any).courseTimeHours || 0,
                    courseTimeMinutes: (course as any).courseTimeMinutes || 0,
                  }}
                  role={role || "counselor"}
                  isPublished={course.isPublished}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            No courses created yet.
          </div>
        )
      )}

      {createCourse && <CreateCourseCard onClose={onClose} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-semibold text-(--text-app-primary) mb-4">
              Delete Test Group
            </h2>
            <p className="text-(--text-muted) mb-6">
              Are you sure you want to delete "<strong>{deleteConfirmation.testGroupName}</strong>"? This action cannot be undone and will delete all test series and questions associated with this test group.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-[#E9EBEC] text-(--text-app-primary) hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTestGroup(deleteConfirmation.testGroupId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}