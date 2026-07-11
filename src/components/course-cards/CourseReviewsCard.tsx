import { Star, ChevronRight, Info, X, ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { addCourseReview, updateCourseReview, deleteCourseReview } from '@/api/course';
import { useAuthStore } from '@/store/AuthStore';
import toast from 'react-hot-toast';
import EditProfileModal from '@/components/student-dashboard/EditProfileModal';
import { updateUserProfile } from '@/api/user';

interface CourseReview {
  reviewId: string;
  userId: string;
  userFullName: string;
  userPhotoUrl?: string;
  rating: number;
  reviewText: string;
  timestamp: {
    seconds: number;
    nanos: number;
  };
  helpful: number;
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

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex);
    }
  };

  return (
    <div
      className={`flex gap-3 ${interactive ? 'cursor-pointer' : ''}`}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={starIndex}
          className={`w-6 h-6 transition-colors ${
            starIndex <= displayRating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
          onMouseEnter={() => handleMouseEnter(starIndex)}
          onClick={() => handleClick(starIndex)}
        />
      ))}
    </div>
  );
};

const formatTimeAgo = (timestamp: { seconds: number; nanos: number }) => {
  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const years = Math.floor(diffInSeconds / 31536000);
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(diffInSeconds / 2592000);
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;

  const days = Math.floor(diffInSeconds / 86400);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(diffInSeconds / 3600);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  return 'just now';
};



interface CourseReviewsCardProps {
  courseId: string;
  isPurchased?: boolean;
  role?: 'user'| 'student' | 'counselor';
  reviews?: any[];
  rating?: number | null;
  onReviewSubmitted?: () => void;
}

export default function CourseReviewsCard({ 
  courseId,
  isPurchased = false,
  role,
  reviews: propReviews = [],
  rating: courseRating,
  onReviewSubmitted
}: CourseReviewsCardProps) {
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const reviewsPerPage = 10;

  const reviews = propReviews.length > 0 ? propReviews : [];
  const { userId, user, refreshUser } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingReviewSubmission, setPendingReviewSubmission] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);

  // Check if user already reviewed this course
  useEffect(() => {
    if (userId && reviews.length > 0) {
      const existingReview = reviews.find(r => r.userId === userId);
      if (existingReview) {
        setUserHasReviewed(true);
        setUserReviewId(existingReview.reviewId);
        setUserRating(existingReview.rating);
        setReviewText(existingReview.reviewText);
      }
    }
  }, [userId, reviews]);

  const handleSubmitReview = async () => {
    // Debounce to prevent double-clicks
    if (isCheckingName || isSubmitting) return;
    
    // Check if user has firstName before allowing review submission
    if (!user?.firstName?.trim()) {
      setIsCheckingName(true);
      setPendingReviewSubmission(true);
      setIsProfileModalOpen(true);
      // Reset after delay to prevent accidental double-opens
      setTimeout(() => setIsCheckingName(false), 1000);
      return;
    }
    
    // Prevent duplicate reviews
    if (userHasReviewed && !isEditMode) {
      toast.error('You have already reviewed this course');
      return;
    }

    if (userRating === 0) {
      toast.error('Please select a rating (1-5 stars)');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review before submitting');
      return;
    }

    if (!userId) {
      toast.error('Please sign in to submit a review');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && userReviewId) {
        // Update existing review
        await updateCourseReview({
          reviewId: userReviewId,
          userId,
          courseId,
          rating: userRating,
          reviewText: reviewText.trim(),
        });
        toast.success('Review updated successfully!');
        setIsEditMode(false);
      } else {
        // Add new review
        await addCourseReview({
          userId,
          courseId,
          rating: userRating,
          reviewText: reviewText.trim(),
        });
        toast.success('Review submitted successfully!');
        setUserHasReviewed(true);
      }
      
      // Refresh reviews
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error((error as Error).message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async (updatedData: { firstName: string; lastName: string; email: string }) => {
    if (!userId) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      await updateUserProfile(userId, updatedData, token);
      await refreshUser(true);
      toast.success('Profile updated successfully!');
      setIsProfileModalOpen(false);
      
      // If pending review submission and user filled the name, proceed with it
      if (pendingReviewSubmission && updatedData.firstName?.trim()) {
        setPendingReviewSubmission(false);
        setIsCheckingName(false);
        // Small delay to ensure state is updated
        setTimeout(() => handleSubmitReview(), 100);
      } else {
        // If user didn't fill name, clear pending states
        setPendingReviewSubmission(false);
        setIsCheckingName(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setIsCheckingName(false);
      throw error;
    }
  };

  const handleEditReview = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Restore original values
    const existingReview = reviews.find(r => r.userId === userId);
    if (existingReview) {
      setUserRating(existingReview.rating);
      setReviewText(existingReview.reviewText);
    }
    setIsEditMode(false);
  };

  const handleDeleteReview = async () => {
    if (!userReviewId || !userId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete your review? This action cannot be undone.');
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await deleteCourseReview(userReviewId, userId);
      toast.success('Review deleted successfully!');
      setUserHasReviewed(false);
      setUserReviewId(null);
      setUserRating(0);
      setReviewText('');
      setIsEditMode(false);
      
      // Refresh reviews
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error((error as Error).message || 'Failed to delete review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewForm = () => {
    // Counsellors cannot write reviews
    if (role === 'counselor') {
      return (
        <div className="mt-4 p-3 md:p-4 bg-amber-50 rounded-lg flex items-center gap-2 md:gap-3">
          <Info className="w-4 h-4 md:w-6 md:h-6 text-amber-500 shrink-0" />
          <p className="text-xs md:text-sm text-amber-800">
            Counsellors cannot write reviews for courses.
          </p>
        </div>
      );
    }

    if (!isPurchased) {
      return (
        <div className="mt-4 p-3 md:p-4 bg-blue-50 rounded-lg flex items-center gap-2 md:gap-3">
          <Info className="w-4 h-4 md:w-6 md:h-6 text-blue-500 shrink-0" />
          <p className="text-xs md:text-sm text-blue-800">
            You must purchase this course to write a review.
          </p>
        </div>
      );
    }

    if (userHasReviewed && !isEditMode) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <div className="p-3 md:p-4 bg-green-50 rounded-lg flex items-center justify-between gap-2 md:gap-3 mb-2">
            <div className="flex items-center gap-2 md:gap-3">
              <Info className="w-4 h-4 md:w-6 md:h-6 text-green-500 shrink-0" />
              <p className="text-xs md:text-sm text-green-800">
                You have already reviewed this course.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEditReview}
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
          <p className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] text-gray-800">
            {reviewText}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 flex flex-col gap-4">
        <StarRating
          rating={userRating}
          interactive={true}
          onRatingChange={setUserRating}
        />
        <textarea
          className="w-full p-2 md:p-3 text-xs md:text-base border border-gray-300 rounded-lg transition focus:ring-2 focus:ring-[#13097D] focus:border-transparent"
          rows={4}
          placeholder="Share your experience with this course..."
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
            {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Review' : 'Submit Review')}
          </button>
          {isEditMode && (
            <button
              className="px-4 md:px-6 py-1.5 md:py-2 bg-gray-200 text-gray-700 text-xs md:text-base font-semibold rounded-lg hover:cursor-pointer hover:bg-gray-300 transition"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const displayedReviews = reviews.slice(0, 5);
  
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

  const renderReviewItem = (review: CourseReview, index: number, showDivider: boolean) => (
    <React.Fragment key={review.reviewId}>
      {showDivider && index > 0 && <hr className="my-4 border-gray-200" />}
      <div className="py-2">
        <div className="flex items-start gap-2 md:gap-3">
          <img loading="lazy" decoding="async" 
            src={review.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userFullName)}&background=13097D&color=fff&size=128`} 
            alt={review.userFullName} 
            className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover shrink-0 border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-1 md:mb-2">
              <h4 className="font-semibold text-[#343C6A] text-xs md:text-base">
                {review.userFullName}
              </h4>
              <p className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(review.timestamp)}</p>
            </div>
            <StarRating rating={review.rating} />
            <p className="text-[#232323] text-xs md:text-sm font-normal mt-1 md:mt-2 leading-relaxed">{review.reviewText}</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );

  // Calculate average rating
  const averageRating = courseRating !== null && courseRating !== undefined
    ? courseRating.toFixed(1)
    : reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Rating Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm md:text-xl font-bold text-[#343C6A] mb-4">Course Rating</h2>
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
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-600 w-8 md:w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Section - Hidden for counsellors */}
      {role !== 'counselor' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm md:text-xl font-bold text-[#343C6A]">
            {userHasReviewed && !isEditMode ? 'Your Review' : isEditMode ? 'Edit Your Review' : 'Write a Review'}
          </h2>
          {renderReviewForm()}
        </div>
      )}

      {/* Recent Reviews */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm md:text-xl font-bold text-[#343C6A]">Recent Reviews</h2>
          <button 
            onClick={() => setShowAllReviewsModal(true)}
            className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#343C6A] hover:underline hover:cursor-pointer"
          >
            See All <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>

        <div className="mt-4">
          {displayedReviews && displayedReviews.length > 0 ? (
            displayedReviews.map((review, index) => renderReviewItem(review, index, true))
          ) : (
            <p className="text-xs md:text-sm text-gray-500 mt-4">
              No reviews for this course yet. Be the first to review!
            </p>
          )}
        </div>
      </div>

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowAllReviewsModal(false);
            setCurrentPage(1);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-xl md:text-2xl font-bold text-[#343C6A]">All Reviews ({reviews.length})</h2>
              <button 
                onClick={() => {
                  setShowAllReviewsModal(false);
                  setCurrentPage(1);
                }}
                className="text-gray-500 hover:text-gray-700 transition hover:cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {paginatedReviews
                .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                .map((review, index) => renderReviewItem(review, index, true))
              }
            </div>

            {/* Modal Footer - Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + reviewsPerPage, reviews.length)} of {reviews.length} reviews
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? 'bg-[#13097D] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {user && (
        <EditProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
          onUploadComplete={() => refreshUser(true)}
          requireNameOnly={true}
        />
      )}
    </div>
  );
}