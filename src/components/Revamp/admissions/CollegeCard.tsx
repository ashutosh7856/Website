import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CollegeCardProps {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
}

export default function CollegeCard({ id, name, description, logoUrl }: CollegeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div 
      className="relative group cursor-pointer w-[350px] h-[82px] md:w-auto md:h-auto shrink-0 md:shrink"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/college-details/${id}`)}
    >
      <div className="relative md:static w-full h-full md:w-auto md:h-auto flex md:items-center md:gap-[6.19rem] md:max-w-[1320px]">

        <img loading="lazy" decoding="async" 
          src={logoUrl} 
          alt={name} 
          className="absolute md:static top-0 left-0 w-[80px] h-[80px] rounded-[8px] md:w-[7.5rem] md:h-[5.8125rem] md:rounded-[0.5rem] shrink-0 object-cover" 
        />

        {/* Fixed desktop column width (md:w-[20rem] md:shrink-0) and lowered mobile top offset (top-[4px]) */}
        <h3
          className="absolute md:static top-[4px] left-[92px] w-[217px] h-[42px] md:w-[20rem] md:shrink-0 md:h-auto font-[Poppins] font-medium text-[14px] leading-[1.2] md:leading-normal text-[#0E1629] md:text-[1.125rem] md:text-(--text-main) md:overflow-clip line-clamp-2 md:line-clamp-none"
        >
          {name}
        </h3>

        {/* Lowered mobile top offset slightly (top-[48px]) to adjust for the name moving down */}
        <p
          className="absolute md:static top-[48px] left-[92px] w-[234px] h-[36px] md:w-auto md:h-auto font-[Poppins] font-normal text-[12px] leading-none text-[#6B7280] md:max-w-[32.5rem] md:text-(--text-main) md:text-[0.875rem] md:leading-normal line-clamp-3 md:line-clamp-none pr-[26px] md:pr-0"
        >
          {description}
        </p>

        {/* Arrow Button */}
        <div className="absolute md:relative top-[38px] left-[304px] md:top-auto md:left-auto w-[46px] h-[41px] md:w-[63px] md:h-[57px] overflow-hidden md:ml-auto shrink-0 z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 63 57"
            preserveAspectRatio="none"
            fill="none"
            className="w-full h-full transition-all duration-300"
          >
            <path
              d="M5.22808 7.00026C5.73192 3.00014 9.13365 0 13.1654 0H54.9303C59.3486 0 62.9303 3.58172 62.9303 8V49C62.9303 53.4183 59.3486 57 54.9303 57H8.00116C3.18615 57 -0.537853 52.7775 0.0638728 48.0002L5.22808 7.00026Z"
              fill={isHovered ? "white" : "#0E1629"}
              className="transition-colors duration-300"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] md:w-[20px] md:h-[20px]">
            {/* Arrow going out to right */}
            <img loading="lazy" decoding="async" 
              src="/arrow.svg" 
              alt="arrow" 
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${
                isHovered 
                  ? 'translate-x-[30px] opacity-0' 
                  : 'translate-x-0 opacity-100'
              }`}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            {/* Arrow coming in from left */}
            <img loading="lazy" decoding="async" 
              src="/arrow.svg" 
              alt="arrow" 
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${
                isHovered 
                  ? 'translate-x-0 opacity-100' 
                  : '-translate-x-[30px] opacity-0'
              }`}
              style={{ filter: 'brightness(0)' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}