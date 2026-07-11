import { useQuery } from "@tanstack/react-query";
import FancyCard from "./DeadlinesCard";
import { SeeAllButton } from "../components/LeftRightButton";
import { getDeadlines, type EventItem } from "@/api/deadlines";
import { useNavigate } from "react-router-dom";

export default function CollegeSection() {
  const navigate = useNavigate();
  const { data: allEvents = [], isLoading, isError } = useQuery({
    queryKey: ['revamp-deadlines'],
    queryFn: () => getDeadlines(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Dedup by id, then filter active, then sort by soonest end date first
  const activeEvents = (() => {
    const seen = new Set<string>();
    return allEvents
      .filter((event: EventItem) => {
        if (event.isDeleted) return false;
        const key = event.id ?? event.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a: EventItem, b: EventItem) => {
        const aTime = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const bTime = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        return aTime - bTime;
      });
  })();

  const displayEvents = activeEvents.slice(0, 4);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-[#C6DDF040] w-full py-6 md:py-[60px]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Mobile Header */}
        <div className="md:hidden flex flex-col items-start justify-start gap-[12px] mb-6">
          <div className="flex items-center justify-center gap-[8px] bg-white px-[12px] py-[4px] rounded-[4px] w-[125px] h-[26px] shrink-0">
            <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] bg-[#0E1629] shrink-0" />
            <p className="font-[Poppins] font-semibold text-[12px] text-[#0E1629] uppercase tracking-[0.07em] leading-none">
              DEADLINES
            </p>
          </div>
          <p className="font-[Poppins] font-medium text-[12px] text-[#0E1629] max-w-[350px] h-[54px] leading-none">
            Track exam forms, counselling rounds, and scholarship application
            deadlines so you never miss a critical date.
          </p>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between mb-8">
          <div className="flex items-start">
            <img loading="lazy" decoding="async" src="/deadlines.svg" alt="icon_avg" className="items-start" />
          </div>

          <h2 className="text-(--text-main) text-2xl font-medium max-w-[682px]">
            Stay updated with upcoming exam, counselling, and scholarship
            timelines to plan applications confidently.
          </h2>
        </div>

        {/* Loading, Error, and Empty States */}
        {isLoading ? (
          <div className="flex gap-3 md:gap-6 mb-6 md:mb-8 overflow-x-auto flex-nowrap justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 snap-x snap-mandatory animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`deadline-skeleton-${idx}`}
                className="shrink-0 snap-start w-[165px] min-[400px]:w-[185px] sm:w-[200px] md:w-[312px] h-[210px] md:h-[322px] rounded-[20px] bg-white/80"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex justify-center min-h-[300px] items-center">
            <p className="font-[Poppins] text-[14px] text-red-500">Failed to load deadlines</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="flex justify-center min-h-[300px] items-center">
            <p className="font-[Poppins] text-[14px] text-[#6B7280]">No active deadlines found</p>
          </div>
        ) : (
          /* Dynamic Data Render */
          <div className="flex gap-3 md:gap-6 mb-6 md:mb-8 overflow-x-auto flex-nowrap justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 snap-x snap-mandatory">
            {displayEvents.map((event: EventItem, index: number) => (
              <div
                key={event.id}
                className="shrink-0 snap-start w-[165px] min-[400px]:w-[185px] sm:w-[200px] md:w-[312px]"
              >
                <FancyCard
                  id={event.id}
                  examName={event.title}
                  deadline={formatDate(event.endDate)}
                  details={event.description}
                  isWhite={index % 2 === 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* See All Button */}
        <div className="flex justify-end mt-4 md:mt-0 pb-4 md:pb-0 w-full">
          <div className="scale-[0.85] md:scale-100 origin-center md:origin-right">
            <SeeAllButton
              text="See all"
              onClick={() => navigate('/admissions/deadlines')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}