import { avatar1, avatar2, avatar3, avatar4 } from "../../../assets/avatars";
import RatingBadge from "./RatingBadge";

interface LiveSessionCardProps {
  isLoading?: boolean;
  title?: string;
  coverImage?: string;
  sessionDate?: string;
  info?: string;
  duration?: string;
  participantCount?: number;
  participantAvatars?: string[];
  rating?: string | number;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export default function LiveSessionCard({
  isLoading = false,
  title = "Live Profile Building Workshop",
  coverImage = "/course/2.png",
  sessionDate = "Mar 15, 2026",
  info = "Join expert-led sessions to build a strong application profile and improve your admission outcomes.",
  duration = "50 min",
  participantCount = 40,
  rating = "4.8",
  participantAvatars = [
    avatar1,
    avatar2,
    avatar3,
    avatar4,
  ],
  ctaLabel = "Join Session",
  onCtaClick,
}: LiveSessionCardProps) {
  if (isLoading) {
    return (
      <div className="w-78 h-[28.188rem] bg-white p-3 rounded-2xl flex flex-col gap-2.5 animate-pulse">
        <div className="w-full h-65 rounded-xl bg-gray-200" />

        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-[72%] rounded bg-gray-200" />
          <div className="h-3 w-[42%] rounded bg-gray-100" />

          <div className="flex gap-2 mt-2">
            <div className="h-3 w-[38%] rounded bg-gray-200" />
            <div className="h-3 w-[32%] rounded bg-gray-200" />
          </div>

          <div className="h-10 rounded-lg bg-gray-200 mt-3" />

          <div className="h-12 rounded-xl bg-gray-100 mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <article className="group w-78 bg-white p-3 rounded-2xl flex flex-col gap-2.5 border border-transparent transition-all duration-300 hover:border-[#0E16291F] hover:shadow-[0_20px_36px_-24px_rgba(14,22,41,0.45)]">
      <div className="w-full h-65 rounded-xl bg-gray-300 relative">
        <RatingBadge rating={rating} />
        <img loading="lazy" decoding="async"
          src={coverImage}
          alt={title}
          className="w-[18rem] h-65 rounded-xl object-cover transition-transform duration-500"
        />

        <div
          className="z-30 absolute left-5 right-5 rounded-[40px] h-10 py-1 px-2 flex items-center justify-between gap-1 overflow-hidden"
          style={{
            top: "15rem",
            background:
              "linear-gradient(0deg, rgba(19, 9, 125, 0.08) 0%, rgba(19, 9, 125, 0.08) 100%), #FFF",
          }}
        >
          <div className="flex shrink-0 items-center -space-x-2">
            {participantAvatars.slice(0, 4).map((avatar, index) => (
              <img loading="lazy" decoding="async"
                key={index}
                src={avatar}
                alt={`participant ${index + 1}`}
                className="object-cover"
                style={{
                  width: "1.875rem",
                  height: "1.875rem",
                  aspectRatio: "1/1",
                  borderRadius: "1.875rem",
                  border: "2px solid white",
                  zIndex: 10 - index,
                }}
              />
            ))}
          </div>
          <span
            className="min-w-0 truncate text-[#0E1629] text-[1rem] font-medium leading-4.5"
            style={{ fontFamily: "Poppins" }}
          >
            +{participantCount} Participants
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        <div className="flex flex-col gap-2 mt-3">
          <h3 className="text-(--text-main) font-semibold text-[1.25rem] truncate">
            {title}
          </h3>
          <p className="text-(--text-muted) font-normal text-[1.125rem] max-h-13.5">
            {info}
          </p>
          <div className="pt-2 flex gap-[0.89rem]">
            <p className="flex  items-center gap-1 font-normal text-(--text-muted) text-[0.75rem]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <g clip-path="url(#clip0_177_816)">
                  <path
                    d="M3 5.25C3 4.85218 3.15804 4.47064 3.43934 4.18934C3.72064 3.90804 4.10218 3.75 4.5 3.75H13.5C13.8978 3.75 14.2794 3.90804 14.5607 4.18934C14.842 4.47064 15 4.85218 15 5.25V14.25C15 14.6478 14.842 15.0294 14.5607 15.3107C14.2794 15.592 13.8978 15.75 13.5 15.75H4.5C4.10218 15.75 3.72064 15.592 3.43934 15.3107C3.15804 15.0294 3 14.6478 3 14.25V5.25Z"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M12 2.25V5.25"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M6 2.25V5.25"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M3 8.25H15"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.25 12C8.25 12.1989 8.32902 12.3897 8.46967 12.5303C8.61032 12.671 8.80109 12.75 9 12.75C9.19891 12.75 9.38968 12.671 9.53033 12.5303C9.67098 12.3897 9.75 12.1989 9.75 12C9.75 11.8011 9.67098 11.6103 9.53033 11.4697C9.38968 11.329 9.19891 11.25 9 11.25C8.80109 11.25 8.61032 11.329 8.46967 11.4697C8.32902 11.6103 8.25 11.8011 8.25 12Z"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_177_816">
                    <rect width="18" height="18" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              {sessionDate}
            </p>
            <p className="flex items-center gap-1 font-normal text-(--text-muted) text-[0.75rem] ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <g clip-path="url(#clip0_177_825)">
                  <path
                    d="M2.25 9C2.25 9.88642 2.42459 10.7642 2.76381 11.5831C3.10303 12.4021 3.60023 13.1462 4.22703 13.773C4.85382 14.3998 5.59794 14.897 6.41689 15.2362C7.23583 15.5754 8.11358 15.75 9 15.75C9.88642 15.75 10.7642 15.5754 11.5831 15.2362C12.4021 14.897 13.1462 14.3998 13.773 13.773C14.3998 13.1462 14.897 12.4021 15.2362 11.5831C15.5754 10.7642 15.75 9.88642 15.75 9C15.75 8.11358 15.5754 7.23583 15.2362 6.41689C14.897 5.59794 14.3998 4.85382 13.773 4.22703C13.1462 3.60023 12.4021 3.10303 11.5831 2.76381C10.7642 2.42459 9.88642 2.25 9 2.25C8.11358 2.25 7.23583 2.42459 6.41689 2.76381C5.59794 3.10303 4.85382 3.60023 4.22703 4.22703C3.60023 4.85382 3.10303 5.59794 2.76381 6.41689C2.42459 7.23583 2.25 8.11358 2.25 9Z"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M9 9L11.25 7.5"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M9 5.25V9"
                    stroke="#6B7280"
                    stroke-width="1.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_177_825">
                    <rect width="18" height="18" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              {duration}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCtaClick}
          className="group/btn mt-auto flex gap-2.5 items-center justify-center border border-(--text-main) text-(--text-main) px-2.5 py-2 rounded-[12px] cursor-pointer transition-colors duration-300 hover:bg-(--text-main) hover:text-white"
        >
          {ctaLabel}
          <span className="relative w-5 h-5 overflow-hidden">
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className="absolute inset-0 w-full h-full transition-all duration-300 group-hover/btn:translate-x-5 group-hover/btn:opacity-0"
              style={{ filter: "brightness(0)" }}
            />
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className="absolute inset-0 w-full h-full -translate-x-5 opacity-0 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </span>
        </button>
      </div>
    </article>
  );
}
