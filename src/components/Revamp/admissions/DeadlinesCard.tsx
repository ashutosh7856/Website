import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DeadlinesCardProps {
  id: string | number;
  examName: string;
  deadline: string;
  details: string;
  isWhite?: boolean;
}

export default function DeadlinesCard({ id, examName, deadline, details, isWhite = false }: DeadlinesCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Extract the first two words for the short display
  const words = examName.split(" ");
  const shortExamName = words.slice(0, 2).join(" ");
  const hasMoreWords = words.length > 2;

  return (
    <div 
      onClick={() => navigate(`/admissions/deadlines/${id}`)}
      role="button"
      tabIndex={0}
      className="relative cursor-pointer w-[165px] h-[200px] min-[400px]:w-[185px] min-[400px]:h-[210px] sm:w-[200px] sm:h-[220px] md:w-[312px] md:h-[322px] shrink-0 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Shape */}
      <svg
        className="absolute inset-0 transition-all duration-300 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 312 322"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M300 0C306.627 4.41907e-06 312 5.11826 312 11.432V249.03C312 255.657 306.627 261.03 300 261.03H260.406C254.371 261.03 249.275 265.511 248.504 271.497L243.348 311.533C242.577 317.518 237.481 322 231.446 322H12C5.37259 322 8.45615e-08 316.882 0 310.568V11.432C2.12611e-06 5.11826 5.37258 2.3016e-07 12 0H300Z"
          fill={isWhite ? "white" : "rgba(159, 168, 184, 0.6)"}
          className="transition-colors duration-300"
        />
      </svg>

      <div className="absolute inset-0 p-[10px] sm:p-[12px] md:p-[0.75rem] flex flex-col gap-[8px] sm:gap-[12px] md:gap-[1.5rem]">
        <div className="flex justify-between items-start md:items-center">
             
          {/* Wrapper for the custom hover tooltip */}
          <div className="relative flex items-center group/tooltip">
            <div className={`w-fit flex items-center justify-center rounded-[4px] md:rounded-[6px] gap-1 md:gap-2 ${isWhite ? "bg-[#EDEDED]": "bg-white"} py-1 px-1.5 md:px-3`}>
              <div className="bg-[#0E1629] h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 shrink-0"></div>
              {/* UPDATED: Scaled down mobile font slightly to prevent breaking */}
              <p className={`text-[#0E1629] md:text-(--text-main) font-[Poppins] font-semibold text-[9px] sm:text-[10px] md:text-[0.875rem] whitespace-nowrap`}>
                {shortExamName}{hasMoreWords ? "..." : ""}
              </p>
            </div>

            {/* Tooltip shown above on hover */}
            {hasMoreWords && (
              <div className="absolute bottom-[115%] left-0 hidden group-hover/tooltip:block z-50 bg-[#0E1629] text-white text-[10px] md:text-[12px] p-2 md:p-3 rounded-md shadow-xl w-max max-w-[180px] md:max-w-[220px] whitespace-normal pointer-events-none transition-opacity">
                {examName}
                {/* Little triangle pointing down */}
                <div className="absolute top-full left-4 border-[6px] border-transparent border-t-[#0E1629]"></div>
              </div>
            )}
          </div>

          <p className={`text-right font-[Poppins] font-normal text-[9px] sm:text-[11px] md:text-[0.875rem] leading-none md:leading-normal w-[70px] sm:w-[86px] md:w-auto mt-[2px] md:mt-0 ${isWhite ? "text-[#6B7280] md:text-(--text-muted)" : "text-[#6B7280] md:text-(--text-main)"}`}>
            {deadline}
          </p>
        </div>

        {/* UPDATED: Scaled down text size slightly for very small devices */}
        <p className={`text-left font-[Poppins] ${isWhite ? "text-[#0E1629] md:text-(--text-main)": "text-white"} text-[12px] sm:text-[14px] md:text-[1.125rem] leading-[1.4] md:leading-normal line-clamp-6`}>
          {details}
        </p>
      </div>

      <div className="absolute right-[-4px] md:right-[1.5px] bottom-[1.5px] overflow-hidden w-[40px] h-[36px] sm:w-[48px] sm:h-[41px] md:w-[63px] md:h-[57px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 63 57"
          preserveAspectRatio="none"
          fill="none"
          className="transition-all duration-300 w-full h-full"
        >
          <path
            d="M5.22808 7.00026C5.73192 3.00014 9.13365 0 13.1654 0H54.9303C59.3486 0 62.9303 3.58172 62.9303 8V49C62.9303 53.4183 59.3486 57 54.9303 57H8.00116C3.18615 57 -0.537853 52.7775 0.0638728 48.0002L5.22808 7.00026Z"
            fill={isHovered ? (isWhite ? "white" : "rgba(159, 168, 184, 0.6)") : "#0E1629"}
            className="transition-colors duration-300"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] md:w-[20px] md:h-[20px]">
          <img loading="lazy" decoding="async" 
            src="/arrow.svg" 
            alt="arrow" 
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered 
                ? 'translate-x-[30px] opacity-0' 
                : 'translate-x-0 opacity-100'
            }`}
            style={{ filter: isHovered ? 'brightness(0)' : 'brightness(0) invert(1)' }}
          />
          <img loading="lazy" decoding="async" 
            src="/arrow.svg" 
            alt="arrow" 
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-[30px] opacity-0'
            }`}
            style={{ filter: isHovered ? 'brightness(0)' : 'brightness(0) invert(1)' }}
          />
        </div>
      </div>
    </div>
  );
}