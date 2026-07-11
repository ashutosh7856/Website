import { useId, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

interface TestGroupCardProps {
  testGroupId?: string;
  image: string;
  rating: string;
  price?: string;
  title: string;
  description?: string;
  totalTests: number;
  totalStudents: number;
  isBaught?: boolean;
  isMyTestsCard?: boolean;
  useListingMobileCard?: boolean;
}

export default function TestGroupCard({
  testGroupId,
  image,
  rating,
  price,
  title,
  description,
  totalTests,
  totalStudents,
  isBaught = false,
  isMyTestsCard = false,
  useListingMobileCard = false,
}: TestGroupCardProps) {
  const navigate = useNavigate();
  const mobileArrowLeftClipId = useId();
  const mobileArrowRightClipId = useId();
  const mobileTestIconClipId = useId();
  const mobileStudentIconClipId = useId();
  const canNavigate = Boolean(testGroupId);
  const numericRating = Number(rating);
  const formattedRating = Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : "0.0";
  const displayPrice = price
    ? String(price).trim().replace(/₹/g, "")
    : "Paid";

  const handleNavigate = () => {
    if (!testGroupId) return;
    navigate(`/courses/test-group/${testGroupId}`);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div>
      {/* Desktop view */}
      <div
        className={`hidden md:flex flex-col bg-white gap-2.5 p-3 rounded-2xl ${canNavigate ? "cursor-pointer" : ""}`}
        onClick={handleNavigate}
        onKeyDown={handleCardKeyDown}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : -1}
      >
        <div className="relative w-[18rem] h-65 rounded-xl">
          <img loading="lazy" decoding="async"
            src={image}
            alt="course_image"
            className="object-cover w-full h-full"
          />
          <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <p className="text-[12px] font-medium text-[#0E1629]">{formattedRating}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 ">
          <h3
            className="text-[#0E1629] font-semibold text-xl max-w-[18rem] overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {title}
          </h3>

          <div className="flex gap-2.5 font-normal text-xs text-[#6B7280]">
            <div className="flex gap-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <g clipPath="url(#clip0_215_2617)">
                  <path
                    d="M3.75 3.75C3.75 3.35218 3.90804 2.97064 4.18934 2.68934C4.47064 2.40804 4.85218 2.25 5.25 2.25H12.75C13.1478 2.25 13.5294 2.40804 13.8107 2.68934C14.092 2.97064 14.25 3.35218 14.25 3.75V14.25C14.25 14.6478 14.092 15.0294 13.8107 15.3107C13.5294 15.592 13.1478 15.75 12.75 15.75H5.25C4.85218 15.75 4.47064 15.592 4.18934 15.3107C3.90804 15.0294 3.75 14.6478 3.75 14.25V3.75Z"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.75 5.25H11.25"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.75 8.25H11.25"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.75 11.25H9.75"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_215_2617">
                    <rect width="18" height="18" fill="white" />
                  </clipPath>
                </defs>
              </svg>

              <p>{`${totalTests} Tests`}</p>
            </div>

            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <g clipPath="url(#clip0_215_2625)">
                  <path
                    d="M3.75 5.25C3.75 6.04565 4.06607 6.80871 4.62868 7.37132C5.19129 7.93393 5.95435 8.25 6.75 8.25C7.54565 8.25 8.30871 7.93393 8.87132 7.37132C9.43393 6.80871 9.75 6.04565 9.75 5.25C9.75 4.45435 9.43393 3.69129 8.87132 3.12868C8.30871 2.56607 7.54565 2.25 6.75 2.25C5.95435 2.25 5.19129 2.56607 4.62868 3.12868C4.06607 3.69129 3.75 4.45435 3.75 5.25Z"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.25 15.75V14.25C2.25 13.4544 2.56607 12.6913 3.12868 12.1287C3.69129 11.5661 4.45435 11.25 5.25 11.25H8.25C9.04565 11.25 9.80871 11.5661 10.3713 12.1287C10.9339 12.6913 11.25 13.4544 11.25 14.25V15.75"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 2.34766C12.6453 2.51288 13.2173 2.88818 13.6257 3.41439C14.0342 3.9406 14.2559 4.58778 14.2559 5.25391C14.2559 5.92003 14.0342 6.56722 13.6257 7.09342C13.2173 7.61963 12.6453 7.99493 12 8.16016"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 15.7498V14.2498C15.7462 13.5877 15.5234 12.9454 15.1165 12.4231C14.7095 11.9008 14.1411 11.5278 13.5 11.3623"
                    stroke="#6B7280"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_215_2625">
                    <rect width="18" height="18" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <p>{`${totalStudents} Students`}</p>
            </div>
          </div>
          {!isBaught ? (
            <div className="flex group items-center justify-between">
              <div className="flex items-center gap-1 text-(--text-main) font-medium text-sm">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-5 h-5" />
                <p>{displayPrice}</p>
              </div>

              <button className="py-2 px-2.5 border border-(--text-main) rounded-[12px] text-(--text-main) text-sm font-medium group-hover:cursor-pointer group-hover:text-white group-hover:bg-(--text-main)">
                Explore Test Series
              </button>
            </div>
          ) : (
            <button className="pt-3 font-medium text-[#0E1629] text-sm rounded-[0.75rem] border border-[#0E1629] w-[18rem] flex items-center justify-center py-2 px-2.5 cursor-pointer transition-colors duration-300 hover:bg-[#0E1629] hover:text-white">
              Explore Test Series
            </button>
          )}
        </div>
      </div>

      {/* Mobile view */}
      {useListingMobileCard ? (
        <div
          className={`relative w-full min-w-full h-[160px] md:hidden ${canNavigate ? "cursor-pointer" : ""}`}
          onClick={handleNavigate}
          onKeyDown={handleCardKeyDown}
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
              <img loading="lazy" decoding="async" src={image} alt="test_image" className="w-full h-[136px] rounded-[10px] object-cover" />
              <div className="absolute top-1 left-1 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <p className="text-[10px] font-medium text-[#0E1629]">{formattedRating}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div className="min-w-0">
                <h3 className="text-(--text-main) font-medium text-[16px] line-clamp-2">{title}</h3>
                <p className="mt-2 text-(--text-muted) text-[10px] font-normal line-clamp-1">
                  {`${totalTests} Tests | ${totalStudents} Students`}
                </p>
                <p className="mt-1 text-(--text-muted) text-[10px] font-normal line-clamp-1">
                  {description || "Structured test series with exam-level practice."}
                </p>
              </div>

              {!isMyTestsCard && (
                <div className="flex items-center gap-1 text-(--text-main) font-medium text-[12px]">
                  <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-3.5 h-3.5" />
                  <p>{displayPrice}</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute right-0.5 bottom-0">
            <svg width="46" height="41" viewBox="0 0 46 41" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          className={`relative w-[200px] ${isMyTestsCard ? "h-[306px]" : "h-[329px]"} md:hidden ${canNavigate ? "cursor-pointer" : ""}`}
          onClick={handleNavigate}
          onKeyDown={handleCardKeyDown}
          role={canNavigate ? "button" : undefined}
          tabIndex={canNavigate ? 0 : -1}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            width="200"
            height={isMyTestsCard ? "306" : "329"}
            viewBox={isMyTestsCard ? "0 0 200 306" : "0 0 200 329"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMyTestsCard ? (
              <path
                d="M192.308 0C196.556 4.19949e-06 200 4.86394 200 10.8639V247C200 253.627 194.627 259 188 259H165.645C160.012 259 155.137 262.918 153.926 268.42L147.726 296.58C146.515 302.082 141.64 306 136.007 306H7.69231C3.44397 306 5.42061e-08 301.136 0 295.136V10.8639C1.36289e-06 4.86394 3.44396 2.18724e-07 7.69231 0H192.308Z"
                fill="white"
              />
            ) : (
              <path
                d="M192.308 0C196.556 4.51514e-06 200 5.22953 200 11.6805V270C200 276.627 194.627 282 188 282H165.645C160.012 282 155.137 285.918 153.926 291.42L147.726 319.58C146.515 325.082 141.64 329 136.007 329H7.69231C3.44397 329 5.42061e-08 323.771 0 317.32V11.6805C1.36289e-06 5.22953 3.44396 2.35164e-07 7.69231 0H192.308Z"
                fill="white"
              />
            )}
          </svg>

          <div className="relative z-10 h-full w-full p-3 flex flex-col">
            <div className="relative">
              <img loading="lazy" decoding="async" src={image} alt="test_image" className="w-full h-[151px] rounded-[10px] object-cover" />
              <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <p className="text-[10px] font-medium text-[#0E1629]">{formattedRating}</p>
              </div>
            </div>

            <div className="mt-2 flex flex-1 flex-col min-h-0">
              <h3 className="text-(--text-main) font-medium text-sm line-clamp-2 leading-[1.3]">{title}</h3>
              <p className="text-(--text-muted) mt-1 font-normal text-[12px] line-clamp-2 leading-[1.35] min-h-8">{description}</p>

              <div className="mt-auto flex flex-col gap-2 pt-1">
                <div className="flex flex-col gap-2 text-[10px] font-normal text-(--text-muted)">
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath={`url(#${mobileTestIconClipId})`}>
                        <path d="M3.33398 3.33333C3.33398 2.97971 3.47446 2.64057 3.72451 2.39052C3.97456 2.14048 4.3137 2 4.66732 2H11.334C11.6876 2 12.0267 2.14048 12.2768 2.39052C12.5268 2.64057 12.6673 2.97971 12.6673 3.33333V12.6667C12.6673 13.0203 12.5268 13.3594 12.2768 13.6095C12.0267 13.8595 11.6876 14 11.334 14H4.66732C4.3137 14 3.97456 13.8595 3.72451 13.6095C3.47446 13.3594 3.33398 13.0203 3.33398 12.6667V3.33333Z" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 4.66699H10" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 7.33301H10" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 10H8.66667" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <clipPath id={mobileTestIconClipId}>
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <p>{`${totalTests} Tests`}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath={`url(#${mobileStudentIconClipId})`}>
                        <path d="M3.33398 4.66667C3.33398 5.37391 3.61494 6.05219 4.11503 6.55228C4.61513 7.05238 5.29341 7.33333 6.00065 7.33333C6.70789 7.33333 7.38617 7.05238 7.88627 6.55228C8.38637 6.05219 8.66732 5.37391 8.66732 4.66667C8.66732 3.95942 8.38637 3.28115 7.88627 2.78105C7.38617 2.28095 6.70789 2 6.00065 2C5.29341 2 4.61513 2.28095 4.11503 2.78105C3.61494 3.28115 3.33398 3.95942 3.33398 4.66667Z" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 14V12.6667C2 11.9594 2.28095 11.2811 2.78105 10.781C3.28115 10.281 3.95942 10 4.66667 10H7.33333C8.04058 10 8.71885 10.281 9.21895 10.781C9.71905 11.2811 10 11.9594 10 12.6667V14" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.666 2.08691C11.2396 2.23378 11.748 2.56738 12.1111 3.03512C12.4742 3.50286 12.6712 4.07813 12.6712 4.67025C12.6712 5.26236 12.4742 5.83763 12.1111 6.30537C11.748 6.77311 11.2396 7.10671 10.666 7.25358" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 13.9996V12.6663C13.9966 12.0777 13.7986 11.5068 13.4368 11.0425C13.0751 10.5783 12.5699 10.2467 12 10.0996" stroke="#6B7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <clipPath id={mobileStudentIconClipId}>
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <p>{`${totalStudents} Students`}</p>
                  </div>
                </div>

                {!isMyTestsCard && (
                  <div className="flex items-center gap-1 text-(--text-main) font-medium text-xs">
                    <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-4 h-4" />
                    <p>{displayPrice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0">
            <svg width="76" height="41" viewBox="0 0 76 41" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M35.8427 6.23929C36.6658 2.5911 39.9067 0 43.6466 0H68C72.4183 0 76 3.58172 76 8V33C76 37.4183 72.4183 41 68 41H38.0061C32.8774 41 29.0735 36.2421 30.2022 31.2393L35.8427 6.23929Z"
                fill="#0E1629"
              />
              <g clipPath={`url(#${mobileArrowLeftClipId})`}>
                <path d="M4.16602 19.583H15.8327" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.5 22.9163L15.8333 19.583" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.5 16.25L15.8333 19.5833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g clipPath={`url(#${mobileArrowRightClipId})`}>
                <path d="M48.166 19.583H59.8327" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M56.5 22.9163L59.8333 19.583" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M56.5 16.25L59.8333 19.5833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id={mobileArrowLeftClipId}>
                  <rect width="20" height="20" fill="white" transform="translate(0 10)" />
                </clipPath>
                <clipPath id={mobileArrowRightClipId}>
                  <rect width="20" height="20" fill="white" transform="translate(44 10)" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
