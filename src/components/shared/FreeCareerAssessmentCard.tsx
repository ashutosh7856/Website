// import { Flame } from 'lucide-react';
import { useState, useEffect, type JSX } from 'react';
import AppointmentCard from '../appointment-cards/AppointmentCard';
import type { CounselorDetails } from '@/types/academic';
import { useAuthStore } from '@/store/AuthStore';
import type { User } from '@/types/user';
import { Info } from 'lucide-react';

interface Props{
  counselor: CounselorDetails;
  user: User | null;
  onProfileIncomplete: (action: () => void) => void;
}

export function FreeCareerAssessmentCard({counselor, user, onProfileIncomplete}:Props):JSX.Element {
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
      console.log("✅ Running BookAction after login...");
      // small delay to let login modal close before opening appointment modal
      setTimeout(() => {
        setBooking(true);
      }, 300);
    };

    if (!isAuthenticated) {
      console.log('User not authenticated, triggering login with callback');
      setPendingAction(() => bookAction);
      toggleLogin();
      return;
    }

    // Check if profile is complete (firstName and email required)
    if (!user?.firstName || !user?.email) {
      console.log('Profile incomplete, showing profile completion modal');
      onProfileIncomplete(bookAction);
      return;
    }

    bookAction();
  };

  useEffect(() => {
    if (bookingTriggered) {
      console.log("🎯 Detected booking trigger after login — opening modal...");
      setBooking(true);
      setBookingTriggered(false); // reset flag
    }
  }, [bookingTriggered, setBookingTriggered]);

  if(booking){
      return <AppointmentCard counselor={counselor} onClose={() => setBooking(false)} />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold md:font-bold text-[#343C6A]">Free Career Assessment</h3>
            <span className="shrink-0 flex items-center gap-1 bg-[#FFF9D9] text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                <img loading="lazy" decoding="async" 
                  src="/flame.gif" 
                  alt="Flame animation" 
                  className="w-5 h-5"
                /> Trending
            </span>
        </div>
        <p className="text-gray-600 mt-1 font-medium text-sm">30-minute discovery session</p>
        <button
          onClick={handleBookingClick}
          disabled={isCurrentUserCounselor}
          className={`mt-4 w-full text-white text-xs md:text-base font-semibold py-2.5 rounded-lg hover:cursor-pointer transition-colors ${
            isCurrentUserCounselor
            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
            : 'bg-[#FA660F] hover:bg-orange-600'
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
            <p className="md:text-xs text-[10px] text-center text-[#3537B4] mt-2">Discover the approach to a brighter future</p>
         )}
    </div>
  );
}