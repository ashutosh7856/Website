import { X } from "lucide-react";
const DEFAULT_COUNSELOR_IMAGE = "/discover-imageCounselor2.webp";

interface Props {
  counselorName?: string;
  appointmentDate?: string; // expected YYYY-MM-DD
  appointmentTime?: string; // expected HH:MM (24h)
  counselorImage?: string;
  onClose?: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return '03 Sept, 2025';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(hhmm?: string) {
  if (!hhmm) return '10:30-11:00 AM';
  const parts = hhmm.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 1 || isNaN(parts[0])) return hhmm;
  const hours = parts[0];
  const minutes = parts[1] || 0;
  
  // Format start time in 24-hour format
  const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Add 30 minutes for end time
  const endMinutes = minutes + 30;
  const endHours = hours + Math.floor(endMinutes / 60);
  const finalMinutes = endMinutes % 60;
  const endTime = `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  
  // Determine AM/PM based on the end time
  const ampm = endHours >= 12 ? 'PM' : 'AM';
  
  return `${startTime}-${endTime} ${ampm}`;
}

export default function BookingConfirmationCard({ counselorName = 'Ashutosh Kumar', appointmentDate, appointmentTime, counselorImage, onClose }: Props){

  return (
    <div 
      className="fixed inset-0 bg-[#232323]/50 md:backdrop-blur-sm flex items-center justify-center md:p-4 z-100" 
      onClick={() => onClose?.()}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-[#F5F7FA] w-full h-full md:h-auto flex flex-col md:max-w-[747px] md:max-h-[667px] md:rounded-2xl relative p-4 md:p-[42px] pb-[60px] md:pb-[86px] gap-4 md:gap-6 overflow-y-auto custom-scrollbar"
      >
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
          .custom-scrollbar::-webkit-scrollbar-corner { background: transparent; }
          .custom-scrollbar { 
            border-radius: 16px;
            -webkit-mask: linear-gradient(white 0 0);
            mask: linear-gradient(white 0 0);
          }
        `}</style>
        <div className="flex items-center gap-2 text-[#343C6A]">
          <p className="text-xl md:text-2xl font-semibold">Appointment Confirmation</p>
            <button 
            onClick={() => onClose?.()}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-black group"
          >
            <X className="h-5 w-5 text-gray-500 group-hover:text-white hover:cursor-pointer" />
          </button>
        </div>



        <div className="flex flex-col items-center gap-4 md:gap-6">
          <div className="flex flex-col items-center max-w-[450px] gap-3 md:gap-4">
          <div className="animate-bounce">
            <img loading="lazy" decoding="async" src="/greentick.svg" alt="" className="w-[50px] h-[50px] md:w-[62px] md:h-[62px] animate-pulse"/>
          </div>
          <h1 className="text-xl md:text-2xl text-[#3537b4] font-semibold text-center">Appointment Confirmed</h1>
          <p className="text-[14px] md:text-[16px] text-[#718ebf] font-medium text-center px-4">Thank you for booking! Your appointment has been confirmed.</p>
        </div>

        <div className="flex flex-col gap-4 bg-white w-full max-w-[482px] md:h-[331px] border border-[#f5f5f5] rounded-[12px] p-4">

          <div className="flex gap-2 items-center">
            <img loading="lazy" decoding="async" src={counselorImage || DEFAULT_COUNSELOR_IMAGE} alt={counselorName} className="w-12 h-12 md:w-16 md:h-16 rounded-[10px] object-cover" />
            <p className="flex flex-col gap-0 text-[16px] md:text-[18px] text-[#343c6a] font-semibold">Counselling Session<span className="text-[14px] md:text-[16px] text-[#718ebf] font-medium">with {counselorName}</span></p>
          </div>

          <div className="flex flex-col md:flex-row justify-between bg-[#f5f5f5] w-full md:w-[450px] md:h-[66px] items-start md:items-center gap-3 md:gap-0 px-4 md:px-10 py-3 md:py-0 rounded-[12px]">

            <div className="flex gap-2 items-center">
              <div className="bg-[#c3f9d966]/40 h-8 w-8 flex items-center justify-center rounded-full shrink-0">
              <img loading="lazy" decoding="async" src="/calander.svg" alt="" className="h-[22px] w-[22px]"/>
              </div>
              <p className="flex flex-col text-[#8C8CA1] font-normal text-[13px] md:text-[14px]">Date <span className="text-[#232323] text-[15px] md:text-[16px] font-medium">{formatDate(appointmentDate)}</span></p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="bg-[#C3F9D966]/40 h-8 w-8 flex items-center justify-center rounded-full shrink-0">
              <img loading="lazy" decoding="async" src="/calander.svg" alt="" className="h-[22px] w-[22px]"/>

              </div>
              <p className="flex flex-col text-[#8c8ca1] text-[13px] md:text-[14px] font-normal">Timing <span className="text-[#232323] text-[15px] md:text-[16px] font-medium">{formatTime(appointmentTime)}</span></p>
            </div>

          </div>

            <div className="flex w-full md:w-[450px] md:h-[117px] rounded-[12px] justify-start p-4 bg-[#F9FAFC] border border-[#f5f5f5]">

              <p className="flex flex-col gap-2 text-[#343c6a] font-semibold text-[16px] md:text-[18px]">
                Session Details
                <span className="flex items-center gap-2 text-[#718ebf] text-[14px] md:text-[16px] font-normal">
                  <img loading="lazy" decoding="async" src="/clock.svg" alt="clock" className="h-4 w-4 md:h-5 md:w-5" />
                  Duration: 30 Minutes

                </span>
                <span className="flex items-center gap-2 text-[#718ebf] text-[14px] md:text-[16px] font-normal">
                  <img loading="lazy" decoding="async" src="/map.svg" alt="map" className="w-4 h-4 md:w-5 md:h-5"/>
                  Format: Online
                </span>
              </p>
            </div>

        </div>

        <div className="flex flex-col gap-3 md:gap-4 items-center">

          <div className="bg-[#ffffff] shadow-[#232323]/15 w-12 h-12 md:w-14 md:h-14 flex justify-center items-center rounded-[12px]">
          <img loading="lazy" decoding="async" src="/text.svg" alt="text" className="w-8 h-8 md:w-10 md:h-10" />
          </div>

          <p className="flex flex-col items-center gap-2 text-[#232323] font-semibold text-[15px] md:text-[16px] text-center">Need Help?
            <span className="text-[#718ebf] text-[13px] md:text-[14px] font-medium px-4">Our team is here to assist you any questions</span>
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-10 text-[13px] md:text-[14px]">

            <div className="flex gap-2 items-center justify-center">
              <img loading="lazy" decoding="async" src="/phone.svg" alt="phone" className="h-8 w-8 md:h-10 md:w-10" />
              7893453245
            </div>

            <div className="flex gap-2 items-center justify-center">
              <img loading="lazy" decoding="async" src="/email.png" alt="email" className="h-6 w-6 md:h-7 md:w-7" />
              support@procounsel.co.in
            </div>


          </div>

        </div>

        </div>

      </div>
    </div>
  );
}
