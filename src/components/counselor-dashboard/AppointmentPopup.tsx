import type { Appointment } from "../../types/appointments";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DeleteAppointmentModal, RescheduleAppointmentModal } from "./modals";
import { cancelAppointment } from "@/api/counselor-Dashboard";
import type { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface AppointmentPopupProps {
  appointment: Appointment;
  position: { x: number; y: number; centerY: number };
  onClose: () => void;
  user: User;
  token: string;
}

export default function AppointmentPopup({
  appointment,
  position,
  onClose,
  user,
  token,
}: AppointmentPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const queryClient = useQueryClient();
  const isMobileView = position.x === 0 && position.y === 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.classList?.contains("overflow-y-auto") ||
        target.closest(".overflow-y-auto")
      ) {
        return;
      }
      onClose();
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  const formatDateTime = () => {
    const date = new Date(appointment.date);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const [hours, minutes] = appointment.startTime.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${dateStr} - ${displayHour}:${minutes} ${ampm}`;
  };

  const { mutate: cancelMutation, isPending: isCancelling } = useMutation({
    mutationFn: (reason: string) => {
      const payload = {
        userId: user.userName,
        appointmentId: appointment.appointmentId,
        receiverFcmToken: appointment.userFCMToken,
        reason: reason,
      };
      return cancelAppointment(payload, token);
    },
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({
        queryKey: ["counselorAppointments", user.userName],
      });
      setShowDeleteModal(false);
      onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel appointment"
      );
    },
  });

  const handleCancelConfirm = async (reason: string) => {
    cancelMutation(reason);
  };

  const popupStyle: React.CSSProperties = isMobileView
    ? {
        width: "calc(100% - 32px)",
        maxWidth: "500px",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        border: "1px solid #2B2B2F40",
        boxShadow: "0px 1px 4px 0px #23232340",
      }
    : {
        width: "500px",
        left: `${position.x - 500 - 22}px`,
        top: `${position.centerY - 156.5}px`,
        border: "1px solid #2B2B2F40",
        boxShadow: "0px 1px 4px 0px #23232340",
      };

  return (
    <>
    {isMobileView && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}
    <div
      ref={popupRef}
      className="fixed bg-white rounded-[20px] shadow-lg z-50 p-6"
      style={popupStyle}
    >
      {!isMobileView && (
      <img loading="lazy" decoding="async"
        src="/triangle.svg"
        alt=""
        className="absolute"
        style={{
          right: "-20px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      )}
      
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={20} className="text-gray-500" />
      </button>

      <div className="space-y-5">
        <h1 className="text-[20px] font-semibold text-[#232323]">
          Meeting Details
        </h1>

        <div className="text-lg text-[#232323] font-semibold">
          <h1>
            Attende:{" "}
            <span className="font-medium">{appointment.userFullName}</span>
          </h1>
          <h1>
            Course:{" "}
            <span className="font-medium">{appointment.userCourse}</span>
          </h1>
        </div>

        <div>
          <label
            className="text-[16px] font-semibold text-[#232323]"
            htmlFor="date"
          >
            Date & Time
          </label>
          <p className="text-[#9CA3AF] font-normal text-[16px]">
            {formatDateTime()}
          </p>
        </div>

        <div className="flex gap-6 text-[14px] font-semibold text-[#13097D]">
          {/* <button 
              onClick={() => setShowRescheduleModal(true)}
              className="flex items-center cursor-pointer justify-center border border-[#13097D] rounded-[12px] gap-1 py-2 px-6"
            >
              <img loading="lazy" decoding="async" src="/clock3.svg" alt="" />Reschedule
            </button> */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center cursor-pointer justify-center border border-[#13097D] rounded-[12px] gap-1 py-1 px-6"
          >
            <img loading="lazy" decoding="async" src="/buttoncal.svg" alt="" />
            Cancel
          </button>
        </div>
      </div>

      {showRescheduleModal && (
        <RescheduleAppointmentModal
          userName={appointment.userFullName}
          appointmentDate={appointment.date}
          startTime={appointment.startTime}
          endTime={appointment.endTime}
          onClose={() => setShowRescheduleModal(false)}
          onConfirm={() => {
            setShowRescheduleModal(false);
            onClose();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteAppointmentModal
          userName={appointment.userFullName}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleCancelConfirm}
          isSubmitting={isCancelling} 
        />
      )}
    </div>
    </>
  );
}