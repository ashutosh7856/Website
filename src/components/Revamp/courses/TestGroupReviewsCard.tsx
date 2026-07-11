import { Star, Edit2, Trash2, Info } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  addReviewToTestGroup,
  deleteReviewFromTestGroup,
  updateReviewToTestGroup,
} from "@/api/testGroup";
import { useAuthStore } from "@/store/AuthStore";

interface TestGroupReview {
  reviewId: string;
  userId: string;
  userFullName?: string;
  userPhotoUrl?: string;
  rating: number;
  reviewText: string;
  createdAt?: { seconds: number; nanos: number };
  timestamp?: { seconds: number; nanos: number };
}

interface TestGroupReviewsCardProps {
  testGroupId: string;
  isPurchased?: boolean;
  role?: "user" | "student" | "counselor";
  reviews?: TestGroupReview[];
  rating?: number | null;
  onReviewSubmitted?: () => void;
}

const StarRating = ({
  rating,
  interactive = false,
  onRatingChange,
}: {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  return (
    <div
      className={`flex gap-3 ${interactive ? "cursor-pointer" : ""}`}
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={starIndex}
          className={`w-6 h-6 transition-colors ${
            starIndex <= displayRating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
          onMouseEnter={() => interactive && setHoverRating(starIndex)}
          onClick={() => interactive && onRatingChange?.(starIndex)}
        />
      ))}
    </div>
  );
};

const getReviewTimestamp = (review: TestGroupReview) => review.createdAt ?? review.timestamp;

const formatTimeAgo = (review: TestGroupReview) => {
  const ts = getReviewTimestamp(review);
  if (!ts?.seconds) return "just now";

  const date = new Date(ts.seconds * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const years = Math.floor(diffInSeconds / 31536000);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;

  const months = Math.floor(diffInSeconds / 2592000);
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;

  const days = Math.floor(diffInSeconds / 86400);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;

  const hours = Math.floor(diffInSeconds / 3600);
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  return "just now";
};

export default function TestGroupReviewsCard({
  testGroupId,
  isPurchased = false,
  role,
  reviews: propReviews = [],
  rating,
  onReviewSubmitted,
}: TestGroupReviewsCardProps) {
  const { userId } = useAuthStore();

  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(2);

  const reviews = propReviews || [];

  useEffect(() => {
    if (userId && reviews.length > 0) {
      const existingReview = reviews.find((r) => r.userId === userId);
      if (existingReview) {
        setUserHasReviewed(true);
        setUserReviewId(existingReview.reviewId);
        setUserRating(existingReview.rating);
        setReviewText(existingReview.reviewText);
      } else {
        setUserHasReviewed(false);
        setUserReviewId(null);
        setUserRating(0);
        setReviewText("");
      }
    }
  }, [userId, reviews]);

  useEffect(() => {
    setVisibleReviewsCount(2);
  }, [testGroupId]);

  const handleSubmitReview = async () => {
    if (isSubmitting) return;

    if (userHasReviewed && !isEditMode) {
      toast.error("You have already reviewed this test group");
      return;
    }

    if (userRating === 0) {
      toast.error("Please select a rating (1-5 stars)");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write a review before submitting");
      return;
    }

    if (!userId) {
      toast.error("Please sign in to submit a review");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && userReviewId) {
        const response = await updateReviewToTestGroup(
          userId,
          userReviewId,
          testGroupId,
          userRating,
          reviewText.trim()
        );

        if (response?.status) {
          toast.success("Review updated successfully");
          setIsEditMode(false);
        } else {
          throw new Error(response?.message || "Failed to update review");
        }
      } else {
        const response = await addReviewToTestGroup(
          userId,
          testGroupId,
          userRating,
          reviewText.trim()
        );

        if (response?.status) {
          toast.success("Review submitted successfully");
          setUserHasReviewed(true);
        } else {
          throw new Error(response?.message || "Failed to submit review");
        }
      }

      onReviewSubmitted?.();
    } catch (error) {
      console.error("Failed to submit test group review:", error);
      toast.error((error as Error).message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReviewId || !userId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete your review?");
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      const response = await deleteReviewFromTestGroup(userId, userReviewId, testGroupId);
      if (response?.status) {
        toast.success("Review deleted successfully");
        setUserHasReviewed(false);
        setUserReviewId(null);
        setUserRating(0);
        setReviewText("");
        setIsEditMode(false);
        onReviewSubmitted?.();
      } else {
        throw new Error(response?.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error((error as Error).message || "Failed to delete review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating =
    rating !== null && rating !== undefined
      ? rating.toFixed(1)
      : reviews.length > 0
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
        percentage:
          reviews.length > 0
            ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
            : 0,
      })),
    [reviews]
  );

  const displayedReviews = reviews.slice(0, visibleReviewsCount);
  const hasMoreReviews = visibleReviewsCount < reviews.length;

  const renderReviewForm = () => {
    if (role === "counselor") {
      return (
        <div className="mt-4 p-3 md:p-4 bg-amber-50 rounded-lg flex items-center gap-2 md:gap-3">
          <Info className="w-4 h-4 md:w-6 md:h-6 text-amber-500 shrink-0" />
          <p className="text-xs md:text-sm text-amber-800">Counsellors cannot write reviews for test groups.</p>
        </div>
      );
    }

    if (!isPurchased) {
      return (
        <div className="mt-4 p-3 md:p-4 bg-blue-50 rounded-lg flex items-center gap-2 md:gap-3">
          <Info className="w-4 h-4 md:w-6 md:h-6 text-blue-500 shrink-0" />
          <p className="text-xs md:text-sm text-blue-800">You must buy this test group to write a review.</p>
        </div>
      );
    }

    if (userHasReviewed && !isEditMode) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <div className="p-3 md:p-4 bg-green-50 rounded-lg flex items-center justify-between gap-2 md:gap-3 mb-2">
            <div className="flex items-center gap-2 md:gap-3">
              <Info className="w-4 h-4 md:w-6 md:h-6 text-green-500 shrink-0" />
              <p className="text-xs md:text-sm text-green-800">You have already reviewed this test group.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-blue-600 transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-red-500 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
          <StarRating rating={userRating} interactive={false} />
          <p className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] text-gray-800">{reviewText}</p>
        </div>
      );
    }

    return (
      <div className="mt-4 flex flex-col gap-4">
        <StarRating rating={userRating} interactive={true} onRatingChange={setUserRating} />
        <textarea
          className="w-full p-2 md:p-3 text-xs md:text-base border border-gray-300 rounded-lg transition focus:ring-2 focus:ring-[#13097D] focus:border-transparent"
          rows={4}
          placeholder="Share your experience with this test group..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex gap-2">
          <button
            className="px-4 md:px-6 py-1.5 md:py-2 bg-[#13097D] text-white text-xs md:text-base font-semibold rounded-lg hover:cursor-pointer hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditMode ? "Updating..." : "Submitting...") : isEditMode ? "Update Review" : "Submit Review"}
          </button>
          {isEditMode && (
            <button
              className="px-4 md:px-6 py-1.5 md:py-2 bg-gray-200 text-gray-700 text-xs md:text-base font-semibold rounded-lg hover:cursor-pointer hover:bg-gray-300 transition"
              onClick={() => {
                const existingReview = reviews.find((r) => r.userId === userId);
                if (existingReview) {
                  setUserRating(existingReview.rating);
                  setReviewText(existingReview.reviewText);
                }
                setIsEditMode(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm md:text-xl font-bold text-[#343C6A] mb-4">Test Group Rating</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-linear-to-br from-[#13097D] to-[#1a0fa3] rounded-xl text-white">
            <div className="text-3xl md:text-5xl font-bold mb-2">{averageRating}</div>
            <StarRating rating={parseFloat(averageRating)} />
            <p className="text-xs md:text-sm mt-2 opacity-90">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1 w-12 md:w-16">
                  <span className="text-xs md:text-sm font-medium text-gray-700">{star}</span>
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-xs md:text-sm text-gray-600 w-8 md:w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {role !== "counselor" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm md:text-xl font-bold text-[#343C6A]">
            {userHasReviewed && !isEditMode ? "Your Review" : isEditMode ? "Edit Your Review" : "Write a Review"}
          </h2>
          {renderReviewForm()}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm md:text-xl font-bold text-[#343C6A]">Recent Reviews</h2>
        </div>

        <div className="mt-4">
          {displayedReviews.length > 0 ? (
            displayedReviews.map((review, index) => (
              <React.Fragment key={review.reviewId}>
                {index > 0 && <hr className="my-4 border-gray-200" />}
                <div className="py-2">
                  <div className="flex items-start gap-2 md:gap-3">
                    <img loading="lazy" decoding="async"
                      src={review.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userFullName || "Student")}&background=13097D&color=fff&size=128`}
                      alt={review.userFullName || "Student"}
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover shrink-0 border-2 border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1 md:mb-2">
                        <h4 className="font-semibold text-[#343C6A] text-xs md:text-base">{review.userFullName || "Student"}</h4>
                        <p className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(review)}</p>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-[#232323] text-xs md:text-sm font-normal mt-1 md:mt-2 leading-relaxed">{review.reviewText}</p>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <p className="text-xs md:text-sm text-gray-500 mt-4">No reviews for this test group yet. Be the first to review!</p>
          )}

          {hasMoreReviews && (
            <button
              onClick={() =>
                setVisibleReviewsCount((prev) => Math.min(prev + 5, reviews.length))
              }
              className="mt-4 text-sm font-semibold text-[#0E1629] hover:underline"
            >
              See more reviews
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
