import type { AllCounselor } from "@/types/academic";
import { Star } from "lucide-react";
import { useState } from "react";
import AppointmentCard from "@/components/appointment-cards/AppointmentCard";

interface ChatbotCounselorCardProps {
  counselor: AllCounselor;
}


export function ChatbotCounselorCard({ counselor }: ChatbotCounselorCardProps) {
  const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23404040'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zm0 5c-13.807 0-25 8.731-25 19.5V75h50v-5.5C75 58.731 63.807 50 50 50z' fill='%23888'/%3E%3C/svg%3E";
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBookingModal(true);
  };

  // Convert AllCounselor to CounselorDetails format for AppointmentCard
  const counselorDetails = {
    ...counselor,
    counsellorId: counselor.counsellorId,
    photoUrlSmall: counselor.photoUrlSmall,
    fullOfficeAddress: counselor.fullOfficeAddress || {},
    workingDays: counselor.workingDays || [],
    officeStartTime: counselor.officeStartTime || "09:00",
    officeEndTime: counselor.officeEndTime || "18:00",
  };

  const fullName = `${counselor.firstName} ${counselor.lastName}`;

  return (
    <>
      <div className="bg-[#141414] rounded-2xl px-3 md:px-4 pt-3 md:pt-4 pb-4 border-[#6C6969] border-[1px] w-[320px] md:w-[380px] h-[92px]">
        <div className="flex gap-2 md:gap-3 text-[#6C6969] font-sans">
          <img loading="lazy" decoding="async"
            src={counselor?.photoUrlSmall || fallback}
            alt={fullName}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-[#6C6969] border-[1px] shrink-0"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            }}
          />

          {/* Left column: Name and City/Exp */}
          <div className="flex gap-2 md:gap-[18px] flex-1 min-w-0">
            <div className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0">
              <h3
                className="text-white font-medium text-sm md:text-base leading-tight truncate"
                title={fullName}
              >
                {fullName}
              </h3>

              <div className="flex items-center gap-3 md:gap-[18px]">
                <p
                  className="flex items-center gap-0.5 md:gap-1 text-[0.875rem] md:text-[1rem] font-normal max-w-[80px] md:max-w-[100px]"
                  title={counselor?.city}
                >
                  <img loading="lazy" decoding="async" src="/location.svg" alt="" className="shrink-0 w-3 h-3 md:w-4 md:h-4" />
                  <span className="truncate">{counselor?.city}</span>
                </p>

                <p className="flex items-center gap-0.5 md:gap-1 shrink-0 text-[0.875rem] md:text-[1rem] font-normal">
                  <img loading="lazy" decoding="async" src="/exp.svg" alt="" className="shrink-0 w-3 h-3 md:w-4 md:h-4" />
                  {counselor?.experience}+ Yrs
                </p>
              </div>
            </div>

            {/* Right column: Rating and Button */}
            <div className="flex flex-col items-end justify-between shrink-0">
              <p className="flex items-center gap-0.5 md:gap-1 text-sm md:text-base font-medium">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                {counselor?.rating?.toFixed(1)}
              </p>

              <button
                onClick={handleBookNow}
                className="
                  bg-white
                  border
                  rounded-[4px]
                  text-[#1A1A1A]
                  text-xs md:text-[14px]
                  font-medium
                  h-[26px] w-[92px]
                  px-[12px] py-[4px]
                  whitespace-nowrap
                  flex items-center justify-center
                  hover:bg-gray-100
                  transition-colors
                  cursor-pointer
                "
              >
                Book Now
              </button>

            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <AppointmentCard
          counselor={counselorDetails as any}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  )
}