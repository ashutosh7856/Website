import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { sendEmailOtp, verifyEmailOtp } from "@/api/auth";
import { useAuthStore } from "@/store/AuthStore";
import { registerGrandMockTestShared, registerGrandMockTestAuth } from "@/api/userTestSeries";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationModal({ isOpen, onClose, onSuccess }: RegistrationModalProps) {
  // Bring in Auth store to check login status
  const { isAuthenticated, userId } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    mobile: "",
    email: "",
    otp: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    if (!formData.email || !isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSendingOtp(true);
    try {
      await sendEmailOtp(formData.email);
      setIsOtpSent(true);
      toast.success("OTP sent to your email");
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await verifyEmailOtp(formData.email, formData.otp);
      if (response.success || response.message?.toLowerCase().includes("success")) {
        setIsOtpVerified(true);
        toast.success("Email verified successfully");
      } else {
        toast.error("Invalid OTP. Try again.");
      }
    } catch {
      toast.error("OTP verification failed.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length < 2) {
      toast.error("Please enter your valid full name");
      return;
    }
    if (formData.city.trim().length < 2) {
      toast.error("Please enter a valid city name");
      return;
    }
    if (formData.mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!isOtpVerified) {
      toast.error("Please verify your email to continue.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        userId: isAuthenticated && userId ? userId : formData.mobile,
        name: formData.name, 
        mobile: formData.mobile,
        email: formData.email,
        city: formData.city
      };

      // Call the corresponding API based on authentication status
      if (isAuthenticated) {
        await registerGrandMockTestAuth(payload);
      } else {
        await registerGrandMockTestShared(payload);
      }

      toast.success("Registration Successful!");
      onSuccess();
      
    } catch (error) {
      console.error("API Registration Error: ", error);
      toast.error("Registration failed. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in duration-200">
        
        <div className="bg-[#2F43F2] p-4 sm:p-5 flex justify-between items-center shrink-0 rounded-t-2xl sm:rounded-t-3xl">
          <h2 className="text-white text-lg sm:text-xl font-semibold">Register for Free</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Student's Name <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              placeholder="Enter your full name"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-[#2F43F2] focus:ring-1 focus:ring-[#2F43F2] outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              placeholder="Enter your city"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-[#2F43F2] focus:ring-1 focus:ring-[#2F43F2] outline-none transition-all"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
            <input
              required
              type="tel"
              placeholder="10-digit mobile number"
              maxLength={10}
              pattern="[0-9]{10}"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-[#2F43F2] focus:ring-1 focus:ring-[#2F43F2] outline-none transition-all"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                required
                type="email"
                disabled={isOtpVerified}
                placeholder="Enter email address"
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-[#2F43F2] focus:ring-1 focus:ring-[#2F43F2] outline-none transition-all pr-[72px] sm:pr-24 ${isOtpVerified ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().replace(/\s/g, '') })}
              />
              {!isOtpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 sm:px-4 bg-gray-100 hover:bg-gray-200 text-[#2F43F2] text-[10px] sm:text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50 min-w-[60px] sm:min-w-[70px]"
                >
                  {isSendingOtp ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : (isOtpSent ? "Resend" : "Verify")}
                </button>
              )}
              {isOtpVerified && (
                <CheckCircle2 className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              )}
            </div>
          </div>

          {isOtpSent && !isOtpVerified && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enter OTP <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-[#2F43F2] focus:ring-1 focus:ring-[#2F43F2] outline-none transition-all pr-[72px] sm:pr-24"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 sm:px-4 bg-[#2F43F2] hover:bg-blue-700 text-white text-[10px] sm:text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50 min-w-[60px] sm:min-w-[70px]"
                >
                  {isVerifyingOtp ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : "Submit"}
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 sm:pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isOtpVerified}
              className={`w-full py-5 sm:py-6 text-base sm:text-lg font-medium rounded-xl cursor-pointer transition-all ${!isOtpVerified ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' : 'bg-[#FF660F] hover:bg-[#e15500] text-white'}`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : "Confirm Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}