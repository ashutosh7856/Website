import { useRef, useState } from "react";
import dayjs from "dayjs";
import { CalendarDays, Clock3 } from "lucide-react";
import { FaStar } from "react-icons/fa";

interface RequestCallbackPopUpProps {
    isOpen?: boolean;
    onClose?: () => void;
    info:PageData
    onSubmit: (payload: { scheduledDate: string; scheduledTime: string }) => void | Promise<void>;
    isSubmitting?: boolean;
}

interface PageData {
     name:string,
    city:string,
    imageUrl:string,
    proBuddyId:string,
    rating:number,
    reviewsCount:number,
}

export default function RequestCallbackPopUp({
    isOpen = true,
    onClose,
    info,
    onSubmit,
    isSubmitting = false,
}: RequestCallbackPopUpProps) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    const timeInputRef = useRef<HTMLInputElement | null>(null);

    if (!isOpen) return null;

    const canSubmit = Boolean(selectedDate && selectedTime) && !isSubmitting;

    const getFormattedDate = () => {
        if (!selectedDate) return "";
        const date = dayjs(selectedDate);
        return `${date.format("DD")} ${date.format("MMMM")} ${date.format("YYYY")}`;
    };

    const openDatePicker = () => {
        if (dateInputRef.current?.showPicker) {
            dateInputRef.current.showPicker();
        } else {
            dateInputRef.current?.click();
        }
        dateInputRef.current?.focus();
    };

    const openTimePicker = () => {
        if (timeInputRef.current?.showPicker) {
            timeInputRef.current.showPicker();
        } else {
            timeInputRef.current?.click();
        }
        timeInputRef.current?.focus();
    };

    const handleSubmit = () => {
        if (!selectedDate || !selectedTime || isSubmitting) {
            return;
        }

        onSubmit({
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ maxWidth: "min(747px, calc(100vw - 2rem))", maxHeight: "calc(100vh - 2rem)", zIndex: 50 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="bg-[#F9FAFB] flex justify-between items-center px-3 md:px-5 py-4 md:py-5"
                >
                    <span className="text-(--text-main) text-[1.125rem] font-semibold">Call Confirmation</span>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "#F5F5F5",
                            borderRadius: "50%",
                            width: 30,
                            height: 30,
                            cursor: "pointer",
                            fontSize: 16,
                            color: "#555",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3 md:p-5 flex flex-col gap-4 md:gap-5 overflow-y-auto">
                    {/* profile details div */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center  gap-3 min-w-0">
                            <img loading="lazy" decoding="async" src={info.imageUrl} alt={info.name} className="h-12 w-12 md:h-25 md:w-25   rounded-xl aspect-square shrink-0" />
                            <div className="flex flex-col md:justify-between min-w-0">
                                <h1 className="text-(--text-main) font-semibold text-sm md:text-xl truncate">{info.name}</h1>
                                <p className="text-(--text-main) font-normal text-xs md:text-[1rem] truncate">{info.city}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-1.5 shrink-0">
                            <FaStar size={20} fill="#FFD700" />
                            <p className="text-(--text-muted) font-normal text-sm md:text-[1rem] whitespace-nowrap">{info.rating !== 0 ? info.rating : "NA"} <span className="text-xs md:text-sm">({info.reviewsCount > 0 ? info.reviewsCount : "NA"})</span></p>
                        </div>
                    </div>

                    {/* date time section div */}
                    <div className="space-y-3">
                        <h1 className="text-(--text-main) font-medium text-sm md:text-lg">Select your preferred Date & Time</h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                            {/* Date Input */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={openDatePicker}
                                    className="w-full text-left"
                                    style={{
                                        height: "48px",
                                        border: "1px solid var(--text-muted, #6b7280)",
                                        borderRadius: "12px",
                                        paddingLeft: "12px",
                                        paddingRight: "40px",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        color: selectedDate ? "#0E1629" : "var(--text-muted, #6b7280)",
                                        backgroundColor: "#fff",
                                        boxSizing: "border-box",
                                        outline: "none",
                                        boxShadow: "none",
                                    }}
                                >
                                    {selectedDate ? getFormattedDate() : "DD Month YYYY"}
                                </button>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={dayjs().format("YYYY-MM-DD")}
                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                    tabIndex={-1}
                                    aria-label="Select date"
                                />
                                <CalendarDays
                                    size={20}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: "var(--text-muted, #6b7280)" }}
                                />
                            </div>

                            {/* Time Input */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={openTimePicker}
                                    className="w-full text-left"
                                    style={{
                                        height: "48px",
                                        border: "1px solid var(--text-muted, #6b7280)",
                                        borderRadius: "12px",
                                        paddingLeft: "12px",
                                        paddingRight: "40px",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        color: selectedTime ? "#0E1629" : "var(--text-muted, #6b7280)",
                                        backgroundColor: "#fff",
                                        boxSizing: "border-box",
                                        outline: "none",
                                        boxShadow: "none",
                                    }}
                                >
                                    {selectedTime || "HH:mm"}
                                </button>
                                <input
                                    ref={timeInputRef}
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                    tabIndex={-1}
                                    aria-label="Select time"
                                />
                                <Clock3
                                    size={20}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: "var(--text-muted, #6b7280)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* button final */}
                    <div className="w-full flex justify-center md:mt-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`px-8 py-3  md:px-20 rounded-2xl font-medium transition-colors ${canSubmit ? "bg-(--text-main) text-white cursor-pointer" : "bg-[#DBE0E5] text-(--text-muted) cursor-not-allowed"}`}
                            style={{ borderRadius: 8 }}
                        >
                            {isSubmitting ? "Requesting..." : "Request Callback"}
                        </button>
                    </div>
                </div>
            </div>


           
        </div>
    );
}
