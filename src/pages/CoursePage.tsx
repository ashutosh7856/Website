import PageSEO from "@/components/SEO/PageSEO";
import ContentCard from "@/components/course-cards/ContentCard";
import CourseReviewsCard from "@/components/course-cards/CourseReviewsCard";
import DetailsCard from "@/components/course-cards/DetailsCard";
import RecommendedCoursesSection from "@/components/course-cards/RecommendedCoursesSection";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCounsellorCourseByCourseId,
  getCounsellorCourseForUserByCourseId,
  getPublicCourseDetailsByCourseId,
  bookmarkCourse,
  buyCourse,
  publishCourse,
  deleteCourse
} from "@/api/course";
import { useAuthStore } from "@/store/AuthStore";
import { Loader2, Edit, Plus, X, Globe, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import EditCourseModal from "@/components/course-cards/EditCourseModal";
import Step3Card from "@/components/course-cards/Step3Card";
import AddFundsPanel from '@/components/student-dashboard/AddFundsPanel';
import startRecharge from '@/api/wallet';
import { getLoggedInPhone, formatPhoneForRazorpay } from '@/lib/phone';

declare global {
  interface Window {
    Razorpay: unknown;
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

export default function CoursePage() {
  const { courseId, role: roleParam } = useParams();
  const { userId, user, role: userRole, toggleLogin } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Use actual user role from auth store, fallback to route param
  const role = userRole || roleParam || 'user';
  const isCounselor = role === 'counselor';
  const isUserOrStudent = role === 'user' || role === 'student';

  const { data: courseDetails, isLoading, error } = useQuery({
    queryKey: ["courseDetails", courseId, userId, role],
    queryFn: async () => {
      console.log('Fetching course details:', { courseId, userId, role, isCounselor, isUserOrStudent });
      if (isCounselor && userId) {
        return getCounsellorCourseByCourseId(userId as string, courseId as string);
      } else if (isUserOrStudent && userId) {
        return getCounsellorCourseForUserByCourseId(userId, courseId as string);
      } else if (isUserOrStudent && !userId) {
        // Use public API for non-logged-in users
        return getPublicCourseDetailsByCourseId(courseId as string);
      }
      throw new Error('Unauthorized access');
    },
    enabled: !!courseId,
    retry: 1,
  });

  const isBookmarked = courseDetails?.bookmarkedByMe === true;
  const isPurchased = courseDetails?.purchasedByMe === true;

  // If counselor can access course via getCounsellorCourseByCourseId API, they own it
  // The API endpoint validates ownership, so we just check if they're a counselor
  const isCourseOwner = isCounselor;

  // Debug logging
  console.log('🔍 Course Ownership Debug:', {
    isCounselor,
    userRole: role,
    userId,
    isCourseOwner,
    message: isCounselor
      ? 'Counselor viewing their own course via getCounsellorCourseByCourseId'
      : 'User/Student viewing course'
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkCourse({ userId: userId as string, courseId: courseId as string }),
    onSuccess: () => {
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
      queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedCourses', userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bookmark course');
    },
  });

  const buyCourseMutation = useMutation({
    mutationFn: () => {
      if (!courseDetails) throw new Error('Course details not available');

      const price = courseDetails.coursePriceAfterDiscount || courseDetails.coursePrice || 0;
      const userBalance = courseDetails.userWalletAmount || 0;

      if (userBalance < price) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      return buyCourse({
        userId: userId as string,
        courseId: courseId as string,
        counsellorId: courseDetails.counsellorId || '',
        price: price,
      });
    },
    onSuccess: () => {
      toast.success('Course purchased successfully!');
      queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['boughtCourses', userId] });
    },
    onError: (error: Error) => {
      if (error.message === 'INSUFFICIENT_BALANCE') {
        toast.error('Insufficient balance. Please add coins to your wallet.');
        setAddFundsOpen(true);
      } else {
        toast.error(error.message || 'Failed to purchase course');
      }
    },
  });

  const handleBookmark = () => {
    if (!user) {
      // Trigger login and bookmark after successful login
      toggleLogin(() => {
        bookmarkMutation.mutate();
      });
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleBuyCourse = () => {
    if (!user || !userId) {
      // Trigger login and purchase after successful login
      toggleLogin(() => {
        // This callback will be executed after successful login
        // We need to re-trigger the purchase mutation
        buyCourseMutation.mutate();
      });
      return;
    }
    // User is logged in, proceed with purchase
    buyCourseMutation.mutate();
  };



  const handlePublishCourse = async () => {
    if (!courseDetails) return;

    // Comprehensive validation before publishing
    const missingFields: string[] = [];

    if (!courseDetails.courseName || courseDetails.courseName.trim() === '') {
      missingFields.push('Course Name');
    }
    if (!courseDetails.description || courseDetails.description.trim() === '') {
      missingFields.push('Description');
    }
    if (!courseDetails.category || courseDetails.category.trim() === '') {
      missingFields.push('Category');
    }
    if (!courseDetails.courseThumbnailUrl) {
      missingFields.push('Thumbnail Image');
    }
    if (courseDetails.coursePrice === undefined || courseDetails.coursePrice === null) {
      missingFields.push('Course Price');
    }
    if (!courseDetails.courseContents || courseDetails.courseContents.length === 0) {
      missingFields.push('Course Content (at least one file/folder)');
    }

    if (missingFields.length > 0) {
      toast.error(`Please complete the following before publishing:\n• ${missingFields.join('\n• ')}`);
      return;
    }

    setIsPublishing(true);
    try {
      await publishCourse({ counsellorId: userId as string, courseId: courseId as string });
      toast.success("Course published successfully!");
      queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['counsellorCourses'] });
    } catch (error: any) {
      console.error("Error publishing course:", error);
      toast.error(error.message || "Error publishing course. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteCourse = async () => {
    setIsDeleting(true);
    try {
      await deleteCourse(userId as string, courseId as string);
      toast.success("Course unpublished");
      queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['counsellorCourses'] });
    } catch (error: any) {
      console.error("Error unpublishing course:", error);
      toast.error("Error unpublishing course. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-[#13097D]" />
      </div>
    );
  }

  if (error) {
    console.error('Course details error:', error);
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-8">
        <p className="text-red-500 text-lg font-semibold">
          {(error as Error).message || 'Failed to load course details'}
        </p>
        <div className="text-sm text-gray-600">
          <p>CourseId: {courseId}</p>
          <p>UserId: {userId || 'Not logged in'}</p>
          <p>Role: {role}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#13097D] text-white rounded-lg cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Course not found</p>
      </div>
    );
  }

  console.log('Course details loaded:', courseDetails);

  const course = {
    id: courseDetails?.courseId || '',
    name: courseDetails?.courseName || 'Untitled Course',
    subject: courseDetails?.category || 'General',
    price: (courseDetails?.coursePriceAfterDiscount || courseDetails?.coursePrice || 0).toString(),
    rating: courseDetails?.rating ? String(courseDetails.rating) : undefined,
    reviews: courseDetails?.counsellorCourseReviewResponse?.length
      ? String(courseDetails.counsellorCourseReviewResponse.length)
      : undefined,
    image: courseDetails?.courseThumbnailUrl || '',
    isBookmarked: isBookmarked,
    courseTimeHours: courseDetails.courseTimeHours || 0,
    courseTimeMinutes: courseDetails.courseTimeMinutes || 0,

  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-6 pb-36 md:px-6 lg:pb-6">
      <PageSEO
        title={`${courseDetails?.courseName || 'Course'} | ProCounsel`}
        description={`${courseDetails?.courseName || 'This course'} on ProCounsel — curriculum, details, reviews and enrolment. Learn from verified counsellors and mentors.`}
        canonical={`/courses/detail/${courseId}/${roleParam || 'user'}`}
      />
      {/* Published/Draft Badge - Show for counselor */}
      {isCourseOwner && courseDetails && (
        <div className="max-w-7xl mx-auto mb-4 flex items-center justify-end">
          <span className={`text-sm px-4 py-1.5 rounded-full font-semibold ${courseDetails.isPublished
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white'
            }`}>
            {courseDetails.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      )}

      <div
        className={`max-w-7xl mx-auto grid gap-6 ${
          isCourseOwner ? "grid-cols-1" : "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        }`}
      >
        <DetailsCard
          role={role as string}
          courseId={courseId as string}
          course={course}
          courseDetails={courseDetails}
          description={courseDetails.description}
          isPurchased={isPurchased}
          isBookmarked={isBookmarked}
          onBookmark={handleBookmark}
          onBuyCourse={handleBuyCourse}
          isBookmarking={bookmarkMutation.isPending}
          isBuying={buyCourseMutation.isPending}
          isCourseOwner={isCourseOwner}
        >
          <div id="course-content">
            <ContentCard
              embedded
              courseContents={courseDetails.courseContents}
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              isPurchased={isPurchased || isCounselor}
              userRole={role as string}
            />
          </div>
        </DetailsCard>
      </div>

      {/* Course Owner Controls */}
      {isCourseOwner && (
        <div className="max-w-7xl mx-auto mt-4 md:mt-6 px-4 md:px-0">
          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-3 flex-wrap items-center justify-end">
            {/* Edit Button */}
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-2 bg-white border-2 border-[#13097D] text-[#13097D] rounded-lg text-xs md:text-base font-semibold hover:bg-[#13097D] hover:text-white transition-all cursor-pointer"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
              Edit
            </button>

            <button
              onClick={() => setShowContentManager(true)}
              className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-2 bg-[#13097D] text-white rounded-lg text-xs md:text-base font-semibold hover:bg-opacity-90 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Manage Content</span>
              <span className="sm:hidden">Manage</span>
            </button>

            {/* Publish/Unpublish Button */}
            {courseDetails.isPublished ? (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-2 bg-amber-500 text-white rounded-lg text-xs md:text-base font-semibold hover:bg-amber-600 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                Unpublish
              </button>
            ) : (
              <button
                onClick={handlePublishCourse}
                disabled={isPublishing}
                className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-base font-semibold hover:bg-green-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4 md:w-5 md:h-5" />
                )}
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-10">
        <CourseReviewsCard
          courseId={courseId as string}
          isPurchased={isPurchased || isCounselor}
          role={role as 'user' | 'student' | 'counselor'}
          reviews={courseDetails.counsellorCourseReviewResponse}
          rating={courseDetails.rating}
          onReviewSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
          }}
        />

        {!isCourseOwner && courseId && (
          <RecommendedCoursesSection
            currentCourseId={courseId}
            category={courseDetails.category}
          />
        )}
      </div>

      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${addFundsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <AddFundsPanel
          isOpen={addFundsOpen}
          onClose={() => setAddFundsOpen(false)}
          balance={user?.walletAmount ?? 0}
          onAddMoney={async (amount) => {
            if (!amount || amount <= 0) return;
            try {
              const order = await startRecharge(user?.userName ?? '', amount);
              const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: "ProCounsel Wallet",
                description: "Wallet Recharge",
                prefill: {
                  contact: formatPhoneForRazorpay(getLoggedInPhone()),
                  email: user?.email || "",
                  name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
                },
                notes: { userId: user?.userName },
                handler: async function () {
                  toast.success("Payment successful. Your balance will be updated shortly.");
                  queryClient.invalidateQueries({ queryKey: ['user', userId] });
                  queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
                  setAddFundsOpen(false);
                },
                modal: {
                  ondismiss: function () {
                    console.log('Razorpay modal dismissed.');
                  }
                },
                theme: { color: "#3399cc" },
              };
              const Rz = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
              const rzp = new Rz(options);
              rzp.open();
            } catch (error) {
              console.error("Failed to initiate payment.", error);
              toast.error("Could not start the payment process.");
            }
          }}
        />
      </div>

      {/* Edit Course Modal */}
      {showEditModal && courseDetails && (
        <EditCourseModal
          courseDetails={courseDetails}
          counsellorId={userId as string}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
          }}
        />
      )}

      {/* Manage Content Modal */}
      {showContentManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3 md:p-6 border-b border-gray-200">
              <h2 className="text-base md:text-2xl font-bold text-[#343C6A]">Manage Course Content</h2>
              <button onClick={() => setShowContentManager(false)} className="hover:text-gray-700 transition cursor-pointer">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6">
              <Step3Card
                courseId={courseId || ''}
              />
            </div>

            <div className="p-3 md:p-6 border-t border-gray-200 flex justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId, userId, role] });
                  setShowContentManager(false);
                }}
                className="px-4 py-1.5 md:px-6 md:py-2 bg-[#13097D] text-white rounded-lg text-sm md:text-base font-semibold hover:bg-opacity-90 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-semibold text-[#242645] mb-4">
              Unpublish Course
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unpublish "<strong>{courseDetails?.courseName}</strong>"? The course will no longer be visible to users but your content will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-[#242645] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Unpublishing..." : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
