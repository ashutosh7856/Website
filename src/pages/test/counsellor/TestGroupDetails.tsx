import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Star, Users, Clock, FileText, Globe, GlobeLock, Pencil, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getTestGroupById, getAllTestSeriesOfTestGroupForCounselor, publishUnpublishTestGroup, deleteTestSeries } from "@/api/testGroup";
import type { TestGroup, TestSeries } from "@/types/testGroup";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";

interface Review {
  reviewId: string;
  testGroupId: string;
  userId: string;
  userFullName: string;
  photoUrl: string | null;
  rating: number;
  reviewText: string;
  createdAt: { seconds: number; nanos: number };
  updatedAt: { seconds: number; nanos: number };
}

interface AssociatedCourse {
  courseId: string;
  courseName: string;
  courseBannerUrl: string;
  coursePrice: number;
  discountedCoursePrice: number;
}

export function TestGroupDetails() {
  const navigate = useNavigate();
  const { testGroupId } = useParams();
  const [testGroup, setTestGroup] = useState<TestGroup | null>(null);
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [associatedCourse, setAssociatedCourse] = useState<AssociatedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const counsellorId = localStorage.getItem("phone") || "";
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });

  useEffect(() => {
    if (testGroupId) {
      fetchData();
    }
  }, [testGroupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch test group details
      const groupResponse = await getTestGroupById(counsellorId, testGroupId!);
      if (groupResponse.status && groupResponse.data?.testGroup) {
        setTestGroup(groupResponse.data.testGroup);
        // Store reviews from API response
        if (groupResponse.data.reviews) {
          setReviews(groupResponse.data.reviews);
        }
        // Store associated course if available
        if (groupResponse.data.associatedCourse) {
          setAssociatedCourse(groupResponse.data.associatedCourse);
        }
      }

      // Fetch test series list
      const seriesResponse = await getAllTestSeriesOfTestGroupForCounselor(counsellorId, testGroupId!);
      if (seriesResponse.status && seriesResponse.data) {
        setTestSeriesList(seriesResponse.data);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!testGroup) return;
    try {
      const response = await publishUnpublishTestGroup(
        counsellorId,
        testGroupId!,
        !testGroup.published
      );
      if (response.status) {
        toast.success(testGroup.published ? "Test group unpublished" : "Test group published");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update publish status");
      console.error(error);
    }
  };

  const handleDeleteTest = async () => {
    try {
      await deleteTestSeries(counsellorId, deleteModal.id);
      toast.success("Test series deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete test series");
      console.error(error);
    }
  };

  /* const _handlePublishTest = async (testSeriesId: string, currentStatus: boolean) => {
    try {
      await publishTestSeries(counsellorId, testSeriesId, !currentStatus);
      toast.success(currentStatus ? "Test unpublished" : "Test published");
      fetchData();
    } catch (error) {
      toast.error("Failed to update test status");
      console.error(error);
    }
  }; */

  /* const _formatDate = (timestamp: { seconds: number; nanos: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }; */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[--btn-primary] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-(--text-muted)">Loading...</p>
        </div>
      </div>
    );
  }

  if (!testGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-(--text-muted)">Test group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-4 pb-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/counsellor-dashboard", {
            state: { activeTab: "courses" },
            replace: true
          })}
          className="flex items-center gap-2 text-(--text-app-primary) hover:text-(--btn-primary) transition-colors font-medium mb-4 cursor-pointer"
        >
          <ArrowLeft size={20} />
          Back to Test Groups
        </button>

        {/* Test Group Header - Compact Design */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            {/* Compact Banner */}
            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
              {testGroup.bannerImagUrl ? (
                <img loading="lazy" decoding="async"
                  src={testGroup.bannerImagUrl}
                  alt={testGroup.testGroupName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-4xl font-bold opacity-50">
                    {testGroup.testGroupName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold text-(--text-app-primary)">
                        {testGroup.testGroupName}
                      </h1>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${testGroup.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {testGroup.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm text-(--text-muted) line-clamp-2">
                      {testGroup.testGroupDescription || "No description provided"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/counselor/test-groups/edit/${testGroupId}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm cursor-pointer"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={handlePublishToggle}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm cursor-pointer ${testGroup.published
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                    >
                      {testGroup.published ? <GlobeLock size={14} /> : <Globe size={14} />}
                      {testGroup.published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-(--text-muted)">
                <div className="flex items-center gap-1">
                  <FileText size={14} className="text-gray-500" />
                  <span>{testSeriesList.length} Tests</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-gray-500" />
                  <span>{testGroup.soldCount || 0} Sold</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{testGroup.priceType === "FREE" ? "Free" : `₹${testGroup.price}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" />
                  <span>{testGroup.rating ? `${testGroup.rating.toFixed(1)} (${testGroup.ratingCount || 0})` : "No ratings"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{testGroup.testType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Series Section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-(--text-app-primary)">Test Series</h2>
              <p className="text-(--text-muted) text-xs mt-0.5">
                Manage test series in this group
              </p>
            </div>
            <button
              onClick={() => navigate(`/counselor/test-groups/${testGroupId}/create-test`)}
              className="flex items-center gap-2 px-4 py-2 bg-(--btn-primary) text-white rounded-lg font-medium hover:opacity-90 cursor-pointer text-sm"
            >
              <Plus size={18} />
              Create Test
            </button>
          </div>

          {testSeriesList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <FileText size={40} className="mx-auto mb-3 text-gray-400" />
              <h3 className="text-base font-semibold text-(--text-app-primary) mb-2">
                No test series yet
              </h3>
              <p className="text-(--text-muted) text-sm mb-4">
                Create your first test series in this group
              </p>
              <button
                onClick={() => navigate(`/counselor/test-groups/${testGroupId}/create-test`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-(--btn-primary) text-white rounded-lg font-medium hover:opacity-90 cursor-pointer text-sm"
              >
                <Plus size={18} />
                Create Test
              </button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {testSeriesList.map((test) => (
                <div
                  key={test.testSeriesId}
                  onClick={() => navigate(`/add-question/${test.testSeriesId}`)}
                  className="relative flex flex-col gap-2 w-full h-[260px] p-3 border border-[#efefef] rounded-xl bg-white hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-100">
                    {test.bannerImagUrl ? (
                      <img loading="lazy" decoding="async"
                        src={test.bannerImagUrl}
                        alt={test.testName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${test.published
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                          }`}
                      >
                        {test.published ? "Live" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Category/Stream */}
                  <p className="text-[10px] font-medium text-[#718EBF] uppercase">
                    {test.stream || "Test Series"}
                  </p>

                  {/* Title */}
                  <h3
                    className="text-[#242645] font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-[--btn-primary] transition-colors"
                    title={test.testName}
                  >
                    {test.testName}
                  </h3>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-600 mb-1">
                    <div className="flex items-center gap-0.5">
                      <Clock size={10} />
                      <span>{test.durationInMinutes}m</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <FileText size={10} />
                      <span>{test.listOfSection.reduce((sum, s) => sum + s.totalQuestionsSupposedToBeAdded, 0)}Q</span>
                    </div>
                  </div>

                  {/* Action Buttons - Show on Hover */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-white via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/add-question/${test.testSeriesId}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors text-[10px] font-medium cursor-pointer"
                        title="Add Questions"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/create-test`, { state: { editMode: true, testData: test, testGroupId: testGroupId } });
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-[10px] font-medium cursor-pointer"
                        title="Edit Test"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, id: test.testSeriesId, name: test.testName });
                        }}
                        className="flex-1 flex items-center justify-center py-1.5 px-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Associated Course Section */}
        {testGroup.testType === "COURSE_ATTACHED" && associatedCourse && (
          <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
            <h2 className="text-lg font-bold text-(--text-app-primary) mb-3">Associated Course</h2>
            <div
              onClick={() => navigate(`/courses/detail/${associatedCourse.courseId}/counselor`, {
                state: { from: 'test-group' }
              })}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Course Banner */}
              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {associatedCourse.courseBannerUrl ? (
                  <img loading="lazy" decoding="async"
                    src={associatedCourse.courseBannerUrl}
                    alt={associatedCourse.courseName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <BookOpen className="w-6 h-6 text-blue-200" />
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm truncate">
                  {associatedCourse.courseName}
                </h3>
                <div className="flex items-center gap-2">
                  {associatedCourse.discountedCoursePrice > 0 && associatedCourse.discountedCoursePrice < associatedCourse.coursePrice ? (
                    <>
                      <span className="text-base font-bold text-green-600">
                        ₹{Math.floor(associatedCourse.discountedCoursePrice)}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ₹{Math.floor(associatedCourse.coursePrice)}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-bold text-gray-900">
                      ₹{Math.floor(associatedCourse.coursePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
          <h2 className="text-lg font-bold text-(--text-app-primary) mb-4">Reviews ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review) => (
                <div
                  key={review.reviewId}
                  className="bg-white rounded-xl p-4 flex flex-col gap-3 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {/* User Photo with Fallback */}
                    {review.photoUrl ? (
                      <img loading="lazy" decoding="async"
                        src={review.photoUrl}
                        alt={review.userFullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold text-lg">
                        {review.userFullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-(--text-app-primary)">
                        {review.userFullName || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`w-4 h-4 ${starIndex < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-(--text-muted)">
                    {review.reviewText || 'No review text provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Star size={40} className="mx-auto mb-3 text-gray-400" />
              <h3 className="text-base font-semibold text-(--text-app-primary) mb-1">No Reviews Yet</h3>
              <p className="text-(--text-muted) text-sm">
                This test group hasn't received any reviews yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteTest}
        title="Delete Test Series?"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
