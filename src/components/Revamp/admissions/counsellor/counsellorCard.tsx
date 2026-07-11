import { Bookmark, Star, Briefcase, MapPin, User2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encodeCounselorId } from "@/lib/utils";

interface FancyCardProps {
  counsellorId: string;
  name: string;
  imageUrl: string;
  rating: number;
  experience: string;
  city: string;
  proCoins?: number;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  navigateTo?: string;
}

export default function FancyCard({
  counsellorId,
  name,
  imageUrl,
  rating,
  experience,
  city,
  proCoins,
  showBookmark = true,
  isBookmarked = false,
  onBookmarkClick,
  navigateTo,
}: FancyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(navigateTo ?? `/counsellor-details/${encodeCounselorId(counsellorId)}`);
  };

  return (
    <div
      className="relative w-50 md:w-61 h-68.75 md:h-91.75 cursor-pointer group shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 244 367"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M234.615 0C239.798 5.03664e-06 244 5.83355 244 13.0296V300C244 306.627 238.627 312 232 312H203.381C197.421 312 192.364 316.375 191.506 322.273L186.494 356.727C185.636 362.625 180.579 367 174.619 367H9.38461C4.20164 367 6.61314e-08 361.166 0 353.97V13.0296C1.66273e-06 5.83355 4.20164 2.62325e-07 9.38461 0H234.615Z"
          fill="white"
        />
      </svg>

      <div className="w-full relative h-full p-3 flex flex-col">
        {showBookmark && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onBookmarkClick?.();
            }}
            className="absolute top-4.5 right-4.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#0E1629] shadow-sm transition-colors hover:bg-white cursor-pointer"
            aria-label="Bookmark counselor"
          >
            <Bookmark size={16} fill={isBookmarked ? "#0E1629" : "none"} />
          </button>
        )}

        {/* Rating Badge */}
        <div className="absolute top-5 left-5 flex items-center gap-1 z-10">
          <Star size={16} fill="#0E1629" className="text-[#0E1629]" />
          <p className="font-[Poppins] font-medium text-[12px] md:text-[14px] text-[#0E1629] tracking-[0.28px]">
            {rating?.toFixed(1) || "N/A"}
          </p>
        </div>

        {/* Counsellor Image */}
        {imageUrl && !imgError ? (
          <img loading="lazy" decoding="async"
            src={imageUrl}
            alt={name}
            className="w-full md:w-55 h-33.75 md:h-52 rounded-[10px] object-cover shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full md:w-55 h-33.75 md:h-52 rounded-[10px] shrink-0 bg-[#F0F3FF] flex items-center justify-center">
            <User2 className="w-14 h-14 text-[#9CA3AF]" strokeWidth={1.2} />
          </div>
        )}

        {/* Counsellor Name */}
        <div className="mt-2">
          <p className="font-[Poppins] font-medium text-[16px] md:text-[18px] text-[#0E1629] leading-normal truncate">
            {name}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1 mt-1.5 md:mt-3">
          <div className="flex items-center gap-1">
            <Briefcase size={16} className="md:w-5 md:h-5 text-[#6B7280] shrink-0" strokeWidth={1.5} />
            <p className="font-[Poppins] font-normal text-[12px] md:text-[14px] text-[#6B7280] truncate">
              {experience || "Entry Level"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={16} className="md:w-5 md:h-5 text-[#6B7280] shrink-0" strokeWidth={1.5} />
            <p className="font-[Poppins] font-normal text-[12px] md:text-[14px] text-[#6B7280] truncate">
              {city || "Not specified"}
            </p>
          </div>
        </div>

        {/* ProCoins */}
        {proCoins != null && proCoins > 0 && (
          <div className="flex items-center gap-1 mt-1.5 md:mt-3">
            <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-full h-full" />
            </div>
            <p className="font-[Poppins] font-medium text-[14px] md:text-[16px] text-[#0E1629]">
              {proCoins} ProCoins
            </p>
          </div>
        )}
      </div>

      {/* Arrow Button */}
      <div className="absolute -right-px bottom-[1.5px] overflow-hidden w-12 md:w-auto h-10.25 md:h-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 52 50"
          preserveAspectRatio="none"
          fill="none"
          className="w-12 md:w-13.25 h-10.25 md:h-12.5 transition-all duration-300"
        >
          <path
            d="M4.1 7.05536C4.57855 3.03083 7.99114 0 12.044 0H43.9934C48.4117 0 51.9934 3.58172 51.9934 8V42C51.9934 46.4183 48.4117 50 43.9934 50H8.00107C3.20833 50 -0.508886 45.8146 0.0570345 41.0554L4.1 7.05536Z"
            fill={isHovered ? "white" : "#0E1629"}
            className="transition-colors duration-300"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] md:w-[20px] h-[16px] md:h-[20px]">
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered
                ? 'translate-x-[30px] opacity-0'
                : 'translate-x-0 opacity-100'
              }`}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered
                ? 'translate-x-0 opacity-100'
                : '-translate-x-[30px] opacity-0'
              }`}
            style={{ filter: 'brightness(0)' }}
          />
        </div>
      </div>
    </div>
  );
}
