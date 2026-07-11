import { X, Clock } from "lucide-react";
import { Input } from "../ui";
import { useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { setOutOfOffice } from "@/api/counselor-Dashboard";
import type { User } from "@/types/user";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TimeList from "./TimeList";
import type { TimeOption } from "./TimeList";
import WorkingDaysCalendar from "./WorkingDaysCalendar";

const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  const startHour = 6;

  for (let i = 0; i < 48; i++) {
    const totalMinutes = (startHour * 60 + i * 30) % 1440;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;

    const ampm = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const label = `${String(displayHour).padStart(2, "0")}:${String(
      minute
    ).padStart(2, "0")} ${ampm}`;

    options.push({ label, value });
  }
  return options;
};

const formatTimeForDisplay = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return "Select Time";
  try {
    const [hour, minute] = time24.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )} ${ampm}`;
  } catch (error) {
    console.error("Error formatting time:", time24, error);
    return "Invalid Time";
  }
};

const getNextTimeSlot = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return "09:30";
  try {
    const [hour, minute] = time24.split(":").map(Number);
    let totalMinutes = hour * 60 + minute;
    totalMinutes = (totalMinutes + 30) % 1440;

    const nextHour = Math.floor(totalMinutes / 60);
    const nextMinute = totalMinutes % 60;

    return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(
      2,
      "0"
    )}`;
  } catch (error) {
    console.error("Error getting next time slot:", time24, error);
    return "09:30";
  }
};

const timeOptions = generateTimeOptions();

