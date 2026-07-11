import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthorImageWithFallback, getAuthorProfileByName } from "@/lib/blogAuthors";

interface BlogsPageCardProps {
  id: number | string;
  slug?: string;
  title: string;
  author: string;
  publishedOn: string;
  tag: string;
  imageUrl: string;
}

export default function BlogsPageCard({
  id,
  slug,
  title,
  author,
  publishedOn,
  tag,
  imageUrl,
}: BlogsPageCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const hasImage = Boolean(imageUrl?.trim());
  const [isImageLoading, setIsImageLoading] = useState(hasImage);
  const canNavigate = Boolean(id);
  const authorProfile = getAuthorProfileByName(author);
  const [authorImage, setAuthorImage] = useState(
    getAuthorImageWithFallback(authorProfile.imageUrl)
  );

  useEffect(() => {
    setAuthorImage(getAuthorImageWithFallback(authorProfile.imageUrl));
  }, [authorProfile.imageUrl]);

  useEffect(() => {
    setIsImageLoading(hasImage);
  }, [imageUrl, hasImage]);

  const handleImageRef = (node: HTMLImageElement | null) => {
    if (node?.complete) {
      setIsImageLoading(false);
    }
  };

  const handleNavigate = () => {
    if (!canNavigate) return;
    if (slug?.trim()) {
      navigate(`/admissions/blogs/slug/${encodeURIComponent(slug.trim())}`);
      return;
    }
    navigate(`/admissions/blogs/${id}`);
  };

  const handleAuthorNavigate = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/admissions/blog-authors/${encodeURIComponent(authorProfile.slug)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div>
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

  <div className="relative z-10 h-full w-full p-3 flex flex-row gap-2">
    <div className="relative shrink-0 w-[42%] max-w-[140px]">
      {hasImage ? (
        <>
          {isImageLoading && (
            <div className="absolute inset-0 rounded-[10px] bg-[#E5ECF7] animate-pulse" />
          )}
          <img loading="lazy" decoding="async"
            ref={handleImageRef}
            src={imageUrl}
            alt={title}
            onLoadStart={() => setIsImageLoading(true)}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
            className={`w-full h-[136px] rounded-[10px] object-cover transition-opacity duration-300 ${
              isImageLoading ? "opacity-0" : "opacity-100"
            }`}
          />
        </>
      ) : (
        <div className="w-full h-[136px] rounded-[10px] border border-dashed border-[#C7D3E5] bg-[#EEF3FB] flex items-center justify-center text-center px-2">
          <span className="text-[10px] text-[#5D6B82] font-medium">No image available</span>
        </div>
      )}
      <span className="absolute top-1 left-1 inline-flex items-center px-1.5 py-0.5 rounded-[999px] bg-[#A2AECA] text-[10px] font-normal text-[#0E1629] max-w-[calc(100%-8px)] truncate">
        {tag}
      </span>
    </div>

    <div className=" flex min-w-0 flex-1 flex-col justify-between">
      <div className="flex flex-col min-w-0">
        <h3 className="text-(--text-main) font-medium text-[16px] line-clamp-2">
          {title}
        </h3>
        <p className="mt-2 text-(--text-muted) text-[10px] font-normal">{publishedOn}</p>
      </div>
      <button
        type="button"
        onClick={handleAuthorNavigate}
        className="inline-flex w-fit items-center gap-1.5 text-left cursor-pointer"
      >
        <img loading="lazy" decoding="async"
          src={authorImage}
          alt={authorProfile.name}
          className="w-5 h-5 rounded-full object-cover border border-[#E3E8F4]"
          onError={() => setAuthorImage("/round-profile.svg")}
        />
        <span className="text-(--text-muted) text-[12px] font-medium truncate">
          {authorProfile.name}
        </span>
      </button>
    </div>
  </div>

  <div className="absolute right-0.5 bottom-0">
    <svg
      width="46"
      height="41"
      viewBox="0 0 46 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.84 6.23929C6.66311 2.5911 9.90394 0 13.6438 0H37.9973C42.4156 0 45.9973 3.58172 45.9973 8V33C45.9973 37.4183 42.4156 41 37.9973 41H8.00333C2.87473 41 -0.929248 36.2421 0.199495 31.2393L5.84 6.23929Z"
        fill="#0E1629"
      />
    </svg>

    <svg
      className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#blog_card_mobile_arrow)">
        <path
          d="M4.16687 9.58301H15.8335"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 12.9163L15.8333 9.58301"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 6.25L15.8333 9.58333"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="blog_card_mobile_arrow">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  </div>
</div>

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
          <div className="relative">
            {hasImage ? (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 rounded-[8px] bg-[#E5ECF7] animate-pulse" />
                )}
                <img loading="lazy" decoding="async"
                  ref={handleImageRef}
                  src={imageUrl}
                  alt={title}
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                  className={`w-full h-[167px] rounded-[8px] object-cover transition-opacity duration-300 ${
                    isImageLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              </>
            ) : (
              <div className="w-full h-[167px] rounded-[8px] border border-dashed border-[#C7D3E5] bg-[#EEF3FB] flex items-center justify-center">
                <span className="text-[12px] text-[#5D6B82] font-medium">No image available</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center justify-between mt-2 mb-0.5">
            <span className="inline-flex items-center px-2 py-1 rounded-[999px] bg-[#A2AECA] text-[11px] font-normal text-[#0E1629]">
              {tag}
            </span>
            <span className="text-[11px] font-normal text-(--text-muted)">
              {publishedOn}
            </span>
          </div>

          <h2 className="mt-1.5 text-[16px] font-medium text-[#0E1629] leading-snug line-clamp-2">
            {title}
          </h2>

          <button
            type="button"
            onClick={handleAuthorNavigate}
            className="mt-auto mb-[6px] inline-flex w-fit items-center gap-2 text-left cursor-pointer"
          >
            <img loading="lazy" decoding="async"
              src={authorImage}
              alt={authorProfile.name}
              className="w-7 h-7 rounded-full object-cover border border-[#E3E8F4]"
              onError={() => setAuthorImage("/round-profile.svg")}
            />
            <div className="min-w-0">
              <p className="text-(--text-muted) text-[13px] font-medium leading-none truncate">
                {authorProfile.name}
              </p>
              <p className="text-(--text-muted) text-[11px] font-normal leading-none mt-1 truncate">
                {tag}
              </p>
            </div>
          </button>
        </div>

        <div className="absolute bottom-0 -right-px overflow-hidden h-[57px] w-[61px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 61 57"
            fill="none"
            className="h-full w-full transition-all duration-300"
            preserveAspectRatio="none"
          >
            <path
              d="M5.0628 7.03103C5.55256 3.01727 8.96036 0 13.0039 0H52.9656C57.3838 0 60.9656 3.58172 60.9656 8V49C60.9656 53.4183 57.3839 57 52.9656 57H8.00107C3.1985 57 -0.521724 52.7982 0.0599715 48.031L5.0628 7.03103Z"
              fill={isHovered ? "white" : "#0E1629"}
              className="transition-colors duration-300"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5">
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${
                isHovered ? "translate-x-[30px] opacity-0" : "translate-x-0 opacity-100"
              }`}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${
                isHovered ? "translate-x-0 opacity-100" : "-translate-x-[30px] opacity-0"
              }`}
              style={{ filter: "brightness(0)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

