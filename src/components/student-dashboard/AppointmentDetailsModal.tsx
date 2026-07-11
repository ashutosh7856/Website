import type { Appointment } from '@/types/appointment';
import { X, Calendar, Clock, MapPin, CheckCircle, ChevronLeft, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/AuthStore';
import { getAppointmentById } from '@/api/appointment';
import { useQuery } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onNavigateToCounselor: (counselorId: string) => void;
}
const calculateDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startDate = new Date(0, 0, 0, startHour, startMinute);
  const endDate = new Date(0, 0, 0, endHour, endMinute);
  
  let diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / 60000);
};
const formatTime = (timeStr: string) => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(`${dateStr}T00:00:00`);
  return format(date, 'd MMM, yyyy');
};

export default function AppointmentDetailsModal({ isOpen, onClose, appointment, onNavigateToCounselor }: Props) {
  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const { data: fullDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['appointment', 'details', appointment?.appointmentId],
    queryFn: async () => {
      return getAppointmentById(userId!, appointment!.appointmentId, token!);
    },
    
    enabled: !!isOpen && !!appointment && !!userId && !!token,
    staleTime: 1000 * 60,
    retry: false, 
  });
  const zoomLink = fullDetails?.zoomMeetingLink;
  const rawNotes = fullDetails?.notes;
  const cancellationReason = (rawNotes && rawNotes !== "NA") 
    ? rawNotes 
    : "Counsellor is out of office";

  if (!isOpen || !appointment) return null;

  const isCancelled = appointment.status === 'cancelled';
  const isCompleted = appointment.status === 'completed';
  const modalTitle = isCancelled 
    ? 'Appointment Cancelled' 
    : isCompleted 
      ? 'Appointment Completed' 
      : 'Appointment Confirmed';

  const imageUrl = appointment.counsellorPhootoSmall || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.counsellorFullName)}&background=E0E7FF&color=4F46E5`;

  const duration = calculateDuration(appointment.startTime, appointment.endTime);
  const timeRange = `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`;

  const StatusDisplay = () => {
    const statusText = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
    
    if (isCancelled) {
      return (
        <span className="font-medium text-[#EE1C1F] capitalize flex items-center gap-1">
          <XCircle size={16} /> {statusText}
        </span>
      );
    }
    
    return (
      <span className="font-medium text-green-600 capitalize flex items-center gap-1">
        <CheckCircle size={16} /> {statusText}
      </span>
    );
  };

  const handleCounselorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToCounselor(appointment.counsellorId);
    onClose();
  };

  const JoinButton = () => {
    if (isCancelled || isCompleted) {
      return (
        <button 
          disabled
          className="bg-gray-300 text-gray-500 font-medium px-6 py-2 rounded-lg text-sm cursor-not-allowed"
        >
          Join
        </button>
      );
    }
    if (isLoadingDetails) {
      return (
        <button 
          disabled
          className="bg-gray-400 text-white font-medium px-6 py-2 rounded-lg text-sm inline-flex items-center"
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </button>
      );
    }
    if (zoomLink) {
      return (
        <a 
          href={zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
        >
          Join
        </a>
      );
    }
    if (appointment.mode === 'offline') {
      return (
        <span className="text-sm text-gray-500 font-medium">
          In-person meeting
        </span>
      );
    }
    return (
      <span className="text-sm text-red-500 font-medium">
        Link not available
      </span>
    );
  };

  const CancellationReasonBlock = () => {
    if (!isCancelled || !fullDetails) return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
        <h3 className="font-semibold text-[#9B1C1C] text-sm mb-1">Cancellation Reason</h3>
        <p className="text-sm text-[#9B1C1C]/80 leading-relaxed">
          {cancellationReason}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      
      {/* Mobile View */}
      <div className="md:hidden h-full w-full bg-[#F5F7FA] flex flex-col">
        <header className="shrink-0 flex items-center p-4 bg-white border-b border-gray-200">
          <button onClick={onClose} className="p-2 mr-2">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-[#343C6A]">{modalTitle}</h2>
        </header>

        <div className="grow overflow-y-auto p-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleCounselorClick}
            >
              <img loading="lazy" decoding="async" 
                src={imageUrl} 
                alt={appointment.counsellorFullName} 
                className="w-12 h-12 rounded-full object-cover" 
              />
              <div>
                <p className="font-medium text-gray-500 text-sm">Counselling Session</p>
                <p className="font-semibold text-gray-800">with {appointment.counsellorFullName}</p>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(appointment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Timing</p>
                  <p className="text-sm font-semibold text-gray-700">{timeRange}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-800">Session Details</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} /> Duration: {duration} Minutes
                </span>
                <StatusDisplay />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600 capitalize">
                  <MapPin size={16} /> Format: {appointment.mode === 'offline' ? 'In-person' : 'Online'}
                </span>
                <JoinButton />
              </div>
            </div>
            <CancellationReasonBlock />
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
             <h3 className="font-semibold text-gray-800">Need Help</h3>
             <p className="text-sm text-gray-500 mt-1 mb-4">Our team is here to assist you with any questions</p>
             <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="tel:7004789484" className="text-sm font-medium text-gray-700">📞 70047 89484</a>
                <a href="mailto:support@procounsel.co.in" className="text-sm font-medium text-gray-700">✉️ support@procounsel.co.in</a>
             </div>
          </div>
        </div>
      </div>

      {/* Desktop View*/}
      <div 
        className="hidden md:block w-full max-w-md bg-white rounded-xl shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:cursor-pointer hover:text-gray-700">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-[#343C6A] mb-6">{modalTitle}</h2>
        <div className="bg-white rounded-xl p-4">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleCounselorClick}
            >
              <img loading="lazy" decoding="async" src={imageUrl} alt={appointment.counsellorFullName} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <p className="font-medium text-gray-500 text-sm">Counselling Session</p>
                <p className="font-semibold text-gray-800 text-lg">with {appointment.counsellorFullName}</p>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(appointment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Timing</p>
                  <p className="text-sm font-semibold text-gray-700">{timeRange}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-800">Session Details</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} /> Duration: {duration} Minutes
                </span>
                <StatusDisplay />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600 capitalize">
                  <MapPin size={16} /> Format: {appointment.mode === 'offline' ? 'In-person' : 'Online'}
                </span>
                <JoinButton />
              </div>
            </div>
            <CancellationReasonBlock />
          </div>
          <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
             <h3 className="font-semibold text-gray-800">Need Help?</h3>
             <p className="text-sm text-gray-500 mt-1 mb-4">Our team is here to assist you with any questions</p>
             <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="tel:7004789484" className="text-sm font-medium text-gray-700">📞 70047 89484</a>
                <a href="mailto:support@procounsel.co.in" className="text-sm font-medium text-gray-700">✉️ support@procounsel.co.in</a>
             </div>
          </div>
      </div>
    </div>
  );
}