import { useState, useEffect, type JSX } from 'react';
import AppointmentCard from '@/components/appointment-cards/AppointmentCard';
import type { CounselorDetails } from '@/types/academic';
import { useAuthStore } from '@/store/AuthStore';
import type { User } from '@/types/user';
import { Info } from 'lucide-react';

interface Props {
  counselor: CounselorDetails;
  user: User | null;
  onProfileIncomplete: (action: () => void) => void;
}

export function RevampFreeCareerAssessmentCard({ counselor, user, onProfileIncomplete }: Props): JSX.Element {
  const [booking, setBooking] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleLogin = useAuthStore((s) => s.toggleLogin);
  const loggedInUserRole = useAuthStore((s) => s.role);
  const setPendingAction = useAuthStore((s) => s.setPendingAction);
  const bookingTriggered = useAuthStore((s) => s.bookingTriggered);
  const setBookingTriggered = useAuthStore((s) => s.setBookingTriggered);

  const isCurrentUserCounselor = loggedInUserRole === 'counselor';

  const handleBookingClick = () => {
    if (isCurrentUserCounselor) {
      console.log("Counselors cannot book appointments with other counselors.");
      return;
    }

    const bookAction = () => {
      // small delay to let login modal close before opening appointment modal
      setTimeout(() => {
        setBooking(true);
      }, 300);
    };

    if (!isAuthenticated) {
      setPendingAction(() => bookAction);
      toggleLogin();
      return;
    }

    // Check if profile is complete (firstName and email required)
    if (!user?.firstName || !user?.email) {
      onProfileIncomplete(bookAction);
      return;
    }

    bookAction();
  };

  useEffect(() => {
    if (bookingTriggered) {
      setBooking(true);
      setBookingTriggered(false);
    }
  }, [bookingTriggered, setBookingTriggered]);

  if (booking) {
    return <AppointmentCard counselor={counselor} onClose={() => setBooking(false)} />;
  }

  return (
    <div className="w-full max-w-[580px] bg-white rounded-[16px] p-[12px] font-poppins shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#0E1629] leading-[125%]">
          Free Career Assessment
        </h3>
        
        <div className="flex items-center gap-[4px] bg-[#FFF9D9] rounded-[24px] px-[10px] py-[4px]">
          <img loading="lazy" decoding="async" 
            src="/flame.gif" 
            alt="Trending" 
            className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
          />
          <span className="text-[12px] sm:text-[14px] font-semibold text-[#232323] leading-none">
            Trending
          </span>
        </div>
      </div>

      <p className="mt-[8px] text-[13px] sm:text-[14px] font-medium text-[#6B7280] leading-none">
        30-minute discovery session
      </p>

      <button
        onClick={handleBookingClick}
        disabled={isCurrentUserCounselor}
        className={`mt-[16px] w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] sm:text-[16px] font-medium transition-colors ${
          isCurrentUserCounselor
            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
            : 'bg-[#0E1629] text-white hover:bg-gray-800 cursor-pointer'
        }`}
      >
        {isCurrentUserCounselor ? 'Cannot Book (Counselor)' : 'Book Appointment Now'}
      </button>

      {isCurrentUserCounselor && (
        <div className="mt-2 p-1.5 bg-yellow-50 text-yellow-800 text-xs rounded-md flex items-center gap-1.5 justify-center">
          <Info size={14} /> Counselors cannot book appointments.
        </div>
      )}

      {!isCurrentUserCounselor && (
        <p className="mt-[12px] text-center text-[13px] sm:text-[14px] font-medium text-[#6B7280] leading-none">
          Discover the approach to a brighter future
        </p>
      )}
    </div>
  );
}