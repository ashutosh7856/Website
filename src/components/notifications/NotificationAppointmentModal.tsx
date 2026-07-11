import React, { useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, ChevronLeft, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/AuthStore';
// import type { AppointmentDetails } from '@/types/appointment';
import type { ActivityLog } from '@/types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: any; 
  notification: ActivityLog;
  onNavigateToCounselor: (targetId: string) => void;
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

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return 'N/A';
  const date = new Date(`${dateStr}T00:00:00`);
  return format(date, 'd MMM, yyyy');
};

export default function NotificationAppointmentModal({ 
  isOpen, 
  onClose, 
  appointment, 
  notification,
  onNavigateToCounselor 
}: Props) {
  
  const { role } = useAuthStore();
  const isCounselor = role === 'counselor';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const getFallbackName = () => {
    const text = notification.activity || "";
    const match = text.match(/with\s+(.+?)(?:\s+has|\s+on|\.|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return isCounselor ? "Student" : "Counsellor";
  };

  let displayName = "";
  let imageUrl = "";

  if (isCounselor) {
    displayName = appointment.userFullName || appointment.userName || getFallbackName();
    imageUrl = appointment.userPhootoSmall || appointment.userPhoto || notification.photo || "";
  } else {
    displayName = (appointment.counsellorFullName && appointment.counsellorFullName.trim() !== "")
      ? appointment.counsellorFullName
      : getFallbackName();
      
    imageUrl = appointment.counsellorPhootoSmall || notification.photo || "";
  }
  
  if (!imageUrl) {
    imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E0E7FF&color=4F46E5`;
  }

  const status = appointment.status || 'booked';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  
  const modalTitle = isCancelled 
    ? 'Appointment Cancelled' 
    : isCompleted 
      ? 'Appointment Completed' 
      : 'Appointment Confirmed';

  const zoomLink = appointment.zoomMeetingLink;
  const rawNotes = appointment.notes;
  const cancellationReason = (rawNotes && rawNotes !== "NA") 
    ? rawNotes 
    : "Counsellor is out of office";

  const duration = (appointment.startTime && appointment.endTime) 
    ? calculateDuration(appointment.startTime, appointment.endTime) 
    : 0;
    
  const timeRange = (appointment.startTime && appointment.endTime)
    ? `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`
    : 'Time N/A';

  const dateDisplay = formatDate(appointment.date);

  const StatusDisplay = () => {
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    
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

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isCounselor) {
        const targetId = appointment.userId || notification.activitySenderId;
        onNavigateToCounselor(targetId); 
    } else {
        const targetId = appointment.counsellorId || notification.activitySenderId;
        onNavigateToCounselor(targetId);
    }
  };

  const CancellationReasonBlock = () => {
    if (!isCancelled) return null;

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
    <div className="fixed top-0 left-0 w-screen h-screen z-9999 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      
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
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleHeaderClick}
            >
              <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border border-gray-100">
                <img loading="lazy" decoding="async" 
                  src={imageUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <p className="font-medium text-gray-500 text-sm">Counselling Session</p>
                <p className="font-semibold text-gray-800 text-lg hover:text-[#13097D] transition-colors">
                  with {displayName}
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-700">{dateDisplay}</p>
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

      {/* Desktop View */}
      <div 
        className="hidden md:block w-full max-w-md bg-white rounded-xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold text-[#343C6A] mb-6 pr-8">{modalTitle}</h2>
        
        <div className="bg-white rounded-xl">
          <div 
            className="flex items-center gap-3 cursor-pointer transition-opacity rounded-lg p-2 -m-2"
            onClick={handleHeaderClick}
          >
            <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border border-gray-100">
              <img loading="lazy" decoding="async" 
                src={imageUrl} 
                alt={displayName} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <p className="font-medium text-gray-500 text-sm">Counselling Session</p>
              <p className="font-semibold text-gray-800 text-lg transition-colors">
                with {displayName}
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-semibold text-gray-700">{dateDisplay}</p>
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

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
             <h3 className="font-semibold text-gray-800 text-sm">Need Help?</h3>
             <p className="text-xs text-gray-500 mt-1 mb-3">Our team is here to assist you with any questions</p>
             <div className="flex justify-center items-center gap-4">
                <a href="tel:7004789484" className="text-xs font-medium text-gray-700 hover:text-[#13097D]">📞 70047 89484</a>
                <a href="mailto:support@procounsel.co.in" className="text-xs font-medium text-gray-700 hover:text-[#13097D]">✉️ support@procounsel.co.in</a>
             </div>
        </div>
      </div>
    </div>
  );
}