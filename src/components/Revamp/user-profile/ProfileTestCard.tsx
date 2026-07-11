import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

interface ProfileTestCardProps {
  testGroupId: string;
  title: string;
  image: string;
  totalTests: number;
  totalStudents: number;
  rating: string;
  isBought: boolean;
}

export default function ProfileTestCard({
  testGroupId,
  title,
  image,
  totalTests,
  totalStudents,
  rating,
  isBought,
}: ProfileTestCardProps) {
  const navigate = useNavigate();
  const numericRating = Number(rating);
  const formattedRating = Number.isFinite(numericRating) ? numericRating.toFixed(1) : "0.0";

  return (
    <div
      className="w-[200px] bg-white rounded-2xl p-2.5 flex flex-col gap-2 cursor-pointer group shrink-0 border border-[#F0F3FF] hover:shadow-md transition-shadow duration-200"
      onClick={() => navigate(`/courses/test-group/${testGroupId}`)}
    >
      <div className="relative shrink-0">
        <img loading="lazy" decoding="async"
          src={image || "/discover-exam.jpg"}
          alt={title}
          className="w-full h-[130px] rounded-xl object-cover bg-gray-100"
        />
        <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
          <p className="text-[11px] font-medium text-[#0E1629]">{formattedRating}</p>
        </div>
        {isBought && (
          <div className="absolute top-2 right-2 bg-[#0E1629] rounded-full px-2 py-0.5">
            <p className="text-[10px] font-semibold text-white">Purchased</p>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-1 px-0.5">
        <h3 className="text-[#0E1629] font-semibold text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
          {title}
        </h3>
        <p className="text-[#6B7280] text-xs">
          {totalTests} Tests · {totalStudents} Students
        </p>
      </div>

      <button
        className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer border ${
          isBought
            ? "border-[#0E1629] text-[#0E1629] group-hover:bg-[#0E1629] group-hover:text-white"
            : "border-[#FA660F] text-[#FA660F] group-hover:bg-[#FA660F] group-hover:text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isBought ? "Continue" : "Explore"}
      </button>
    </div>
  );
}
