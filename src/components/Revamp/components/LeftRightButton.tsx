import { useState } from "react";

interface NavigationButtonProps {
  direction: "left" | "right";
  onClick?: () => void;
  fillColor?: string;
  hoverFillColor?: string;
}

export function NavigationButton({ 
  direction, 
  onClick,
  fillColor = "#ffffff",
  hoverFillColor = "#0E1629"
}: NavigationButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: "69px", height: "64px" }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {direction === "right" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="69"
          height="64"
          viewBox="0 0 69 64"
          fill="none"
          className="absolute inset-0 transition-all duration-300"
        >
          <path
            d="M5.95015 7.02573C6.44233 3.01431 9.8491 0 13.8906 0H60.9596C65.3779 0 68.9596 3.58172 68.9596 8V56C68.9596 60.4183 65.3779 64 60.9596 64H8.00116C3.19646 64 -0.524426 59.7947 0.060707 55.0257L5.95015 7.02573Z"
            fill={isHovered ? hoverFillColor : fillColor}
            className="transition-colors duration-300"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="69"
          height="64"
          viewBox="0 0 69 64"
          fill="none"
          className="absolute inset-0 transition-all duration-300"
        >
          <path
            d="M63.0094 7.02573C62.5173 3.01431 59.1105 0 55.069 0H8.00001C3.58173 0 1.52588e-05 3.58172 1.52588e-05 8V56C1.52588e-05 60.4183 3.58173 64 8.00002 64H60.9584C65.7631 64 69.484 59.7947 68.8989 55.0257L63.0094 7.02573Z"
            fill={isHovered ? hoverFillColor : fillColor}
            className="transition-colors duration-300"
          />
        </svg>
      )}

      {/* Arrow animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] overflow-hidden">
        {/* Arrow going out - default black on white bg */}
        <img loading="lazy" decoding="async"
          src="/arrow.svg"
          alt="arrow"
          className={`absolute inset-0 w-full h-full transition-all duration-600 ${
            isHovered
              ? direction === "right"
                ? "translate-x-[30px] opacity-0"
                : "-translate-x-[30px] opacity-0"
              : "translate-x-0 opacity-100"
          }`}
          style={{
            filter: "brightness(0)",
            transform:
              direction === "left" ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
        {/* Arrow coming in - white on blue bg on hover */}
        <img loading="lazy" decoding="async"
          src="/arrow.svg"
          alt="arrow"
          className={`absolute inset-0 w-full h-full transition-all duration-600 ${
            isHovered
              ? "translate-x-0 opacity-100"
              : direction === "right"
              ? "-translate-x-[30px] opacity-0"
              : "translate-x-[30px] opacity-0"
          }`}
          style={{
            filter: "brightness(0) invert(1)",
            transform:
              direction === "left" ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
    </div>
  );
}

interface SeeAllButtonProps {
  onClick?: () => void;
  text?: string;
  fillColor?: string;
  hoverFillColor?: string;
}

export function SeeAllButton({
  onClick,
  text = "See all",
  fillColor = "#0E1629",
  hoverFillColor = "#ffffff",
}: SeeAllButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="flex items-center gap-3 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ background: "none", border: "none", padding: 0 }}
    >
      <p className="font-[Poppins] font-semibold text-[18px] text-[#0E1629] m-0">
        {text}
      </p>
      <div className="relative" style={{ width: "24px", height: "23px" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="23"
          viewBox="0 0 24 23"
          fill="none"
          className="absolute inset-0 transition-all duration-300"
        >
          <path
            d="M1.8566 3.19489C2.0733 1.37246 3.61863 0 5.4539 0H19.9215C21.9223 0 23.5442 1.62191 23.5442 3.62264V19.0189C23.5442 21.0196 21.9223 22.6415 19.9215 22.6415H3.62312C1.45283 22.6415 -0.230441 20.7462 0.0258247 18.5911L1.8566 3.19489Z"
            fill={isHovered ? hoverFillColor : fillColor}
            className="transition-colors duration-300"
          />
        </svg>

        {/* Arrow animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] overflow-hidden">
          {/* Arrow going out to right */}
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered ? "translate-x-[20px] opacity-0" : "translate-x-0 opacity-100"
            }`}
            style={{ filter: "brightness(0) invert(1)" }}
          />
          {/* Arrow coming in from left */}
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered ? "translate-x-0 opacity-100" : "-translate-x-[20px] opacity-0"
            }`}
            style={{ filter: "brightness(0)" }}
          />
        </div>
      </div>
    </button>
  );
}

interface NavigationControlsProps {
  onPrevClick?: () => void;
  onNextClick?: () => void;
  onSeeAllClick?: () => void;
  showSeeAll?: boolean;
  seeAllText?: string;
}

export function NavigationControls({
  onPrevClick,
  onNextClick,
  onSeeAllClick,
  showSeeAll = true,
  seeAllText = "See all",
}: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* See all button - Left side */}
      {showSeeAll && (
        <SeeAllButton onClick={onSeeAllClick} text={seeAllText} />
      )}

      {/* Navigation buttons - Right side */}
      <div className="flex gap-3 ml-auto">
        <NavigationButton direction="left" onClick={onPrevClick} />
        <NavigationButton direction="right" onClick={onNextClick} />
      </div>
    </div>
  );
}
