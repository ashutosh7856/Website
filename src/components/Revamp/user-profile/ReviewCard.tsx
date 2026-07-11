import type { Review } from '@/types/review';
import { Star, Edit } from 'lucide-react';

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${index < rating ? 'text-[#F2C94C] fill-[#F2C94C]' : 'text-gray-200 fill-gray-200'}`}
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
  onEdit?: (review: Review) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit }) => {
  return (
    <div className="flex flex-col items-start gap-4 p-5 rounded-2xl border border-[#E3E8F4] bg-white transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-3 items-center">
          <img loading="lazy" decoding="async"
            src={review.counsellorPhotoUrl || `https://ui-avatars.com/api/?name=${review.counsellorFullName}`}
            alt={review.counsellorFullName}
            className="w-12 h-12 rounded-full object-cover border border-[#E3E8F4]"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${review.counsellorFullName}`; }}
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-[1rem] font-semibold text-(--text-main) leading-none">
              {review.counsellorFullName}
            </h1>
            <span className="text-[0.75rem] font-medium text-(--text-muted)">
              {formatTimeAgo(review.timestamp)}
            </span>
          </div>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(review)} className="p-2 bg-[#F5F7FA] rounded-full hover:bg-[#E3E8F4] transition-colors cursor-pointer">
            <Edit className="w-4 h-4 text-[#8C8CA1]" />
          </button>
        )}
      </div>

      <StarRating rating={review.rating} />

      <p className="text-[0.875rem] text-(--text-main) font-medium leading-relaxed">
        {review.reviewText}
      </p>
    </div>
  );
};

export default ReviewCard;
