import { Star } from "lucide-react";
import type { ApiReviewReceived } from "@/types/counselorDashboard";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={20}
        className={
          star <= rating
            ? "text-[#FFD700] fill-current"
            : "text-gray-300"
        }
      />
    ))}
  </div>
);

interface ReviewCardProps {
  review: ApiReviewReceived;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const reviewDate = new Date(review.timestamp.seconds * 1000);

  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-4 shadow-[0px_0px_4px_0px_#23232326] min-h-[170px] flex flex-col">
      <div className="flex items-start gap-4">
        <img loading="lazy" decoding="async"
          src={
            review.userPhotoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              review.userFullName
            )}`
          }
          alt={review.userFullName}
          className="w-[55px] h-[55px] rounded-full object-cover shrink-0"
        />

        <div className="min-w-0">
          <h4 className="font-semibold text-lg md:text-xl text-[#343C6A] truncate">
            {review.userFullName}
          </h4>

          <div className="mt-1">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-[#232323] font-medium leading-tight line-clamp-3">
        {review.reviewText}
      </p>

      <p className="mt-auto pt-2 text-xs text-[#C3C3C3] font-medium">
        {reviewDate.toLocaleDateString()} ·{" "}
        {reviewDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
