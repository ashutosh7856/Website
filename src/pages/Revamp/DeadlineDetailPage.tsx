import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEventById, getDeadlines, type EventItem } from "@/api/deadlines";
import DeadlinesCard from "@/components/Revamp/admissions/DeadlinesCard";
import { SeeAllButton } from "@/components/Revamp/components/LeftRightButton";

export default function DeadlineDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();


  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['revamp-deadline-detail', id],
    queryFn: () => getEventById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['revamp-deadlines'],
    queryFn: () => getDeadlines(),
    staleTime: 5 * 60 * 1000,
  });

  const otherDeadlines = useMemo(() => {
    return allEvents
      .filter((e: EventItem) => !e.isDeleted && e.id !== id)
      .slice(0, 4);
  }, [allEvents, id]);

  const breadcrumbTitle = event && event.title.length > 42
    ? `${event.title.slice(0, 42)}…`
    : event?.title ?? "Deadline Name";

  const formatScheduleDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return { datePart: "", timePart: "" };
    
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let timePart = "";
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? 'pm' : 'am';
        const hr12 = h % 12 || 12;
        timePart = `${hr12}:${m < 10 ? '0' + m : m}${ampm}`;
      }
    }

    return { datePart, timePart };
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E1629]"></div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F7FF] gap-4">
        <p className="text-red-600 font-[Poppins] font-medium">Could not load this deadline.</p>
        <button onClick={() => navigate(-1)} className="text-[#0E1629] font-[Poppins] underline font-semibold cursor-pointer hover:opacity-80">
          Go Back
        </button>
      </div>
    );
  }

  const startSchedule = formatScheduleDate(event.startDate, event.startTime);
  const endSchedule = formatScheduleDate(event.endDate, event.endTime);

  return (
    <div className="min-h-screen bg-[#F3F7FF] font-[Poppins] pb-20">
      {/* Breadcrumb */}
      <div className="w-full bg-white border-b border-[#E3E8F4]">
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[60px] py-4 text-[0.875rem] text-[#6B7280] font-medium flex items-center overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => navigate("/admissions")} className="hover:text-[#0E1629] transition-colors cursor-pointer shrink-0">
            Admission
          </button>
          <span className="mx-3 shrink-0">{">"}</span>
          <button type="button" onClick={() => navigate("/admissions/deadlines")} className="hover:text-[#0E1629] transition-colors cursor-pointer shrink-0">
            Deadline
          </button>
          <span className="mx-3 shrink-0">{">"}</span>
          <span className="text-[#0E1629] font-semibold truncate max-w-[200px] sm:max-w-[400px] lg:max-w-none">{breadcrumbTitle}</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-[20px] md:px-[60px] pt-[24px] md:pt-[40px]">
        
        {/* Main Details Section */}
        <div className="flex flex-col md:flex-row gap-[16px] md:gap-[24px] mb-[32px] md:mb-[40px]">
          
          {/* Mobile Top Row: Image + Title + Badges */}
          <div className="flex flex-row md:contents gap-[10px] md:gap-0">
            {/* Image */}
            {event.photoUrl ? (
              <img loading="lazy" decoding="async" 
                src={event.photoUrl} 
                alt={event.title} 
                className="w-[100px] h-[100px] md:w-[320px] md:h-[320px] object-cover rounded-[8px] md:rounded-[16px] shrink-0"
              />
            ) : (
              <div className="w-[100px] h-[100px] md:w-[320px] md:h-[320px] bg-[#E3E8F4] rounded-[8px] md:rounded-[16px] shrink-0 flex items-center justify-center">
                 <span className="text-gray-400 font-medium text-[10px] md:text-base">No Image</span>
              </div>
            )}

            {/* Mobile Title & Badges (Hidden on Desktop) */}
            <div className="flex flex-col justify-start md:hidden w-full gap-[8px]">
              <h1 className="text-[16px] font-semibold text-[#0E1629] font-[Poppins] leading-none capitalize">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-[6px]">
                {event.typeOfEvent && (
                  <div className="bg-[#FA660F14] px-[12px] py-[4px] rounded-[24px] flex items-center justify-center">
                    <span className="text-[#FA660F] text-[10px] font-medium font-[Poppins] leading-none capitalize">
                      {event.typeOfEvent.toLowerCase()}
                    </span>
                  </div>
                )}
                {event.associatedCourseId?.map((course) => (
                  <div key={course} className="bg-[#6B728040] px-[12px] py-[4px] rounded-[24px] flex items-center justify-center">
                    <span className="text-[#0E1629] text-[10px] font-medium font-[Poppins] leading-none capitalize">
                      {course.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-start w-full">
            {/* Desktop Title (Hidden on Mobile) */}
            <h1 className="hidden md:block text-[40px] font-semibold text-[#0E1629] font-[Poppins] leading-none capitalize mb-[12px] max-w-[976px]">
              {event.title}
            </h1>
            
            {/* Description (Shared, scales font size) */}
            <p className="text-[12px] md:text-[18px] font-medium text-[#6B7280] font-[Poppins] leading-[1.3] md:leading-none capitalize mb-[0px] md:mb-[24px] max-w-[976px]">
              {event.description}
            </p>

            {/* Desktop Badges (Hidden on Mobile) */}
            <div className="hidden md:flex flex-wrap gap-[10px]">
              {event.typeOfEvent && (
                <div className="bg-[#FA660F14] px-[20px] py-[8px] rounded-[24px] flex items-center justify-center">
                  <span className="text-[#FA660F] text-[20px] font-medium font-[Poppins] leading-none capitalize">
                    {event.typeOfEvent.toLowerCase()}
                  </span>
                </div>
              )}
              {event.associatedCourseId?.map((course) => (
                <div key={course} className="bg-[#6B728040] px-[20px] py-[8px] rounded-[24px] flex items-center justify-center">
                  <span className="text-[#0E1629] text-[20px] font-medium font-[Poppins] leading-none capitalize">
                    {course.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Schedule Section */}
        <div className="bg-white rounded-[8px] md:rounded-[16px] mb-[40px] md:mb-[60px] w-full min-h-[136px] md:min-h-[171px] flex flex-col justify-center px-[12px] md:px-[24px] py-[16px] md:py-[24px] border border-[#E3E8F4] shadow-sm">
          {/* Schedule Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[12px] md:gap-4 w-full">
            <div className="flex items-center gap-[8px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" viewBox="0 0 24 24" fill="none" stroke="#0E1629" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h2 className="text-[14px] md:text-[20px] font-semibold text-[#0E1629] font-[Poppins] leading-none capitalize">
                Event Schedule
              </h2>
            </div>
            
            {event.applicationUrl && (
              <a 
                href={event.applicationUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-[6px] md:gap-[10px] hover:opacity-80 transition-opacity"
              >
                <span className="text-[12px] md:text-[20px] font-medium text-[#0E1629] font-[Poppins] leading-none capitalize truncate max-w-[200px] md:max-w-[400px]">
                  {event.applicationUrl.replace(/^https?:\/\//, '')}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] md:w-[24px] md:h-[24px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="#0E1629" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="w-full border-t border-[#6B728066] my-[16px] md:my-[20px]"></div>

          {/* Schedule Body */}
          <div className="flex flex-row justify-between items-start w-full gap-[8px] md:gap-0">
            <div className="flex flex-col gap-[4px] md:gap-[8px]">
              <p className="text-[10px] md:text-[20px] font-medium text-[#6B7280] font-[Poppins] leading-none capitalize">
                Start Date
              </p>
              <p className="text-[12px] md:text-[20px] font-medium text-[#0E1629] font-[Poppins] leading-none capitalize">
                {startSchedule.datePart} <span className="font-normal text-[#6B7280] ml-1 block md:inline">{startSchedule.timePart}</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-[4px] md:gap-[8px]">
              <p className="text-[10px] md:text-[20px] font-medium text-[#6B7280] font-[Poppins] leading-none capitalize">
                End Date
              </p>
              <p className="text-[12px] md:text-[20px] font-medium text-[#0E1629] font-[Poppins] leading-none capitalize">
                {endSchedule.datePart} <span className="font-normal text-[#6B7280] ml-1 block md:inline">{endSchedule.timePart}</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-[4px] md:gap-[8px]">
              <p className="text-[10px] md:text-[20px] font-medium text-[#6B7280] font-[Poppins] leading-none capitalize">
                Status
              </p>
              <p className={`text-[12px] md:text-[20px] font-medium font-[Poppins] leading-none capitalize ${!event.isDeleted ? 'text-[#00B54B]' : 'text-red-500'}`}>
                {!event.isDeleted ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Other Deadlines Section */}
        {otherDeadlines.length > 0 && (
          <div className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-[20px] md:mb-[32px] gap-[12px] lg:gap-[24px]">
              {/* Badge */}
              <div className="bg-[#FFFFFF] px-[12px] py-[4px] rounded-[4px] md:rounded-[6px] flex items-center gap-[8px] w-fit shrink-0">
                <div className="w-[12px] h-[12px] md:w-[16px] md:h-[16px] bg-[#0E1629]"></div>
                <h3 className="text-[12px] md:text-[14px] font-semibold text-[#0E1629] font-[Poppins] leading-none text-center tracking-[0.07em] uppercase">
                  OTHER DEADLINES
                </h3>
              </div>
              
              {/* Description Text */}
              <p className="text-[12px] md:text-[22px] font-medium text-[#0E1629] max-w-[350px] md:max-w-[700px] leading-[1.3] md:leading-[1.5] lg:text-left">
                Discover curated programs across mental wellness, assessments, admissions, and upskilling led by experienced professionals, built around your needs.
              </p>
            </div>

            {/* Grid for reusing DeadlinesCard layout from admissions page */}
            <div className="flex gap-[12px] md:gap-6 overflow-x-auto flex-nowrap md:flex-wrap md:overflow-visible justify-start md:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
              {otherDeadlines.map((otherEvent: EventItem, index: number) => (
                <div key={otherEvent.id} className="shrink-0">
                  <DeadlinesCard
                    id={otherEvent.id}
                    examName={otherEvent.title}
                    deadline={formatDateShort(otherEvent.endDate)}
                    details={otherEvent.description}
                    isWhite={index % 2 === 0}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-[20px] md:mt-10 pb-4 md:pb-0 w-full">
              <div className="scale-[0.85] md:scale-100 origin-center md:origin-right">
                <SeeAllButton
                  text="See all"
                  onClick={() => navigate('/admissions/deadlines')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}