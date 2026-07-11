import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, FileText, Star, ShoppingCart, Bookmark, Lock, Loader2, Users, ArrowLeft, Trash2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import {
  getTestGroupByIdForUser,
  buyTestGroup,
  bookmarkTestGroup,
  addReviewToTestGroup,
  updateReviewToTestGroup,
  deleteReviewFromTestGroup,
} from "@/api/testGroup";
import { useAuthStore } from "@/store/AuthStore";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import AddFundsPanel from "@/components/student-dashboard/AddFundsPanel";

declare global {
  interface Window {
    Razorpay: unknown;
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

interface TestSeries {
  testSeriesId: string;
  counsellorId: string;
  testName: string;
  testDescription: string;
  bannerImagUrl: string | null;
  stream: string;
  durationInMinutes: number;
  pointsForCorrectAnswer: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  listOfSection: Array<{
    sectionName: string;
    totalQuestionsSupposedToBeAdded: number;
    totalQuestionsAdded: number;
  }>;
}

interface Review {
  reviewId: string;
  userId: string;
  userFullName?: string;
  rating: number;
  reviewText: string;
  createdAt: { seconds: number; nanos: number };
}

interface TestGroupData {
  testGroup: {
    testGroupId: string;
    testGroupName: string;
    testGroupDescription: string | null;
    bannerImagUrl: string | null;
    priceType: string;
    price: number;
    rating: number | null;
    ratingCount: number | null;
    soldCount: number;
    published: boolean;
    testType: string;
  };
  attachedTests: TestSeries[];
  reviews: Review[];
  bookmarked: boolean;
  bought: boolean;
  associatedCourse?: {
    courseId: string;
    courseName: string;
    courseBannerUrl: string;
    coursePrice: number;
    discountedCoursePrice: number;
  } | null;
}

export default function TestGroupDetailsPage() {
  const { testGroupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<TestGroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const pendingPurchaseRef = useRef(false);
  const userId = localStorage.getItem("phone") || "";
  const { user, refreshUser } = useAuthStore();
  const [visibleTests, setVisibleTests] = useState(3);
  const TESTS_PER_PAGE = 3;

  useEffect(() => {
    if (testGroupId && userId) {
      fetchTestGroupDetails();
    }
  }, [testGroupId, userId]);

  // Persist navigation context (fromDashboard, activeTab) to sessionStorage
  useEffect(() => {
    if (!testGroupId) return;
    const sessionKey = `test_group_back_context_${testGroupId}`;

    // If we have state, save it
    if (location.state?.fromDashboard) {
      const context = {
        fromDashboard: location.state.fromDashboard,
        activeTab: location.state.activeTab
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(context));
    } else {
      // If no state, try to restore from session
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        try {
          // const context = JSON.parse(saved);
          // We don't update location.state directly, but we'll use this in handleBack
        } catch (e) {
          console.error("Failed to parse navigation context", e);
        }
      }
    }
  }, [testGroupId, location.state]);

  const fetchTestGroupDetails = async () => {
    if (!userId || !testGroupId) return;

    try {
      setLoading(true);
      const response = await getTestGroupByIdForUser(userId, testGroupId);
      if (response.status && response.data) {
        setData(response.data);
        // Find user's own review
        const myReview = response.data.reviews.find((r: Review) => r.userId === userId);
        if (myReview) {
          setUserReview(myReview);
          setReviewRating(myReview.rating);
          setReviewText(myReview.reviewText);
        } else {
          setUserReview(null);
          setReviewRating(5);
          setReviewText("");
        }
      }
    } catch (error) {
      console.error("Failed to fetch test group details:", error);
      toast.error("Failed to load test group details");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const sessionKey = `test_group_back_context_${testGroupId}`;
    const saved = sessionStorage.getItem(sessionKey);
    let context = location.state;

    if (!context?.fromDashboard && saved) {
      try {
        context = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse stored context", e);
      }
    }

    if (context?.fromDashboard && context?.activeTab) {
      navigate('/dashboard-student', { state: { activeTab: context.activeTab } });
    } else {
      navigate(-1);
    }
  };

  const handleBuy = async () => {
    if (!testGroupId || !data) return;

    if (!userId) {
      toast.error("Please login to purchase");
      navigate("/");
      return;
    }

    // For free test groups, just enroll
    if (data.testGroup.priceType === "FREE" || data.testGroup.price === 0) {
      try {
        const counsellorId = data.attachedTests[0]?.counsellorId || '';

        if (!counsellorId) {
          toast.error("Unable to process enrollment");
          return;
        }

        const response = await buyTestGroup(
          userId,
          counsellorId,
          testGroupId,
          0,
          null
        );

        if (response.status) {
          toast.success("Successfully enrolled!");
          fetchTestGroupDetails();
        } else {
          toast.error(response.message || "Failed to enroll");
        }
      } catch (error) {
        console.error("Failed to enroll:", error);
        toast.error("Failed to enroll in test group");
      }
      return;
    }

    // For paid test groups - check wallet balance first
    const walletBalance = user?.walletAmount ?? 0;
    const price = data.testGroup.price;

    if (walletBalance < price) {
      toast.error("Insufficient balance. Please add funds to your wallet.");
      pendingPurchaseRef.current = true;
      setAddFundsOpen(true);
      return;
    }

    const counsellorId = data.attachedTests[0]?.counsellorId || '';

    if (!counsellorId) {
      toast.error("Unable to process purchase");
      return;
    }

    try {
      const response = await buyTestGroup(
        userId,
        counsellorId,
        testGroupId,
        data.testGroup.price,
        null
      );

      if (response.status) {
        toast.success("Test group purchased successfully!");
        pendingPurchaseRef.current = false;
        fetchTestGroupDetails();
      } else {
        if (response.message?.toLowerCase().includes("insufficient")) {
          toast.error("Insufficient balance. Please add funds to your wallet.");
          pendingPurchaseRef.current = true;
          setAddFundsOpen(true);
        } else {
          toast.error(response.message || "Failed to purchase");
        }
      }
    } catch (error) {
      console.error("Failed to buy:", error);
      toast.error("Failed to purchase test group");
    }
  };

  const handleRecharge = async (amount: number) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const order = await startRecharge(userId, amount);
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
        notes: { userId },
        handler: async function () {
          toast.success("Payment successful. Your balance will be updated shortly.");
          try {
            await refreshUser(true);
            setAddFundsOpen(false);
            // Auto-retry purchase if there was a pending purchase
            if (pendingPurchaseRef.current) {
              setTimeout(() => {
                handleBuy();
              }, 500);
            }
          } catch (err) {
            console.error('Failed to refresh user balance after payment.', err);
          }
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
      console.error("Failed to initiate Razorpay order.", error);
      toast.error("Could not start the payment process. Please try again later.");
    }
  };

  const handleBookmark = async () => {
    if (!userId || !testGroupId) return;

    const currentlyBookmarked = data?.bookmarked || false;

    try {
      const response = await bookmarkTestGroup(userId, testGroupId);
      console.log("Bookmark API response:", response);

      // Toggle the bookmark state regardless of response.status
      const newBookmarkedState = response.bookmarked !== undefined ? response.bookmarked : !currentlyBookmarked;
      setData(prev => prev ? { ...prev, bookmarked: newBookmarkedState } : null);
      toast.success(newBookmarkedState ? "Added to bookmarks" : "Removed from bookmarks");
    } catch (error) {
      console.error("Failed to bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleSubmitReview = async () => {
    if (!userId || !testGroupId) return;
    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    try {
      if (userReview) {
        // Validation: Check if anything changed
        if (reviewRating === userReview.rating && reviewText.trim() === userReview.reviewText) {
          toast.error("No changes made to the review");
          return;
        }

        // Update existing review
        const response = await updateReviewToTestGroup(
          userId,
          userReview.reviewId,
          testGroupId,
          reviewRating,
          reviewText.trim()
        );
        if (response.status) {
          toast.success("Review updated successfully!");
          setShowReviewModal(false);
          fetchTestGroupDetails();
        }
      } else {
        // Add new review
        const response = await addReviewToTestGroup(
          userId,
          testGroupId,
          reviewRating,
          reviewText.trim()
        );
        if (response.status) {
          toast.success("Review added successfully!");
          setShowReviewModal(false);
          fetchTestGroupDetails();
        }
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    }
  };

  const handleDeleteReview = async () => {
    if (!userId || !testGroupId || !userReview) return;

    try {
      const response = await deleteReviewFromTestGroup(
        userId,
        userReview.reviewId,
        testGroupId
      );
      if (response.status) {
        toast.success("Review deleted successfully");
        setShowDeleteConfirm(false);
        setShowReviewModal(false);
        setUserReview(null);
        setReviewRating(5);
        setReviewText("");
        fetchTestGroupDetails();
      } else {
        toast.error(response.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleTestSeriesClick = (testSeriesId: string) => {
    if (data?.bought) {
      navigate(`/test-info/${testSeriesId}`, { state: { testGroupId } });
    } else {
      toast.error("Please purchase this test group first");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Test group not found</p>
      </div>
    );
  }

  const { testGroup, attachedTests, reviews, bookmarked, bought } = data;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-4 pb-28 md:pb-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-32 lg:w-40 aspect-square md:h-auto flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden self-center md:self-start max-w-[120px] md:max-w-none">
                {testGroup.bannerImagUrl ? (
                  <img loading="lazy" decoding="async"
                    src={testGroup.bannerImagUrl}
                    alt={testGroup.testGroupName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-blue-200" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold uppercase tracking-wide">
                    {testGroup.testType}
                  </span>
                  {bought && (
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Enrolled
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-[#242645] mb-2 leading-tight">
                  {testGroup.testGroupName}
                </h1>

                {testGroup.testGroupDescription && (
                  <p className="text-gray-600 text-xs md:text-sm mb-4 line-clamp-3">
                    {testGroup.testGroupDescription}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-gray-900">{testGroup.rating?.toFixed(1) || "New"}</span>
                    <span>({testGroup.ratingCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{testGroup.soldCount} students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Series List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-bold text-[#242645]">Test Series</h2>
                <span className="text-xs md:text-sm text-gray-500">{attachedTests.length} Tests</span>
              </div>

              <div className="space-y-3">
                {attachedTests.slice(0, visibleTests).map((test) => {
                  const totalQuestions = test.listOfSection.reduce(
                    (sum, s) => sum + s.totalQuestionsSupposedToBeAdded,
                    0
                  );
                  const totalAdded = test.listOfSection.reduce(
                    (sum, s) => sum + s.totalQuestionsAdded,
                    0
                  );

                  return (
                    <div
                      key={test.testSeriesId}
                      onClick={() => handleTestSeriesClick(test.testSeriesId)}
                      className={`flex items-center p-3 rounded-xl border transition-all ${bought
                        ? "hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer border-gray-100"
                        : "border-gray-100 opacity-70 cursor-not-allowed"
                        }`}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3 md:mr-4">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 truncate pr-2 text-sm md:text-base">
                            {test.testName}
                          </h3>
                          {!bought && <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {test.durationInMinutes}m
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-gray-300"></span>
                            {totalAdded}/{totalQuestions} Qs
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {attachedTests.length > TESTS_PER_PAGE && (
                <div className="flex justify-center gap-3 mt-4">
                  {visibleTests < attachedTests.length && (
                    <button
                      onClick={() => setVisibleTests(prev => prev + TESTS_PER_PAGE)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-(--text-app-primary) rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                    >
                      <span>See More</span>
                      <ChevronDown size={16} />
                    </button>
                  )}
                  {visibleTests > TESTS_PER_PAGE && (
                    <button
                      onClick={() => setVisibleTests(TESTS_PER_PAGE)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-(--text-app-primary) rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                    >
                      <span>See Less</span>
                      <ChevronUp size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-base md:text-lg font-bold text-[#242645]">Student Reviews</h2>
                {bought && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs md:text-sm font-medium cursor-pointer"
                  >
                    {userReview ? "Edit" : "Write Review"}
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <Star className="w-8 h-8 md:w-10 md:h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.reviewId} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 md:w-3.5 md:h-3.5 ${i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {review.userId === userId ? "You" : (review.userFullName || "Student")}
                          </span>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{review.reviewText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Associated Course Section */}
            {testGroup.testType === "COURSE_ATTACHED" && data.associatedCourse && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 mt-6">
                <h2 className="text-base md:text-lg font-bold text-[#242645] mb-3">Associated Course</h2>
                <div
                  onClick={() => navigate(`/courses/detail/${data.associatedCourse!.courseId}/user`, {
                    state: { from: 'test-group' }
                  })}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Course Banner */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    {data.associatedCourse.courseBannerUrl ? (
                      <img loading="lazy" decoding="async"
                        src={data.associatedCourse.courseBannerUrl}
                        alt={data.associatedCourse.courseName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-200" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm truncate">
                      {data.associatedCourse.courseName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {data.associatedCourse.discountedCoursePrice > 0 && data.associatedCourse.discountedCoursePrice < data.associatedCourse.coursePrice ? (
                        <>
                          <span className="text-sm md:text-base font-bold text-green-600">
                            ₹{Math.floor(data.associatedCourse.discountedCoursePrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            ₹{Math.floor(data.associatedCourse.coursePrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base font-bold text-gray-900">
                          ₹{Math.floor(data.associatedCourse.coursePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar - Right Column - Hidden on Mobile, Fixed Bar used instead */}
          <div className="hidden md:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Total Price</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {testGroup.priceType === "FREE" ? "Free" : `₹${testGroup.price}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {!bought ? (
                    <button
                      onClick={handleBuy}
                      className="w-full py-3.5 bg-(--text-main) text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {testGroup.priceType === "FREE" ? (
                        <>
                          <BookOpen className="w-5 h-5" /> Enroll for Free
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" /> Buy Now
                        </>
                      )}
                    </button>
                  ) : (
                    <button disabled className="w-full py-3.5 bg-green-50 text-green-700 rounded-xl font-semibold flex items-center justify-center gap-2 border border-green-200">
                      <CheckCircle2 className="w-5 h-5" /> Enrolled
                    </button>
                  )}

                  <button
                    onClick={handleBookmark}
                    className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border ${bookmarked
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    {bookmarked ? "Bookmarked" : "Add to Bookmarks"}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">This test group includes:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{attachedTests.length} complete tests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-gray-400" />
                      <span>Performance analytics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Fixed Bottom Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total Price</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-[#242645]">
                  {testGroup.priceType === "FREE" ? "Free" : `₹${testGroup.price}`}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={handleBookmark}
                className={`p-3 rounded-xl border ${bookmarked
                  ? "bg-yellow-50 border-yellow-200 text-yellow-600"
                  : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
              >
                <Bookmark size={20} className={bookmarked ? "fill-current" : ""} />
              </button>

              {!bought ? (
                <button
                  onClick={handleBuy}
                  className="px-8 py-3 bg-(--text-main) text-white rounded-xl font-bold text-sm shadow-lg shadow-black/10 flex items-center gap-2"
                >
                  {testGroup.priceType === "FREE" ? "Enroll Free" : "Buy Now"}
                </button>
              ) : (
                <button disabled className="px-6 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm border border-green-200 flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Enrolled
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 md:p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg md:text-xl font-bold mb-4 text-[#242645]">
                {userReview ? "Edit Review" : "Write Review"}
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-700">How would you rate this test?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className="transition-transform hover:scale-110 cursor-pointer p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${rating <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">Your Experience</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none"
                  placeholder="Tell us what you liked or didn't like..."
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmitReview}
                  className="w-full py-3 bg-(--text-main) text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors cursor-pointer"
                >
                  {userReview ? "Update Review" : "Submit Review"}
                </button>

                {userReview && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete Review
                  </button>
                )}

                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 md:p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Review?</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete your review? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Panel */}
      <AddFundsPanel
        isOpen={addFundsOpen}
        onClose={() => {
          setAddFundsOpen(false);
          pendingPurchaseRef.current = false;
        }}
        balance={user?.walletAmount ?? 0}
        onAddMoney={handleRecharge}
      />
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
