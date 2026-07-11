import { X } from "lucide-react";

interface CourseEnrollmentPopupProps {
  courseName?: string;
  onClose: () => void;
}

export default function CourseEnrollmentPopup({
  courseName = "MHT-CET Mastery Course",
  onClose,
}: CourseEnrollmentPopupProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-[90%] max-w-[420px] rounded-xl p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
        >
          <X size={22} />
        </button>

        <div className="flex justify-center mb-4">
          <img loading="lazy" decoding="async"
            src="/greentick.svg"
            className="w-16 h-16 animate-pulse"
            alt="Success"
          />
        </div>

        <h2 className="text-xl font-semibold text-[#343C6A] text-center mb-1">
          Enrollment Successful!
        </h2>

        <p className="text-center text-[#718EBF] mb-4 text-[14px]">
          You are now enrolled in:
        </p>

        <p className="text-center text-[#343C6A] font-medium text-lg mb-6">
          {courseName}
        </p>

        <p className="text-center text-sm text-[#232323] leading-[130%] px-2 mb-6">
          You will get the WhatsApp group link on your email shortly.
          <br />
          Our support team will reach out if you need any help.
        </p>

        <div className="flex flex-col gap-3 items-center mt-4">

          <div className="bg-[#ffffff] shadow-[#232323]/10 w-12 h-12 flex justify-center items-center rounded-[12px]">
            <img loading="lazy" decoding="async" src="/text.svg" alt="chat" className="w-7 h-7" />
          </div>

          <p className="text-center text-[#232323] font-semibold text-[15px]">
            Need Help?
            <span className="block text-[#718EBF] text-[13px] font-medium mt-1 px-4">
              Our team is here to assist you with any questions.
            </span>
          </p>

          <div className="flex flex-col gap-3 text-[14px] text-[#232323] mt-2">

            <div className="flex gap-2 items-center justify-center">
              <img loading="lazy" decoding="async" src="/phone.svg" alt="phone" className="h-6 w-6" />
              70047 89484
            </div>

            <div className="flex gap-2 items-center justify-center">
              <img loading="lazy" decoding="async" src="/email.png" alt="email" className="h-6 w-6" />
              support@procounsel.co.in
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