export default function OutOfOfficeDrawer({
  open,
  onClose,
  user,
  token,
  workingDays,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  token: string;
  workingDays: string[];
}) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const [showStartTimeList, setShowStartTimeList] = useState(false);
  const [showEndTimeList, setShowEndTimeList] = useState(false);
  const startTimeListRef = useRef<HTMLDivElement>(null);
  const endTimeListRef = useRef<HTMLDivElement>(null);

  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        startCalendarRef.current &&
        !startCalendarRef.current.contains(event.target as Node) &&
        !target.closest("[data-radix-popper-content-wrapper]")
      ) {
        setShowStartCalendar(false);
      }
      if (
        endCalendarRef.current &&
        !endCalendarRef.current.contains(event.target as Node) &&
        !target.closest("[data-radix-popper-content-wrapper]")
      ) {
        setShowEndCalendar(false);
      }
      if (
        startTimeListRef.current &&
        !startTimeListRef.current.contains(event.target as Node)
      ) {
        setShowStartTimeList(false);
      }
      if (
        endTimeListRef.current &&
        !endTimeListRef.current.contains(event.target as Node)
      ) {
        setShowEndTimeList(false);
      }
    };
    if (
      showStartCalendar ||
      showEndCalendar ||
      showStartTimeList ||
      showEndTimeList
    ) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [
    showStartCalendar,
    showEndCalendar,
    showStartTimeList,
    showEndTimeList,
  ]);

  const { mutate: setOutOfOfficeMutation, isPending: isSubmitting } =
    useMutation({
      mutationFn: () => {
        const counselorId = user.userName;
        const payload = {
          counsellorId: counselorId,
          reason,
          startDate: startDate!.format("YYYY-MM-DD"),
          endDate: endDate!.format("YYYY-MM-DD"),
          startTime: startTime,
          endTime: endTime,
        };
        return setOutOfOffice(payload, token);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["counselorOutOfOffice", user.userName],
        });
        setStartDate(null);
        setEndDate(null);
        setReason("");
        setStartTime("09:00");
        setEndTime("18:00");
        onClose();
      },
      onError: (err) => {
        console.error("Submission failed", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to schedule",
          { id: "ooo-schedule-error" }
        );
      },
    });

  const handleSubmit = async () => {
    if (
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !reason.trim() ||
      !token
    ) {
      toast.error("Please fill in all fields before scheduling.");
      return;
    }

    const now = new Date();

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = startDate
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .millisecond(0)
      .toDate();

    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endDateTime = endDate
      .hour(endHour)
      .minute(endMinute)
      .second(0)
      .millisecond(0)
      .toDate();

    if (startDateTime < new Date(now.getTime() - 60000)) {
      toast.error("Cannot schedule 'Out of Office' for a time in the past.", {
        id: "ooo-past-error",
      });
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after the start time.", {
        id: "ooo-order-error",
      });
      return;
    }

    if (workingDays && workingDays.length > 0) {
      let currentDate = startDate.clone();
      const lastDate = endDate;

      while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
        const dayName = currentDate.format("dddd");
        
        if (!workingDays.includes(dayName)) {
          toast.error(
            `You cannot schedule 'Out of Office' on a non-working day: ${dayName}, ${currentDate.format("MMM D")}.`,
            { id: "ooo-non-working-day-error" }
          );
          return;
        }
        currentDate = currentDate.add(1, 'day');
      }
    }

    setOutOfOfficeMutation();
  };

  const isFormIncomplete =
    !startDate || !endDate || !startTime || !endTime || !reason.trim();

  const handleStartTimeSelect = (value: string) => {
    setStartTime(value);
    setEndTime(getNextTimeSlot(value));
    setShowStartTimeList(false);
  };

  const handleEndTimeSelect = (value: string) => {
    setEndTime(value);
    setShowEndTimeList(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200`}
        onClick={onClose}
      />

      {/*desktop*/}
      <aside
        className={`absolute right-0 top-0 bottom-0 w-[460px] bg-[#f5f5f7] shadow-xl transform transition-all duration-300 hidden lg:block `}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center h-17 bg-white p-7">
            <h1 className="flex gap-2 text-[16px] font-semibold text-[#343C6A]">
              <span>
                <img loading="lazy" decoding="async" src="/cal.svg" alt="" />
              </span>{" "}
              Schedule out of office
            </h1>
            <button
              className="flex items-center cursor-pointer justify-center group hover:bg-[#232323] rounded-full w-6 h-6"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="group-hover:text-white group-hover:cursor-pointer text-gray-500" size={17} />
            </button>
          </div>

          <div className="h-auto w-[412px] my-5 mx-auto rounded-2xl p-4 bg-white border border-[#EFEFEF] flex flex-col gap-4">
            {/* Date pickers */}
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="dates">
                Date
              </label>
              <div className="flex gap-4">
                <div className="relative w-[182px]" ref={startCalendarRef}>
                  <div
                    onClick={() => {
                      setShowStartCalendar(!showStartCalendar);
                      setShowEndCalendar(false);
                      setShowStartTimeList(false);
                      setShowEndTimeList(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 hover:cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <img loading="lazy" decoding="async"
                      src="/cal.svg"
                      alt=""
                      className="w-4 h-4 shrink-0"
                    />
                    <span
                      className="text-[14px] font-medium"
                      style={{
                        color: startDate ? "#232323" : "#6C696980",
                      }}
                    >
                      {startDate
                        ? startDate.format("MMM D, YYYY")
                        : "Start Date"}
                    </span>
                  </div>

                  {showStartCalendar && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5]">
                      <WorkingDaysCalendar
                        selected={startDate ? startDate.toDate() : null}
                        onSelect={(date) => {
                          setStartDate(dayjs(date));
                          setShowStartCalendar(false);
                        }}
                        workingDays={workingDays}
                      />
                    </div>
                  )}
                </div>

                <div className="relative w-[182px]" ref={endCalendarRef}>
                  <div
                    onClick={() => {
                      setShowEndCalendar(!showEndCalendar);
                      setShowStartCalendar(false);
                      setShowStartTimeList(false);
                      setShowEndTimeList(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <img loading="lazy" decoding="async"
                      src="/cal.svg"
                      alt=""
                      className="w-4 h-4 shrink-0"
                    />
                    <span
                      className="text-[14px] font-medium"
                      style={{
                        color: endDate ? "#232323" : "#6C696980",
                      }}
                    >
                      {endDate ? endDate.format("MMM D, YYYY") : "End Date"}
                    </span>
                  </div>

                  {showEndCalendar && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5]">
                      <WorkingDaysCalendar
                        selected={endDate ? endDate.toDate() : null}
                        onSelect={(date) => {
                          setEndDate(dayjs(date));
                          setShowEndCalendar(false);
                        }}
                        workingDays={workingDays}
                        fromDate={startDate ? startDate.toDate() : new Date()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Pickers (dsktop) */}
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="times">
                Time
              </label>
              <div className="flex gap-4">
                <div className="relative w-[182px]" ref={startTimeListRef}>
                  <div
                    onClick={() => {
                      setShowStartTimeList(!showStartTimeList);
                      setShowEndTimeList(false);
                      setShowStartCalendar(false);
                      setShowEndCalendar(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 hover:cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <Clock
                      size={16}
                      className="text-[#6C696980] shrink-0"
                    />
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: "#232323" }}
                    >
                      {formatTimeForDisplay(startTime)}
                    </span>
                  </div>
                  {showStartTimeList && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] w-[200px]">
                      <TimeList
                        options={timeOptions}
                        selectedValue={startTime}
                        onSelect={handleStartTimeSelect}
                        title="Start Time"
                      />
                    </div>
                  )}
                </div>

                <div className="relative w-[182px]" ref={endTimeListRef}>
                  <div
                    onClick={() => {
                      setShowEndTimeList(!showEndTimeList);
                      setShowStartTimeList(false);
                      setShowStartCalendar(false);
                      setShowEndCalendar(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <Clock
                      size={16}
                      className="text-[#6C696980] shrink-0"
                    />
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: "#232323" }}
                    >
                      {formatTimeForDisplay(endTime)}
                    </span>
                  </div>
                  {showEndTimeList && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] w-[200px]">
                      <TimeList
                        options={timeOptions}
                        selectedValue={endTime}
                        onSelect={handleEndTimeSelect}
                        title="End Time"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="reason">
                Reason{" "}
              </label>
              <Input
                type="text"
                placeholder="e.g., Annual vacation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="w-[182px] h-[42px] hover:cursor-pointer border border-[#FA660F] text-[#FA660F] font-semibold text-[14px] rounded-[12px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isFormIncomplete}
                className="w-[182px] h-[42px] bg-[#FA660F] hover:cursor-pointer  text-white font-semibold text-[14px] rounded-[12px] disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Now"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* mobile View*/}
      <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#EFEFEF] w-full max-w-[335px] h-auto p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-[#343C6A]">
              Schedule out of office
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Mobile Date Pickers */}
            <div className="flex flex-col gap-2">
              <label className="label text-sm font-medium">Date</label>
              <div className="flex gap-4">
                <div className="relative w-full" ref={startCalendarRef}>
                  <div
                    onClick={() => {
                      setShowStartCalendar(!showStartCalendar);
                      setShowEndCalendar(false);
                      setShowStartTimeList(false);
                      setShowEndTimeList(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <img loading="lazy" decoding="async"
                      src="/cal.svg"
                      alt=""
                      className="w-4 h-4 shrink-0"
                    />
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: startDate ? "#232323" : "#6C696980" }}
                    >
                      {startDate
                        ? startDate.format("MMM D, YYYY")
                        : "Start Date"}
                    </span>
                  </div>
                  {showStartCalendar && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5]">
                      <WorkingDaysCalendar
                        selected={startDate ? startDate.toDate() : null}
                        onSelect={(date) => {
                          setStartDate(dayjs(date));
                          setShowStartCalendar(false);
                        }}
                        workingDays={workingDays}
                      />
                    </div>
                  )}
                </div>

                <div className="relative w-full" ref={endCalendarRef}>
                  <div
                    onClick={() => {
                      setShowEndCalendar(!showEndCalendar);
                      setShowStartCalendar(false);
                      setShowStartTimeList(false);
                      setShowEndTimeList(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <img loading="lazy" decoding="async"
                      src="/cal.svg"
                      alt=""
                      className="w-4 h-4 shrink-0"
                    />
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: endDate ? "#232323" : "#6C696980" }}
                    >
                      {endDate ? endDate.format("MMM D, YYYY") : "End Date"}
                    </span>
                  </div>
                  {showEndCalendar && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5]">
                      <WorkingDaysCalendar
                        selected={endDate ? endDate.toDate() : null}
                        onSelect={(date) => {
                          setEndDate(dayjs(date));
                          setShowEndCalendar(false);
                        }}
                        workingDays={workingDays}
                        fromDate={startDate ? startDate.toDate() : new Date()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Pickers (Mobile) */}
            <div className="flex flex-col gap-2">
              <label className="label text-sm font-medium">Time</label>
              <div className="flex gap-4">
                <div className="relative w-full" ref={startTimeListRef}>
                  <div
                    onClick={() => {
                      setShowStartTimeList(!showStartTimeList);
                      setShowEndTimeList(false);
                      setShowStartCalendar(false);
                      setShowEndCalendar(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <Clock
                      size={16}
                      className="text-[#6C696980] shrink-0"
                    />
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: "#232323" }}
                    >
                      {formatTimeForDisplay(startTime)}
                    </span>
                  </div>
                  {showStartTimeList && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] w-full">
                      <TimeList
                        options={timeOptions}
                        selectedValue={startTime}
                        onSelect={handleStartTimeSelect}
                        title="Start Time"
                      />
                    </div>
                  )}
                </div>

                <div className="relative w-full" ref={endTimeListRef}>
                  <div
                    onClick={() => {
                      setShowEndTimeList(!showEndTimeList);
                      setShowStartTimeList(false);
                      setShowStartCalendar(false);
                      setShowEndCalendar(false);
                    }}
                    className="w-full h-9 rounded-md border border-[#E5E5E5] bg-white px-2 cursor-pointer hover:border-[#FA660F] transition-colors flex items-center gap-2"
                  >
                    <Clock
                      size={16}
                      className="text-[#6C696980] shrink-0"
                    />
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: "#232323" }}
                    >
                      {formatTimeForDisplay(endTime)}
                    </span>
                  </div>
                  {showEndTimeList && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#E5E5E5] w-full">
                      <TimeList
                        options={timeOptions}
                        selectedValue={endTime}
                        onSelect={handleEndTimeSelect}
                        title="End Time"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label text-sm font-medium">Reason</label>
              <Input
                type="text"
                placeholder="e.g., Annual vacation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isFormIncomplete}
                className="w-full h-[42px] bg-[#FA660F] text-white font-semibold text-[14px] rounded-[12px] disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Now"}
              </button>
              <button
                onClick={onClose}
                className="w-full h-[42px] border border-[#FA660F] text-[#FA660F] font-semibold text-[14px] rounded-[12px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}