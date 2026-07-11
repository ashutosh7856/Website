import { MoreVertical, Calendar, Clock } from 'lucide-react';
import type { Appointment } from '@/types/appointment';
import { useState } from 'react';

interface AppointmentCardProps {
  appointment: Appointment;
  onCardClick: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  interestedCourse?: string | null;
}

const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
    return `${day} ${month}, ${weekday}`;
};

const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10), parseInt(minute, 10));
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    }).format(date);
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onCardClick, onCancel, onReschedule, interestedCourse }) => {
  const { counsellorFullName, counsellorPhootoSmall, date, startTime, endTime, status } = appointment;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onCancel(appointment);
  };

  const handleReschedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onReschedule(appointment);
  };

  const showMenu = status === 'booked' || status === 'rescheduled';

  const getStatusContent = (currentStatus: Appointment['status']) => {
    // const baseButtonClasses = "px-4 py-2 text-sm font-semibold rounded-lg transition-colors";
    const statusChipClasses = "px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap";

    switch (currentStatus) {
        case 'completed':
            return (
                <>
                    {/* <button className={`${baseButtonClasses} bg-[#655E95] text-white hover:bg-indigo-800`}>
                        Rate Now
                    </button> */}
                    <div className={`${statusChipClasses} bg-green-100 text-[#28A745]`}>Completed</div>
                </>
            );
        case 'cancelled':
            return (
                <>
                    {/* <button className={`${baseButtonClasses} bg-[#655E95] text-white hover:bg-indigo-800`}>
                        Re-Book
                    </button> */}
                    <div className={`${statusChipClasses} bg-red-100 text-[#EE1C1F]`}>Cancelled</div>
                </>
            );
        default: // 'booked' and 'rescheduled'
            return <div className={`${statusChipClasses} bg-[#E8E7F2] text-[#13097D]`}>Upcoming</div>;
    }
  }

  return (
    <>
      {/*Mobile View*/}
      <div 
        className="block md:hidden bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm relative"
        onClick={() => onCardClick(appointment)}
      >
        {menuOpen && <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>}
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-500">Counselling</p>
          <div className="flex items-center gap-2">
            {getStatusContent(status)}
            {showMenu && (
              <button className="text-gray-400 z-20" onClick={handleMenuToggle}>
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        </div>

        {menuOpen && (
            <div 
              className="absolute right-4 top-14 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-30"
            >
              <button 
                onClick={handleCancel}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleReschedule}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                Reschedule
              </button>
            </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
            <img loading="lazy" decoding="async"
              src={counsellorPhootoSmall || `https://ui-avatars.com/api/?name=${counsellorFullName}&background=random`}
              alt={counsellorFullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold text-base text-[#242645]">{counsellorFullName}</h4>
            <p className="text-sm font-medium text-gray-500">
              {interestedCourse ? `${interestedCourse} Counselling Session` : 'Counselling Session'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1.5 rounded-xl">
              <Calendar className="text-gray-500" size={16} />
            </div>
            <div>
              <p className="text-xs text-[#232323]">Date</p>
              <p className="text-xs font-medium text-[#232323]">{formatDate(date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1.5 rounded-xl">
              <Clock className="text-gray-500" size={16} />
            </div>
            <div>
              <p className="text-xs text-[#232323]">Time</p>
              <p className="text-xs font-medium text-[#232323] text-nowrap">{`${formatTime(startTime)} - ${formatTime(endTime)}`}</p>
            </div>
          </div>
        </div>
      </div>

      {/*Desktop View*/}
      <div className="hidden md:block py-6 cursor-pointer transition-colors rounded-lg -mx-6 px-6 relative"
          onClick={() => onCardClick(appointment)}
      >
        {menuOpen && <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      <img loading="lazy" decoding="async"
                          src={counsellorPhootoSmall || `https://ui-avatars.com/api/?name=${counsellorFullName}&background=random`}
                          alt={counsellorFullName}
                          className="w-full h-full object-cover"
                      />
                  </div>
                  <div>
                      <h4 className="font-semibold text-xl text-[#242645]">{counsellorFullName}</h4>
                      <p className="text-base font-medium text-[#8C8CA1]">
                        {interestedCourse ? `${interestedCourse} Counselling Session` : 'Counselling Session'}
                      </p>
                  </div>
              </div>

              <div className="md:col-span-2">
                  <p className="text-xl font-semibold text-[#242645]">Date</p>
                  <p className="font-medium text-base text-[#8C8CA1] whitespace-nowrap">{formatDate(date)}</p>
              </div>

              <div className="md:col-span-3">
                  <p className="text-xl font-semibold text-[#242645]">Time</p>
                  <p className="font-medium text-base text-[#8C8CA1] whitespace-nowrap">{`${formatTime(startTime)} - ${formatTime(endTime)}`}</p>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-4">
                  {getStatusContent(status)}
                  {showMenu && (
                    <button className="text-black p-2 cursor-pointer rounded-full z-20"
                        onClick={handleMenuToggle}
                    >
                        <MoreVertical size={24} />
                    </button>
                  )}
                  {menuOpen && (
                      <div 
                        className="absolute right-6 top-16 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-30"
                      >
                        <button 
                          onClick={handleCancel}
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:cursor-pointer hover:bg-gray-50 rounded-t-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleReschedule}
                          className="block w-full text-left px-4 py-3 text-sm hover:cursor-pointer text-gray-700 hover:bg-gray-50 rounded-b-lg"
                        >
                          Reschedule
                        </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </>
  );
};

export default AppointmentCard;