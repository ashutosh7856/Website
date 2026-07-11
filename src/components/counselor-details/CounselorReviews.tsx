import { Star, ChevronRight, Info, X, ChevronLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { CounselorReview } from '@/types/counselorReview';
import toast from 'react-hot-toast';

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

interface CounselorReviewsProps {
  reviews: CounselorReview[];
  isSubscribed: boolean;
  counsellorId: string;
  onSubmitReview: (reviewText: string, rating: number) => Promise<void>;
  userReview: CounselorReview | null;
  onUpdateReview: (reviewText: string, rating: number) => Promise<void>;
}

export function CounselorReviews({ reviews,isSubscribed, onSubmitReview, userReview, onUpdateReview }: CounselorReviewsProps) {
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  
  useEffect(() => {
    if (userReview) {
      setUserRating(userReview.rating);
      setReviewText(userReview.reviewText);
    } else {
      setUserRating(0);
      setReviewText('');
    }
  }, [userReview]);
  const handleLocalSubmit = async () => {
    if (userRating === 0) {
      toast.error("Please select a rating (1-5 stars).");
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please write a review before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (userReview && isEditing) {
        await onUpdateReview(reviewText, userRating);
        setIsEditing(false);
      } else if (!userReview) {
        await onSubmitReview(reviewText, userRating);
      }
    } catch (error) {
      console.error("Submission failed in component:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userReview) {
      setUserRating(userReview.rating);
      setReviewText(userReview.reviewText);
    }
  };

  const renderReviewForm = () => {
    if (!isSubscribed) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
          <Info className="w-6 h-6 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-800">
            You must be subscribed to this counsellor to write a review.
          </p>
        </div>
      );
    }

    if (userReview && !isEditing) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <StarRating rating={userRating} interactive={false} />
          <p className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] text-gray-800">
            {reviewText}
          </p>
          <button
            className="self-start px-6 py-2 bg-[#13097D] text-white font-semibold rounded-lg hover:bg-gray-700 hover:cursor-pointer transition"
            onClick={() => setIsEditing(true)}
            disabled={isSubmitting}
          >
            Edit Review
          </button>
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
          className="w-full p-3 border border-gray-300 rounded-lg transition"
          rows={4}
          placeholder="Share your experience with this counsellor..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex flex-wrap gap-4 items-center">
          <button
            className="self-start px-6 py-2 bg-[#13097D] text-white font-semibold rounded-lg hover:bg-opacity-90 hover:cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLocalSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEditing ? "Updating..." : "Submitting...")
              : (isEditing ? "Update Review" : "Submit Review")
            }
          </button>
          {isEditing && (
            <button
              className="self-start px-6 py-2 bg-transparent text-gray-600 font-semibold rounded-lg hover:bg-gray-100 hover:cursor-pointer transition"
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
  
  const otherReviews = reviews.filter(review => {
    if (!userReview) return true;
    return review.reviewId !== userReview.reviewId;
  });

  const displayedReviews = otherReviews.slice(0, 5);
  
  const totalPages = Math.ceil(otherReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = otherReviews.slice(startIndex, startIndex + reviewsPerPage);

  const renderReviewItem = (review: CounselorReview, index: number, showDivider: boolean) => (
    <React.Fragment key={review.reviewId}>
      {showDivider && index > 0 && <hr className="my-4 border-gray-200" />}
      <div className="py-2">
        <div className="flex items-start gap-3">
          <img loading="lazy" decoding="async" 
            src={review.userPhotoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.userFullName || 'Procounsel User') + '&background=13097D&color=fff&size=128'} 
            alt={review.userFullName || 'Procounsel User'} 
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h4 className="font-semibold text-[#343C6A] text-base">
                {review.userFullName || 'Procounsel User'}
              </h4>
              <p className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(review.timestamp)}</p>
            </div>
            <StarRating rating={review.rating} />
            <p className="text-[#232323] text-sm font-normal mt-2 leading-relaxed">{review.reviewText}</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#343C6A]">
          {userReview ? "Your Review" : "Write a Review"}
        </h2>
        {renderReviewForm()}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#343C6A]">Recent Reviews</h2>
          <button 
            onClick={() => setShowAllReviewsModal(true)}
            className="flex items-center gap-1 text-sm font-semibold text-[#343C6A] hover:underline hover:cursor-pointer"
          >
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          {displayedReviews && displayedReviews.length > 0 ? (
            displayedReviews
              .map((review, index) => renderReviewItem(review, index, true))
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              {userReview && reviews.length > 0 ? "No other reviews yet." : "No reviews for this counsellor yet."}
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
              <h2 className="text-xl md:text-2xl font-bold text-[#343C6A]">All Reviews ({otherReviews.length})</h2>
              <button 
                onClick={() => {
                  setShowAllReviewsModal(false);
                  setCurrentPage(1);
                }}
                className="text-gray-500 hover:text-gray-700 hover:cursor-pointer transition"
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
                    Showing {startIndex + 1} to {Math.min(startIndex + reviewsPerPage, otherReviews.length)} of {otherReviews.length} reviews
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
    </div>
  );
}