import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthorImageWithFallback, getAuthorProfileByName } from "@/lib/blogAuthors";

interface BlogCardProps {
  id?: number | string;
  slug?: string;
  title: string;
  author: string;
  readTime: string;
  imageUrl: string;
}

export default function BlogCard({ id, slug, title, author, readTime, imageUrl }: BlogCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const hasImage = Boolean(imageUrl?.trim());
  const [isImageLoading, setIsImageLoading] = useState(hasImage);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const authorProfile = getAuthorProfileByName(author);
  const [authorImage, setAuthorImage] = useState(
    getAuthorImageWithFallback(authorProfile.imageUrl)
  );

  useEffect(() => {
    setAuthorImage(getAuthorImageWithFallback(authorProfile.imageUrl));
  }, [authorProfile.imageUrl]);

  useEffect(() => {
    setIsImageLoading(hasImage);
    if (hasImage && imageRef.current?.complete) {
      setIsImageLoading(false);
    }
  }, [imageUrl, hasImage]);

  const handleAuthorNavigate = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/admissions/blog-authors/${encodeURIComponent(authorProfile.slug)}`);
  };

  return (
    <div
      className="relative w-[200px] h-[260px] md:w-[308px] md:h-[331px] cursor-pointer shrink-0"
      onClick={() => {
        if (id !== undefined && id !== null) {
          if (slug?.trim()) {
            navigate(`/admissions/blogs/slug/${encodeURIComponent(slug.trim())}`);
            return;
          }
          navigate(`/admissions/blogs/${id}`);
        }
      }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 308 331" 
        preserveAspectRatio="none" 
        fill="none"
      >
        <path d="M296.154 0C302.696 4.54258e-06 308 5.26132 308 11.7515V256.325C308 262.953 302.627 268.325 296 268.325H257.257C251.199 268.325 246.091 272.84 245.347 278.852L240.199 320.473C239.456 326.485 234.348 331 228.29 331H11.8462C5.30371 331 8.34774e-08 325.739 0 319.249V11.7515C2.09886e-06 5.26132 5.30371 2.36593e-07 11.8462 0H296.154Z" fill="white"/>
      </svg>

      <div className="absolute flex flex-col w-full h-full z-10 p-[12px] md:p-3">
        {hasImage ? (
          <div className="relative w-full h-[120px] md:h-[167px] shrink-0">
            {isImageLoading && (
              <div className="absolute inset-0 rounded-[8px] bg-[#E5ECF7] animate-pulse" />
            )}
            <img loading="lazy" decoding="async"
              ref={imageRef}
              src={imageUrl}
              alt={title}
              onLoadStart={() => setIsImageLoading(true)}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
              className={`w-full h-[120px] md:h-[167px] rounded-[8px] object-cover transition-opacity duration-300 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
            />
          </div>
        ) : (
          <div className="w-full h-[120px] md:h-[167px] shrink-0 rounded-[8px] border border-dashed border-[#C7D3E5] bg-[#EEF3FB] flex items-center justify-center">
            <span className="text-[11px] md:text-[12px] text-[#5D6B82] font-medium">No image available</span>
          </div>
        )}
        <h1 className={`font-[Poppins] font-medium text-[14px] md:text-[1rem] text-[#0E1629] md:text-(--text-main) line-clamp-2 leading-[1.3] md:leading-normal ${hasImage ? "mt-2.5" : "mt-0"}`}>{title}</h1>
        <div className="mt-auto mb-[6px] md:mb-[6px]">
          <button
            type="button"
            onClick={handleAuthorNavigate}
            className="inline-flex items-center gap-2 text-left cursor-pointer"
          >
            <img loading="lazy" decoding="async"
              src={authorImage}
              alt={authorProfile.name}
              className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover border border-[#E3E8F4]"
              onError={() => setAuthorImage("/round-profile.svg")}
            />
            <p className="font-[Poppins] text-[#6B7280] md:text-(--text-muted) font-medium text-[12px] md:text-[0.875rem] truncate">
              {authorProfile.name}
            </p>
          </button>
          <p className="font-[Poppins] text-[#6B7280] md:text-(--text-muted) font-medium text-[10px] md:text-[0.75rem]">{readTime}</p>
        </div>
      </div>

      <div className="absolute bottom-[2px] right-[-4px] md:-right-px md:bottom-0 overflow-hidden w-[40px] h-[38px] md:w-[61px] md:h-[57px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 61 57"
          preserveAspectRatio="none"
          fill="none"
          className="w-full h-full transition-all duration-300"
        >
          <path
            d="M5.0628 7.03103C5.55256 3.01727 8.96036 0 13.0039 0H52.9656C57.3838 0 60.9656 3.58172 60.9656 8V49C60.9656 53.4183 57.3839 57 52.9656 57H8.00107C3.1985 57 -0.521724 52.7982 0.0599715 48.031L5.0628 7.03103Z"
            fill={isHovered ? "white" : "#0E1629"}
            className="transition-colors duration-300"
          />
        </svg>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] md:w-[20px] md:h-[20px]">
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered ? 'translate-x-[30px] opacity-0' : 'translate-x-0 opacity-100'
            }`}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img loading="lazy" decoding="async"
            src="/arrow.svg"
            alt="arrow"
            className={`absolute inset-0 w-full h-full transition-all duration-600 ${
              isHovered ? 'translate-x-0 opacity-100' : '-translate-x-[30px] opacity-0'
            }`}
            style={{ filter: 'brightness(0)' }}
          />
        </div>
      </div>
    </div>
  );
}