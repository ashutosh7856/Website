import { Star, ChevronRight, Info, X, ChevronLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { CounselorReview } from '@/types/counselorReview';
import toast from 'react-hot-toast';
import { SeeAllButton } from '../components/LeftRightButton';

const StarRating = ({ rating, interactive = false, onRatingChange }: { rating: number; interactive?: boolean; onRatingChange?: (newRating: number) => void; }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;
  return (
    <div className={`flex gap-[8px] ${interactive ? 'cursor-pointer' : ''}`} onMouseLeave={() => interactive && setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={starIndex}
          className={`w-[24px] h-[24px] transition-colors ${starIndex <= displayRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          onMouseEnter={() => interactive && setHoverRating(starIndex)}
          onClick={() => interactive && onRatingChange && onRatingChange(starIndex)}
        />
      ))}
    </div>
  );
};

const formatTimeAgo = (timestamp: { seconds: number; nanos: number }) => {
  const diffInSeconds = Math.floor((new Date().getTime() - new Date(timestamp.seconds * 1000).getTime()) / 1000);
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

export function RevampCounselorReviews({ reviews, isSubscribed, onSubmitReview, userReview, onUpdateReview }: CounselorReviewsProps) {
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
    if (userRating === 0) return toast.error("Please select a rating (1-5 stars).");
    if (!reviewText.trim()) return toast.error("Please write a review before submitting.");
    setIsSubmitting(true);
    try {
      if (userReview && isEditing) {
        await onUpdateReview(reviewText, userRating);
        setIsEditing(false);
      } else if (!userReview) {
        await onSubmitReview(reviewText, userRating);
      }
    } catch (error) {
      console.error("Submission failed:", error);
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
        <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
          <Info className="w-6 h-6 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-800">You must be subscribed to this counsellor to write a review.</p>
        </div>
      );
    }

    if (userReview && !isEditing) {
      return (
        <div className="flex flex-col gap-4">
          <StarRating rating={userRating} interactive={false} />
          <p className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] text-gray-800">
            {reviewText}
          </p>
          <button className="self-start px-6 py-2 bg-[#2F43F2] text-white font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
            Edit Review
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <StarRating rating={userRating} interactive={true} onRatingChange={setUserRating} />
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg transition font-poppins"
          rows={4}
          placeholder="Share your experience with this counsellor..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-[#2F43F2] text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer" onClick={handleLocalSubmit} disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? "Updating..." : "Submitting...") : (isEditing ? "Update Review" : "Submit Review")}
          </button>
          {isEditing && (
            <button className="px-6 py-2 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition cursor-pointer" onClick={handleCancelEdit} disabled={isSubmitting}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const otherReviews = reviews.filter(r => !userReview || r.reviewId !== userReview.reviewId);
  const allReviewsToDisplay = userReview ? [userReview, ...otherReviews] : otherReviews;
  const top3Reviews = allReviewsToDisplay.slice(0, 3);
  
  const totalPages = Math.ceil(otherReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = otherReviews.slice(startIndex, startIndex + reviewsPerPage);

  const renderReviewItemModal = (review: CounselorReview, index: number) => (
    <React.Fragment key={review.reviewId}>
      {index > 0 && <hr className="my-4 border-gray-200" />}
      <div className="py-2 flex items-start gap-3">
        <img loading="lazy" decoding="async" src={review.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userFullName || 'User')}&background=13097D&color=fff&size=128`} alt={review.userFullName || 'User'} className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h4 className="font-semibold text-[#343C6A]">{review.userFullName || 'User'}</h4>
            <p className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(review.timestamp)}</p>
          </div>
          <StarRating rating={review.rating} />
          <p className="text-[#232323] text-sm mt-2">{review.reviewText}</p>
        </div>
      </div>
    </React.Fragment>
  );

  return (
    <>
      {/* Full Width Figma Layout */}
      <div className="w-full bg-white py-8 md:py-[40px]">
        <div className="max-w-[1440px] mx-auto relative font-poppins">
          
          <h2 className="text-[20px] md:text-[24px] font-bold text-[#0E1629] text-center mb-6 md:mb-[32px]">
            Reviews
          </h2>

          {/* Horizontally Scrollable Cards Container */}
          <div className="flex gap-4 md:gap-[32px] overflow-x-auto px-3 md:px-[60px] pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {top3Reviews.length > 0 ? top3Reviews.map((review) => (
              
              <div key={review.reviewId} className="w-[90vw] sm:w-[85vw] md:w-[597px] min-h-[128px] border border-[#EFEFEF] rounded-[12px] p-[10px] md:p-[12px] flex flex-col shrink-0 bg-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex gap-[12px]">
                    <img loading="lazy" decoding="async" 
                      src={review.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userFullName || 'User')}&background=13097D&color=fff&size=128`} 
                      alt="User" 
                      className="w-[42px] h-[42px] md:w-[50px] md:h-[50px] rounded-full object-cover shrink-0"
                    />
                    <div className="flex flex-col mt-[1px]">
                      <h4 className="text-[14px] md:text-[16px] font-medium text-[#0E1629] leading-[150%] capitalize">{review.userFullName || 'User'}</h4>
                      <p className="text-[12px] md:text-[14px] font-normal text-[#6B7280] leading-[150%] lowercase">{formatTimeAgo(review.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex gap-[6px] md:gap-[8px]">
                    {[1, 2, 3, 4, 5].map((starIndex) => (
                      <Star key={starIndex} className={`w-[16px] h-[16px] md:w-[24px] md:h-[24px] ${starIndex <= review.rating ? 'text-yellow-400 fill-current' : 'text-[#EFEFEF]'}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-[10px] md:mt-[12px] text-[13px] md:text-[14px] font-normal text-[#6B7280] leading-[130%] line-clamp-3 md:line-clamp-2 lowercase">
                  {review.reviewText}
                </p>
              </div>

            )) : (
              <p className="text-[#6B7280] w-full text-center">No reviews for this counsellor yet.</p>
            )}
          </div>

          {/* See All Button using the provided custom component */}
          {reviews.length > 0 && (
            <div className="flex justify-end px-3 md:px-[60px] mt-2">
              <SeeAllButton onClick={() => setShowAllReviewsModal(true)} />
            </div>
          )}

        </div>
      </div>

      {/* Pop-up Modal (Combined Write & Read functionality) */}
      {showAllReviewsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 font-poppins" onClick={() => { setShowAllReviewsModal(false); setCurrentPage(1); }}>
          <div className="bg-[#F9FAFC] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 bg-white rounded-t-xl">
              <h2 className="text-xl md:text-2xl font-bold text-[#0E1629]">All Reviews ({reviews.length})</h2>
              <button onClick={() => { setShowAllReviewsModal(false); setCurrentPage(1); }} className="text-gray-500 hover:text-gray-700 cursor-pointer transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Write Review Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-[#0E1629] mb-4">{userReview ? "Your Review" : "Write a Review"}</h3>
                {renderReviewForm()}
              </div>

              {/* Other Reviews Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#0E1629] mb-4">Other Reviews</h3>
                {paginatedReviews.length > 0 ? (
                  paginatedReviews.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds).map((review, index) => renderReviewItemModal(review, index))
                ) : (
                  <p className="text-sm text-gray-500">No other reviews yet.</p>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 p-4 md:p-6 bg-white rounded-b-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">Showing {startIndex + 1} to {Math.min(startIndex + reviewsPerPage, otherReviews.length)} of {otherReviews.length} reviews</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${currentPage === page ? 'bg-[#2F43F2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                          {page}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}