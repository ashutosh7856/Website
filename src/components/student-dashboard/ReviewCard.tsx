import type { Review } from '@/types/review';
import { Star, Edit } from 'lucide-react';

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
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

  const weeks = Math.floor(diffInSeconds / 604800);
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(diffInSeconds / 86400);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(diffInSeconds / 3600);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  return 'just now';
};

interface ReviewCardProps {
  review: Review;
  onEdit: (review: Review) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0px_0px_4px_0px_rgba(35,35,35,0.15)] border-l-[6px] border-[#3537B4]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img loading="lazy" decoding="async"
            src={review.counsellorPhotoUrl || `https://ui-avatars.com/api/?name=${review.counsellorFullName}`}
            alt={review.counsellorFullName}
            className="w-[55px] h-[55px] rounded-full object-cover"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${review.counsellorFullName}`; }}
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-[#242645]">{review.counsellorFullName}</h3>
            <StarRating rating={review.rating} />
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs hover:cursor-pointer font-semibold text-[#13097D] hover:opacity-80 transition-opacity" onClick={() => onEdit(review)}>
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      <p className="text-base font-medium text-[#232323] leading-tight">
        {review.reviewText}
      </p>

      <p className="text-sm font-medium text-[#C3C3C3] mt-auto">
        {formatTimeAgo(review.timestamp)}
      </p>
    </div>
  );
};

export default ReviewCard;