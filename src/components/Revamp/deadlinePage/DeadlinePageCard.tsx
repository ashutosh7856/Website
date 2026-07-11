import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DeadlinePageCardProps {
  id: string | number;
  title: string;
  deadline: string;
  description: string;
}

export default function DeadlinePageCard({
  id,
  title,
  deadline,
  description,
}: DeadlinePageCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const canNavigate = Boolean(id);

  const handleNavigate = () => {
    if (!canNavigate) return;
    navigate(`/admissions/deadlines/${id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  // Helper to extract a nice date block
  const dateObj = new Date(deadline);
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const day = dateObj.toLocaleDateString("en-US", { day: "numeric" });

  return (
    <div>
      {/* --- MOBILE VIEW (Horizontal) --- */}
      <div
        className={`relative w-full h-[160px] md:hidden ${canNavigate ? "cursor-pointer" : ""}`}
        onClick={handleNavigate}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : -1}
        onKeyDown={handleKeyDown}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 316 160"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M308.308 0C312.556 0 316 2.54469 316 5.68411V100.44C316 107.06 310.627 112.44 304 112.44L282.064 112.44C276.478 112.44 271.631 118 270.372 124L263.802 152C262.543 158 257.696 160 252.11 160H7.69231C3.44397 160 0 157.455 0 154.316V5.68411C0 2.54469 3.44396 0 7.69231 0H308.308Z"
            fill="white"
          />
        </svg>

        <div className="relative z-10 h-full w-full p-3 flex flex-row gap-3">
          {/* Replaced Image with a Date Block */}
          <div className="relative shrink-0 w-[42%] max-w-[140px] bg-[#0E1629] rounded-[10px] flex flex-col items-center justify-center text-white">
             <span className="text-[28px] font-bold leading-none">{day}</span>
             <span className="text-[14px] font-medium uppercase tracking-wider">{month}</span>
             <span className="absolute top-1 left-1 inline-flex items-center px-1.5 py-0.5 rounded-[999px] bg-[#A2AECA] text-[10px] font-normal text-[#0E1629]">
              Deadline
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-start pt-1">
            <h3 className="text-(--text-main) font-medium text-[16px] line-clamp-2">
              {title}
            </h3>
            <p className="mt-2 text-(--text-muted) text-[12px] font-normal line-clamp-3">
              {description}
            </p>
          </div>
        </div>

        {/* Mobile Arrow SVG (Unchanged) */}
        <div className="absolute right-0.5 bottom-0">
          <svg width="46" height="41" viewBox="0 0 46 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.84 6.23929C6.66311 2.5911 9.90394 0 13.6438 0H37.9973C42.4156 0 45.9973 3.58172 45.9973 8V33C45.9973 37.4183 42.4156 41 37.9973 41H8.00333C2.87473 41 -0.929248 36.2421 0.199495 31.2393L5.84 6.23929Z" fill="#0E1629" />
          </svg>
          <svg className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#dl_card_mobile_arrow)">
              <path d="M4.16687 9.58301H15.8335" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 12.9163L15.8333 9.58301" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 6.25L15.8333 9.58333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs><clipPath id="dl_card_mobile_arrow"><rect width="20" height="20" fill="white" /></clipPath></defs>
          </svg>
        </div>
      </div>

      {/* --- DESKTOP VIEW (Vertical) --- */}
      <div
        className={`relative w-[308px] h-[331px] hidden md:block ${canNavigate ? "cursor-pointer" : ""}`}
        onClick={handleNavigate}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : -1}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 308 331"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M296.154 0C302.696 4.54258e-06 308 5.26132 308 11.7515V256.325C308 262.953 302.627 268.325 296 268.325H257.257C251.199 268.325 246.091 272.84 245.347 278.852L240.199 320.473C239.456 326.485 234.348 331 228.29 331H11.8462C5.30371 331 8.34774e-08 325.739 0 319.249V11.7515C2.09886e-06 5.26132 5.30371 2.36593e-07 11.8462 0H296.154Z"
            fill="white"
          />
        </svg>

        <div className="absolute flex flex-col w-full h-full z-10 p-3">
          {/* Replaced Image with a Date Block */}
          <div className="relative w-full h-[140px] bg-[#0E1629] rounded-[8px] flex flex-col items-center justify-center text-white">
            <span className="text-[40px] font-bold leading-none">{day}</span>
            <span className="text-[18px] font-medium uppercase tracking-widest">{month}</span>
          </div>

          <div className="hidden md:flex items-center justify-between mt-3 mb-1">
            <span className="inline-flex items-center px-2 py-1 rounded-[999px] bg-[#A2AECA] text-[11px] font-normal text-[#0E1629]">
              Deadline
            </span>
            <span className="text-[12px] font-medium text-[#0E1629]">
              {deadline}
            </span>
          </div>

          <h2 className="mt-1.5 text-[16px] font-medium text-[#0E1629] leading-snug line-clamp-2">
            {title}
          </h2>

          <p className="text-(--text-muted) text-[13px] font-normal mt-2 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Desktop Arrow SVG (Unchanged) */}
        <div className="absolute bottom-0 -right-px overflow-hidden h-[57px] w-[61px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61 57" fill="none" className="h-full w-full transition-all duration-300" preserveAspectRatio="none">
            <path d="M5.0628 7.03103C5.55256 3.01727 8.96036 0 13.0039 0H52.9656C57.3838 0 60.9656 3.58172 60.9656 8V49C60.9656 53.4183 57.3839 57 52.9656 57H8.00107C3.1985 57 -0.521724 52.7982 0.0599715 48.031L5.0628 7.03103Z" fill={isHovered ? "white" : "#0E1629"} className="transition-colors duration-300" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5">
            <img loading="lazy" decoding="async" src="/arrow.svg" alt="arrow" className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-[30px] opacity-0" : "translate-x-0 opacity-100"}`} style={{ filter: "brightness(0) invert(1)" }} />
            <img loading="lazy" decoding="async" src="/arrow.svg" alt="arrow" className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-[30px] opacity-0"}`} style={{ filter: "brightness(0)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}