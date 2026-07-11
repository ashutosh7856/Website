import type { CourseType } from "@/types/course";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import RatingBadge from "./RatingBadge";

interface CourseCardParam {
  isBaught: boolean;
  course?: CourseType;
  isLoading: boolean;
  useListingMobileCard?: boolean;
}

const formatDisplayPrice = (price?: string) => {
  if (!price) return "0";
  const trimmed = String(price).trim();
  if (trimmed.toLowerCase() === "free") return "Free";
  return trimmed.replace(/₹/g, "").trim();
};

export default function CourseCard(params: CourseCardParam) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "user";
  const duration = "3 Week";
  const counselorName =
    params.course?.counsellorName?.trim() ||
    params.course?.counselorName?.trim() ||
    "NA";
  const displayPrice = formatDisplayPrice(params.course?.price);
  const courseId = params.course?.id;
  const canNavigate = Boolean(courseId);
  const useListingMobileCard = Boolean(params.useListingMobileCard);

  const handleNavigate = () => {
    if (!courseId) return;
    navigate(`/courses/detail/${courseId}/${role}`);
  };

  if (params.isLoading) {
    if (useListingMobileCard) {
      return (
        <div>
          <div className="relative w-full h-[160px] md:hidden overflow-hidden rounded-[12px] bg-white">
            <div className="h-full w-full animate-pulse p-3">
              <div className="flex h-full gap-2">
                <div className="h-[136px] w-[42%] max-w-[140px] rounded-[10px] bg-gray-200" />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="h-4 w-[80%] rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-[45%] rounded bg-gray-100" />
                    <div className="mt-1 h-3 w-[55%] rounded bg-gray-100" />
                  </div>
                  <div className="h-3.5 w-[35%] rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-78 h-[28.188rem] bg-white p-3 rounded-2xl hidden md:flex flex-col gap-2.5 animate-pulse">
            <div className="w-full h-65 rounded-xl bg-gray-200" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-[70%] rounded bg-gray-200" />
              <div className="h-3 w-[40%] rounded bg-gray-100" />
              <div className="flex gap-2 mt-2">
                <div className="h-3 w-[35%] rounded bg-gray-200" />
                <div className="h-3 w-[35%] rounded bg-gray-200" />
              </div>
              <div className="h-10 mt-auto rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-78 h-[28.188rem] bg-white p-3 rounded-2xl flex flex-col gap-2.5 animate-pulse">
        <div className="w-full h-65 rounded-xl bg-gray-200" />

        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-[70%] rounded bg-gray-200" />
          <div className="h-3 w-[40%] rounded bg-gray-100" />

          <div className="flex gap-2 mt-2">
            <div className="h-3 w-[35%] rounded bg-gray-200" />
            <div className="h-3 w-[35%] rounded bg-gray-200" />
          </div>

          <div className="h-10 mt-auto rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {useListingMobileCard ? (
        <div
          className={`relative w-full h-[160px] md:hidden ${canNavigate ? "cursor-pointer" : ""}`}
          onClick={handleNavigate}
          role={canNavigate ? "button" : undefined}
          tabIndex={canNavigate ? 0 : -1}
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
              <img loading="lazy" decoding="async"
                src={params.course?.image}
                alt={params.course?.name}
                className="w-full h-[136px] rounded-[10px] object-cover"
              />
              <div className="absolute top-1 left-1 rounded-full bg-white/90 px-1.5 py-0.5 flex items-center gap-1">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <p className="text-[10px] font-medium text-[#0E1629]">{params.course?.rating ?? "0.0"}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div className="min-w-0">
                <h3 className="text-(--text-main) font-medium text-[16px] line-clamp-2">
                  {params.course?.name}
                </h3>
                <p className="mt-2 text-(--text-muted) text-[10px] font-normal">By: {counselorName}</p>
                <p className="mt-1 text-(--text-muted) text-[10px] font-normal">Duration: {duration}</p>
              </div>

              <div className="flex items-center gap-1 text-(--text-main) font-medium text-[12px]">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-3.5 h-3.5" />
                <p>{displayPrice === "Free" ? "Free" : displayPrice}</p>
              </div>
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
              <path d="M4.16687 9.58301H15.8335" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 12.9163L15.8333 9.58301" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 6.25L15.8333 9.58333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : (
        <div
          className={`relative w-[200px] h-[275px] md:hidden ${canNavigate ? "cursor-pointer" : ""}`}
          onClick={handleNavigate}
          role={canNavigate ? "button" : undefined}
          tabIndex={canNavigate ? 0 : -1}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            width="200"
            height="275"
            viewBox="0 0 200 275"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M192.308 0C196.556 3.77405e-06 200 4.37119 200 9.76331V215.991C200 222.619 194.627 227.991 188 227.991L166.064 227.991C160.478 227.991 155.631 231.846 154.372 237.288L147.802 265.703C146.543 271.146 141.696 275 136.11 275H7.69231C3.44397 275 5.42061e-08 270.629 0 265.237V9.76331C1.36289e-06 4.37119 3.44396 1.96565e-07 7.69231 0H192.308Z"
              fill="white"
            />
          </svg>
          <div className="relative z-10 h-full w-full p-3 flex flex-col">
            <div className="relative">
              <img loading="lazy" decoding="async"
                src={params.course?.image}
                alt={params.course?.name}
                className="w-full h-[151px] rounded-[10px] object-cover"
              />
            </div>

            <div className="mt-2">
              <h3 className="text-(--text-main) font-semibold text-[0.875rem] line-clamp-1">
                {params.course?.name}
              </h3>
              <p className="text-(--text-muted) text-[0.75rem]">By: {counselorName}</p>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center gap-1 text-sm leading-none">
                <p className="font-medium text-(--text-main)">Duration:</p>
                <span className="font-normal text-(--text-muted)">3 Weeks</span>
              </div>

              <div className="flex items-center gap-1 text-(--text-main) font-medium text-sm">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-4 h-4" />
                <p>{displayPrice}</p>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0">
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
              <path d="M4.16687 9.58301H15.8335" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 12.9163L15.8333 9.58301" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 6.25L15.8333 9.58333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`w-78 h-[28.188rem] bg-white p-3 rounded-2xl hidden md:flex flex-col gap-2.5 ${canNavigate ? "cursor-pointer" : ""}`}
        onClick={handleNavigate}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : -1}
      >
        <div className="w-full h-65 rounded-xl bg-gray-300 relative">
          <RatingBadge rating={params.course?.rating ?? "4.8"} />
          <img loading="lazy" decoding="async"
            src={params.course?.image}
            alt={params.course?.name}
            className="w-[18rem] h-65 rounded-xl object-cover"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-(--text-main) font-semibold text-[1rem] truncate whitespace-nowrap overflow-hidden">
              {params.course?.name}
            </h1>
            <span className="text-(--text-muted) text-xs font-normal">
              {counselorName}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-(--text-main) text-[0.875rem] font-semibold">
            <p>
              Duration:{" "}
              <span className="text-(--text-muted) font-normal pr-1">
                {duration}
              </span>
            </p>
            <div className="flex items-center gap-1 text-(--text-main) font-medium text-sm">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-5 h-5" />
              <p>{displayPrice}</p>
            </div>
          </div>

          {params.isBaught ? (
            <button className="group flex gap-2.5 items-center justify-center mt-2 border border-(--text-main) text-(--text-main) px-2.5 py-2 rounded-[12px] cursor-pointer transition-colors duration-300 hover:bg-(--text-main) hover:text-white">
              Continue{" "}
              <span className="relative w-5 h-5 overflow-hidden">
                <img loading="lazy" decoding="async"
                  src="/arrow.svg"
                  alt="arrow"
                  className="absolute inset-0 w-full h-full transition-all duration-300 group-hover:translate-x-5 group-hover:opacity-0"
                  style={{ filter: "brightness(0)" }}
                />
                <img loading="lazy" decoding="async"
                  src="/arrow.svg"
                  alt="arrow"
                  className="absolute inset-0 w-full h-full -translate-x-5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </span>
            </button>
          ) : (
            <button className="mt-2 border border-(--text-main) text-(--text-main) px-2.5 py-2 rounded-[12px] cursor-pointer transition-colors duration-300 hover:bg-(--text-main) hover:text-white">
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
