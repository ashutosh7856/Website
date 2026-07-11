import { CalendarDays,Star, X } from "lucide-react";
import { Button } from "../ui";
import { useState, useEffect, useCallback, type JSX } from "react";
import type {CounselorDetails } from "@/types/academic";
import MorningSlots from "./MorningSlots";
import AfterNoonSlots from "./AfterNoonSlots";
import EveningSlots from "./EveningSlots";
import { Calendar } from "../ui/calendar";
import { useAuthStore } from '@/store/AuthStore';
import { academicApi } from '@/api/academic';
import BookingConfirmationCard from "./BookingConfirmationCard";
import toast from 'react-hot-toast';
import type { Appointment } from "@/types/appointment";
import { rescheduleAppointment } from "@/api/appointment";

interface Props {
  counselor: CounselorDetails;
  onClose?: () => void;
  isReschedule?: boolean;
  appointmentToReschedule?: Appointment;
  onRescheduleSuccess?: () => void;
}

export default function AppointmentCard({ 
  counselor, 
  onClose,
  isReschedule = false,
  appointmentToReschedule,
  onRescheduleSuccess
}: Props): JSX.Element {
  const fullName = counselor.firstName + " " + counselor.lastName;
  const imageUrl =
    counselor.photoUrlSmall ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&background=E0E7FF&color=4F46E5&size=128`;
  const rating = counselor.rating;


  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<"morning" | "afternoon" | "evening" | null>("morning");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmed, setConfirmed] = useState(false)
  // sessionStorage keys are scoped per-counselor so multiple counselor modals don't collide
  const sessionKeyDate = (() => {
    const c = counselor as unknown as { counsellorId?: string; id?: string; userName?: string };
    const cid = c.counsellorId || c.id || c.userName || 'unknown_counselor';
    return `appointment:selectedDate:${cid}`;
  })();
  const sessionKeySlot = (() => {
    const c = counselor as unknown as { counsellorId?: string; id?: string; userName?: string };
    const cid = c.counsellorId || c.id || c.userName || 'unknown_counselor';
    return `appointment:selectedSlot:${cid}`;
  })();
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const { userId } = useAuthStore();

  const [nonAvailabilityMap, setNonAvailabilityMap] = useState<Record<string, Set<number>>>({});
  const [unavailableDays, setUnavailableDays] = useState<Set<string>>(new Set());

  const weekdayName = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "long" });

  const counselorWorkingDays: string[] = (
    counselor && 'workingDays' in counselor && Array.isArray(counselor.workingDays)
  )
    ? (counselor.workingDays as string[])
    : [];
  const workingDaysSet = new Set(counselorWorkingDays.map((s) => s));

  const isWorkingDay = (d: Date) => {
    if (!counselorWorkingDays || counselorWorkingDays.length === 0) return true;
    return workingDaysSet.has(weekdayName(d));
  };

  const getNextNWorkingDates = (base: Date, n: number) => {
    const out: Date[] = [];
    const cursor = new Date(base);
    while (out.length < n) {
      if (isWorkingDay(cursor)) out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  };

  const parseTimeOnDate = (base: Date, timeStr: string) => {
    if (!timeStr) return null;
    const t = timeStr.trim();
    const ampmMatch = t.match(/(am|pm)$/i);
    const hhmm = t.replace(/(am|pm)$/i, "").trim();
    const parts = hhmm.split(/[:.]/).map((p) => parseInt(p, 10));
    if (parts.length < 1 || isNaN(parts[0])) return null;
    let hours = parts[0];
    const minutes = parts[1] || 0;
    if (ampmMatch) {
      const ampm = ampmMatch[1].toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
    }
    const date = new Date(base);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const dateKey = (d: Date) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;

  const formatTimeLabel = (d: Date) => {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const generateSlotsForDate = useCallback((date: Date) => {
    const defaultStart = '09:00';
    const defaultEnd = '18:00';

    let startStr = defaultStart;
    let endStr = defaultEnd;
    if ('officeStartTime' in counselor && typeof (counselor as unknown as CounselorDetails).officeStartTime === 'string') {
      startStr = (counselor as unknown as CounselorDetails).officeStartTime;
    }
    if ('officeEndTime' in counselor && typeof (counselor as unknown as CounselorDetails).officeEndTime === 'string') {
      endStr = (counselor as unknown as CounselorDetails).officeEndTime;
    }

    const start = parseTimeOnDate(date, startStr) || parseTimeOnDate(date, defaultStart)!;
    const end = parseTimeOnDate(date, endStr) || parseTimeOnDate(date, defaultEnd)!;

    // If end is not after start (e.g., start 06:00, end 00:00 meaning midnight),
    // interpret end as next day's time so that slots up to 23:30 are generated.
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    const slotsArr: string[] = [];
    let cur = new Date(start);
    const slotMs = 30 * 60 * 1000;
    while (cur.getTime() + slotMs <= end.getTime()) {
      const next = new Date(cur.getTime() + slotMs);
      slotsArr.push(`${formatTimeLabel(cur)}-${formatTimeLabel(next)}`);
      cur = next;
    }
    return slotsArr;
  }, [counselor]);

  useEffect(() => {
    let mounted = true;
    async function loadNonAvailability() {
      if (!userId) return;
      const c = counselor as unknown as { counsellorId?: string; id?: string; userName?: string };
      const counsellorId = c.counsellorId || c.id || c.userName;
      if (!counsellorId) return;
      try {
        const data = await academicApi.getCounselorNonAvailability(userId, counsellorId);
        const map: Record<string, Set<number>> = {};
        if (Array.isArray(data)) {
          for (const entry of data) {
            const dt = entry.date || entry.day || entry.dateString;
            if (!dt) continue;
            const dstr = dt.toString();
            const slots = entry.slots || entry.times || entry.nonAvailableSlots || [];
            // If API explicitly returns an empty array for this date, treat it as available
            if (!Array.isArray(slots) || slots.length === 0) continue;
            map[dstr] = map[dstr] || new Set<number>();
            for (const s of slots) {
              if (typeof s !== 'string') continue;
              const start = s.includes('-') ? s.split('-')[0].trim() : s.trim();
              const parsed = parseTimeOnDate(new Date(dstr), start);
              if (parsed) {
                const minutes = parsed.getHours() * 60 + parsed.getMinutes();
                map[dstr].add(minutes);
              }
            }
          }
        } else if (data && typeof data === 'object') {
          for (const [k, v] of Object.entries(data)) {
            let arr: unknown[] = [];
            if (Array.isArray(v)) arr = v as unknown[];
            else if (v && typeof v === 'object') {
              const maybe = (v as Record<string, unknown>)['slots'] ?? (v as Record<string, unknown>)['times'] ?? [];
              if (Array.isArray(maybe)) arr = maybe as unknown[];
            }
            // If API returned an empty array for this date key, treat it as available
            if (!Array.isArray(arr) || arr.length === 0) continue;
            map[k] = new Set<number>();
            for (const s of arr) {
              if (typeof s !== 'string') continue;
              const start = s.includes('-') ? s.split('-')[0].trim() : s.trim();
              const parsed = parseTimeOnDate(new Date(k), start);
              if (parsed) map[k].add(parsed.getHours()*60 + parsed.getMinutes());
            }
          }
        }

        if (!mounted) return;
        setNonAvailabilityMap(map);

        const unavail = new Set<string>();
        const now = new Date();
        for (const [k, sset] of Object.entries(map)) {
          const d = new Date(k);
          const availableSlots: string[] = generateSlotsForDate(d) || [];
          if (!availableSlots || availableSlots.length === 0) {
            unavail.add(k);
            continue;
          }
          const allBlockedOrPast = availableSlots.every((lab) => {
            const start = lab.split('-')[0];
            const parsed = parseTimeOnDate(d, start);
            if (!parsed) return false;
            const minutes = parsed.getHours()*60 + parsed.getMinutes();
            const isBlocked = sset.has(minutes);
            const isPast = d.toDateString() === now.toDateString() ? parsed.getTime() < now.getTime() : false;
            return isBlocked || isPast;
          });
          if (allBlockedOrPast) unavail.add(k);
        }
        setUnavailableDays(unavail);
      } catch (err) {
        console.error('Failed to load non-availability', err);
      }
    }
    loadNonAvailability();
    return () => { mounted = false; };
  }, [counselor, userId, generateSlotsForDate]);

  const today = new Date();
  const firstWorkingFromToday = isWorkingDay(today) ? today : getNextNWorkingDates(today, 1)[0];
  const baseQuickDates = getNextNWorkingDates(firstWorkingFromToday, 3);

  const isSelectedInBase = selectedDate
    ? baseQuickDates.some((b) => b.toDateString() === selectedDate.toDateString())
    : false;

  const quickDates = isSelectedInBase || !selectedDate
    ? baseQuickDates
    : [new Date(selectedDate), baseQuickDates[1], baseQuickDates[2]];

  useEffect(() => {
    if (!selectedDate && baseQuickDates && baseQuickDates.length > 0) {
      setSelectedDate(new Date(baseQuickDates[0]));
    }
  }, [baseQuickDates, selectedDate]);

  // restore transient selection from sessionStorage (if present)
  useEffect(() => {
    try {
      const rawDate = sessionStorage.getItem(sessionKeyDate);
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      }
      const rawSlot = sessionStorage.getItem(sessionKeySlot);
      if (rawSlot) {
        setSelectedSlot(rawSlot);
      }
    } catch {
      // sessionStorage may be unavailable in some environments; ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slotBaseDate = selectedDate && isWorkingDay(selectedDate) ? selectedDate : firstWorkingFromToday;
  const slotsForSelectedDate = isWorkingDay(slotBaseDate) && !unavailableDays.has(dateKey(slotBaseDate)) ? generateSlotsForDate(slotBaseDate) : [];
  const splitSlots = (list: string[]) => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    for (const s of list) {
      const start = s.split('-')[0];
      const [h, m] = start.split(':').map(Number);
      const d = new Date(slotBaseDate);
      d.setHours(h, m, 0, 0);
      const hr = d.getHours();
      if (hr < 12) morning.push(s);
      else if (hr < 18) afternoon.push(s);
      else evening.push(s);
    }
    return { morning, afternoon, evening };
  };

  const { morning: morningSlots, afternoon: afternoonSlots, evening: eveningSlots } = splitSlots(slotsForSelectedDate);

  useEffect(() => {
    if ((openSection === 'evening') && (!eveningSlots || eveningSlots.length === 0)) {
      setOpenSection(null);
    }
  }, [eveningSlots, openSection]);

  const disabledSlotIds = new Set<string>();
  const nap = nonAvailabilityMap[dateKey(slotBaseDate)];
  if (nap && nap.size > 0) {
    for (const s of [...morningSlots, ...afternoonSlots, ...eveningSlots]) {
      const start = s.split('-')[0];
      const parsed = parseTimeOnDate(slotBaseDate, start);
      if (!parsed) continue;
      const minutes = parsed.getHours()*60 + parsed.getMinutes();
      if (nap.has(minutes)) {
        const id = `slot-${s.replace(/[:\s-]/g, "")}`;
        disabledSlotIds.add(id);
      }
    }
  }
  const now = new Date();
  if (slotBaseDate.toDateString() === now.toDateString()) {
    for (const s of [...morningSlots, ...afternoonSlots, ...eveningSlots]) {
      const start = s.split('-')[0];
      const parsed = parseTimeOnDate(slotBaseDate, start);
      if (!parsed) continue;
      if (parsed.getTime() < now.getTime()) {
        const id = `slot-${s.replace(/[:\s-]/g, "")}`;
        disabledSlotIds.add(id);
      }
    }
  }

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 90);

  const isReadyToBook = selectedDate !== null && selectedSlot !== null;
  const [booking, setBooking] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    counselorName: string;
    appointmentDate: string;
    appointmentTime: string;
    counselorImage: string;
  } | null>(null);

  const token = localStorage.getItem('jwt');

  const handleBook = async () => {
    if (!isReadyToBook || !selectedDate || !selectedSlot) return;
    if (booking) return;
    const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
    const slotLabel = allSlots.find((s) => `slot-${s.replace(/[:\s-]/g, '')}` === selectedSlot);
    const startTime = slotLabel ? slotLabel.split('-')[0] : '';
    const newDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth()+1).toString().padStart(2,'0')}-${selectedDate.getDate().toString().padStart(2,'0')}`;

    const c = counselor as unknown as { counsellorId?: string; id?: string; userName?: string; photoUrlSmall?: string; firstName?: string; lastName?: string };
    setBooking(true);
    const toastId = toast.loading(isReschedule ? 'Rescheduling...' : 'Booking...');

    try {
      if (isReschedule && appointmentToReschedule && token) {
        const payload = {
          userId: userId ?? '',
          appointmentId: appointmentToReschedule.appointmentId,
          newDate: newDate,
          newStartTime: startTime,
          oldDate: appointmentToReschedule.date,
          oldStartTime: appointmentToReschedule.startTime,
          receiverFcmToken: counselor.fcmToken || null,
        };
        await rescheduleAppointment(payload, token);
        toast.success('Appointment rescheduled!', { id: toastId });
        
        if (onRescheduleSuccess) {
          onRescheduleSuccess();
        } else {
          onClose?.();
        }
        return;

      } else {
        const payload = {
          userId: userId ?? '',
          counsellorId: c.counsellorId || c.id || c.userName || '',
          date: newDate,
          startTime: startTime,
          mode: 'offline' as const,
          notes: undefined as string | undefined,
          receiverFcmToken: counselor.fcmToken,
        };
        
        const res = await academicApi.bookAppointment(payload);
        
        setBookingDetails({
          counselorName: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          appointmentDate: payload.date,
          appointmentTime: startTime,
          counselorImage: imageUrl
        });
        
        console.log(res)
        setConfirmed(true)
        try {
          sessionStorage.removeItem(sessionKeyDate);
          sessionStorage.removeItem(sessionKeySlot);
        } catch {
          // ignore
        }
        toast.dismiss(toastId);
      }

    } catch (err) {
      console.error(isReschedule ? 'Reschedule failed' : 'Booking failed', err);
      toast.error(err instanceof Error ? err.message : 'An error occurred.', { id: toastId });
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    try {
      if (selectedDate) {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        sessionStorage.setItem(sessionKeyDate, d.toISOString());
      } else {
        sessionStorage.removeItem(sessionKeyDate);
      }
    } catch {
      // ignore storage errors
    }
  }, [selectedDate, sessionKeyDate]);

  useEffect(() => {
    try {
      if (selectedSlot) sessionStorage.setItem(sessionKeySlot, selectedSlot);
      else sessionStorage.removeItem(sessionKeySlot);
    } catch {
      // ignore
    }
  }, [selectedSlot, sessionKeySlot]);




  if(confirmed){
    return (
      <BookingConfirmationCard
        counselorName={bookingDetails?.counselorName}
        appointmentDate={bookingDetails?.appointmentDate}
        appointmentTime={bookingDetails?.appointmentTime}
        counselorImage={bookingDetails?.counselorImage}
        onClose={() => {
          setConfirmed(false);
          setBookingDetails(null);
          onClose?.();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#232323]/50 md:backdrop-blur-sm flex items-center justify-center md:p-4 z-[200]" onClick={() => onClose?.()}>
      <div onClick={(e) => e.stopPropagation()} className="bg-[#F5F7FA] w-full h-full md:h-auto flex flex-col md:max-w-[747px] md:max-h-[667px] md:rounded-2xl relative p-4 md:p-[42px] pb-[86px] gap-6 overflow-hidden">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #A0AEC0; }
          .custom-scrollbar::-webkit-scrollbar-corner { background: transparent; }
          .custom-scrollbar { 
            border-radius: 16px;
            -webkit-mask: linear-gradient(white 0 0);
            mask: linear-gradient(white 0 0);
          }
        `}</style>
        <div className="flex items-center gap-2 text-[#343C6A]">
          <p className="text-xl md:text-2xl font-semibold">Book Appointment</p>
            <button 
            onClick={() => onClose?.()}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full transition-colors duration-200 hover:bg-black group"
          >
            <X className="h-5 w-5 text-gray-500 transition-colors duration-200 group-hover:text-white group-hover:cursor-pointer" />
          </button>
        </div>

        <div className="bg-white w-full md:w-[663px] max-h-[598px] p-4 pb-[100px] rounded-2xl custom-scrollbar overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex gap-3 md:gap-4">
                <img loading="lazy" decoding="async"
                  src={imageUrl}
                  alt={fullName}
                  className="w-20 h-20 md:w-[100px] md:h-[100px] rounded-xl object-cover"
                />
                <h1 className="text-[#343C6A] font-semibold text-[18px] md:text-[20px] flex flex-col gap-1.5">
                  {fullName}
                  <span className="text-[#718EBF] font-normal text-[14px] md:text-[16px]">
                    {counselor?.fullOfficeAddress?.city}
                  </span>
                </h1>
              </div>

              <div className="flex gap-3 items-start">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-[#ffd700]" fill="currentColor" />
                <div className="font-semibold text-[14px] md:text-[16px] text-[#718ebf]">
                  {rating} <span className="text-[12px] md:text-[13px] text-[#232323] font-normal">(1)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h1 className="text-[#232323] font-semibold text-[16px] md:text-[18px]">
                Availability
              </h1>
              <div className="relative">
                <button
                  onClick={() => setCalendarOpen((v) => !v)}
                  aria-expanded={calendarOpen}
                  className=" "
                >
                  <CalendarDays className="h-5 w-5 text-[#fa660a] hover:cursor-pointer" />
                </button>
                {calendarOpen && (
                  <div className="absolute right-0 mt-2 z-40 w-[320px] bg-white border border-[#e6e6e6] rounded-md shadow-lg p-3">
                    <Calendar
                      mode="single"
                      selected={selectedDate ?? undefined}
                      onSelect={(d) => {
                        if (d instanceof Date) {
                          const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                          const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                          if (picked.getTime() < start.getTime() || picked.getTime() > end.getTime()) {
                            return;
                          }
                          setSelectedDate(picked);
                          setCalendarOpen(false);
                        }
                      }}
                      fromDate={today}
                      toDate={maxDate}
                      isDayUnavailable={(date: Date) => {
                        const key = dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
                        return !isWorkingDay(date) || unavailableDays.has(key);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {quickDates.map((d, idx) => {
                const activeDate = selectedDate ?? quickDates[0];
                const isSelected = activeDate.toDateString() === d.toDateString();
                const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
                const diff = Math.floor((startOf(d) - startOf(new Date())) / (24 * 60 * 60 * 1000));
                const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleString(undefined, { weekday: 'short' });
                const pretty = `${d.getDate()} ${d.toLocaleString(undefined, { month: 'short' })}`;

                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedDate(new Date(d));
                      setCalendarOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDate(new Date(d));
                        setCalendarOpen(false);
                      }
                    }}
                    className={`min-w-[140px] md:w-[200px] h-[55px] md:h-[59px] rounded-[12px] shadow-xs flex items-center justify-center cursor-pointer border transition-all duration-150 ${
                      isSelected
                        ? "bg-[#3536b4] border-transparent text-white"
                        : "bg-white border-[#f5f5f5] text-[#232323]"
                    }`}
                  >
                    <p className="h-full flex flex-col items-center justify-center text-[13px] md:text-[14px] font-normal">
                      <span className="text-[12px] md:text-[13px]">{label}</span>
                      <span className="text-[14px] md:text-[16px] font-semibold">{pretty}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            {slotsForSelectedDate.length === 0 ? (
              <div className="w-full flex items-center justify-center py-10 text-[#718EBF]">
                No slots available for this date
              </div>
            ) : (
              <>
                <MorningSlots
                  slots={morningSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(s) => setSelectedSlot(s)}
                  isOpen={openSection === "morning"}
                  onToggle={() => setOpenSection((v) => (v === "morning" ? null : "morning"))}
                  disabledSlotIds={disabledSlotIds}
                />
                <AfterNoonSlots
                  slots={afternoonSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(s) => setSelectedSlot(s)}
                  isOpen={openSection === "afternoon"}
                  onToggle={() => setOpenSection((v) => (v === "afternoon" ? null : "afternoon"))}
                  disabledSlotIds={disabledSlotIds}
                />
                {eveningSlots && eveningSlots.length > 0 && (
                  <EveningSlots
                    slots={eveningSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(s) => setSelectedSlot(s)}
                    isOpen={openSection === "evening"}
                    onToggle={() => setOpenSection((v) => (v === "evening" ? null : "evening"))}
                    disabledSlotIds={disabledSlotIds}
                  />
                )}
              </>
            )}
          </div>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-[60px] md:h-[67px] z-50 bg-white border-t border-[#f5f5f5] flex items-center justify-center rounded-b-2xl md:rounded-b-2xl shadow-xs">
          <div className="w-full max-w-[663px] px-3 md:px-4 flex justify-center">
            <Button
              variant={"default"}
              disabled={!isReadyToBook || booking}
              aria-disabled={!isReadyToBook || booking}
              onClick={handleBook}
              className={`${isReadyToBook ? "bg-[#fa660a] hover:bg-[#fa660a] hover:cursor-pointer" : "bg-[#ACACAC]"} text-[14px] md:text-[16px] text-white w-full max-w-md disabled:opacity-60 disabled:cursor-not-allowed h-11 md:h-auto`}
            >
              {booking 
                ? (isReschedule ? 'Rescheduling...' : 'Booking...')
                : (isReschedule ? 'Reschedule Appointment' : 'Book Appointment')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
