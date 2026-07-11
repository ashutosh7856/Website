import { X, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";

interface RescheduleAppointmentModalProps {
  userName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RescheduleAppointmentModal({
  appointmentDate,
  startTime,
  endTime,
  onClose,
  onConfirm,
}: RescheduleAppointmentModalProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs(appointmentDate));
  const [selectedStartTime, setSelectedStartTime] = useState(startTime);
  const [selectedEndTime, setSelectedEndTime] = useState(endTime);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef<HTMLDivElement>(null);

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('.MuiPickersCalendarHeader-root') || 
          target.closest('.MuiYearCalendar-root') || 
          target.closest('.MuiMonthCalendar-root') ||
          target.closest('.MuiDayCalendar-root')) {
        return;
      }
      
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (startTimeRef.current && !startTimeRef.current.contains(event.target as Node)) {
        setShowStartTimePicker(false);
      }
      if (endTimeRef.current && !endTimeRef.current.contains(event.target as Node)) {
        setShowEndTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-60"
        onClick={onClose}
      />

      <div
        className="fixed bg-white rounded-2xl shadow-lg z-70 p-5"
        style={{
          width: "580px",
          height: "275px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          border: "1px solid #2B2B2F40",
        }}
      >
        <div>
          <h1 className="text-[20px] font-semibold text-[#343C6A]">Reschedule Meeting</h1>
          <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:cursor-pointer hover:bg-[#262626] group rounded-full transition-colors"
        >
          <X size={18} className="text-gray-500 group-hover:text-white" />
        </button>
        </div>

        <div className="flex gap-3 mt-8">
          <div className="flex flex-col justify-start text-[#232323] font-medium" ref={calendarRef}>
            <label className="text-[16px] mb-2" htmlFor="date">Date</label>
            <div 
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-[182px] h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
            >
              <img loading="lazy" decoding="async" src="/cal.svg" alt="" className="w-4 h-4 shrink-0" />
              <span 
                className="text-[14px] font-medium"
                style={{ 
                  color: selectedDate ? '#232323' : '#6C696980',
                }}
              >
                {selectedDate ? selectedDate.format('MMM D, YYYY') : 'Select Date'}
              </span>
            </div>
            
            {showCalendar && (
              <div className="absolute mt-[68px] z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5]">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      setShowCalendar(false);
                    }}
                    views={['month', 'day']}
                    sx={{
                      '& .MuiPickersCalendarHeader-label': {
                        fontSize: '1rem',
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: '#FA660F',
                        '&:hover': {
                          backgroundColor: '#FA660F',
                        },
                      },
                      '& .MuiPickersDay-root.Mui-selected:focus': {
                        backgroundColor: '#FA660F',
                      },
                      '& .MuiPickersMonth-root.Mui-selected': {
                        backgroundColor: '#FA660F',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#FA660F',
                        },
                      },
                      '& .MuiPickersMonth-monthButton.Mui-selected': {
                        backgroundColor: '#FA660F !important',
                        color: '#ffffff !important',
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            )}
          </div>

          <div className="relative" ref={startTimeRef}>
            <label className="text-[16px] mb-2 block text-[#232323] font-medium" htmlFor="startTime">From</label>
            <div 
              onClick={() => setShowStartTimePicker(!showStartTimePicker)}
              className="w-[150px] h-9 rounded-md border border-[#E5E5E5] hover:cursor-pointer bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
            >
              <Clock size={16} className="shrink-0 text-gray-500" />
              <span 
                className="text-[14px] font-medium"
                style={{ color: '#232323' }}
              >
                {selectedStartTime}
              </span>
            </div>
            
            {showStartTimePicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] max-h-[200px] overflow-y-auto w-[150px] scrollbar-hide">
                {timeOptions.map((time) => (
                  <div
                    key={time}
                    onClick={() => {
                      setSelectedStartTime(time);
                      setShowStartTimePicker(false);
                    }}
                    className={`px-4 py-2 hover:cursor-pointer hover:bg-[#FA660F]/10 text-sm ${
                      selectedStartTime === time ? 'bg-[#FA660F]/20 font-medium' : ''
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={endTimeRef}>
            <label className="text-[16px] mb-2 block text-[#232323] font-medium" htmlFor="endTime">To</label>
            <div 
              onClick={() => setShowEndTimePicker(!showEndTimePicker)}
              className="w-[150px] h-9 rounded-md border border-[#E5E5E5] bg-white px-2 hover:cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
            >
              <Clock size={16} className="shrink-0 text-gray-500" />
              <span 
                className="text-[14px] font-medium"
                style={{ color: '#232323' }}
              >
                {selectedEndTime}
              </span>
            </div>
            
            {showEndTimePicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] max-h-[200px] overflow-y-auto w-[150px] scrollbar-hide">
                {timeOptions.map((time) => (
                  <div
                    key={time}
                    onClick={() => {
                      setSelectedEndTime(time);
                      setShowEndTimePicker(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-[#FA660F]/10 text-sm hover:cursor-pointer ${
                      selectedEndTime === time ? 'bg-[#FA660F]/20 font-medium' : ''
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-[60px]">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#FA660F] text-white rounded-lg hover:cursor-pointer font-medium hover:bg-[#e55d0e] transition-colors"
          >
            Reschedule
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#FA660F] text-[#FA660F] hover:cursor-pointer rounded-lg font-medium hover:bg-[#FA660F]/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
