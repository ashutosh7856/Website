import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomOTP from '../ui/custom-otp';
import { useAuthStore } from '@/store/AuthStore';

const slideData = [
  {
    image: '/login1.webp',
    title: 'For Students. With Counsellors.',
    description: 'We personalize the platform for you. Just tell us who you are and what you\'re here to achieve.'
  },
  {
    image: '/login2.webp',
    title: 'Find Your Perfect Path.',
    description: 'Explore thousands of courses and careers, all tailored to your unique strengths and interests.'
  },
  {
    image: '/login3.webp',
    title: 'Connect With Experts.',
    description: 'Schedule one-on-one sessions with top counsellors to get personalized guidance.'
  }
];

const LoginCard: React.FC = () => {
  const { sendOtp, verifyOtp, toggleLogin } = useAuthStore();
  const [phone, setPhone] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp'>('phone');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % slideData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number', { duration: 2000 });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(phone);
      setCurrentStep('otp');
      setResendTimer(60);
      toast.success('OTP sent successfully!', { duration: 2000 });
    } catch {
      toast.error('Failed to send OTP', { duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await verifyOtp(phone, otp);
      toast.success('Verification successful!', { duration: 2000 });
      setIsLoading(false);
    } catch {
      setHasError(true);
      toast.error('Invalid OTP, please try again', { duration: 2000 });
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setCurrentStep('phone');
    setHasError(false);
    setResendTimer(0);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await sendOtp(phone);
      setResendTimer(60);
      setHasError(false);
      toast.success('OTP resent successfully!', { duration: 2000 });
    } catch {
      toast.error('Failed to resend OTP', { duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-md md:max-w-5xl max-h-[90vh] relative overflow-hidden flex-col md:flex-row">
          <button 
            onClick={() => toggleLogin()}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 md:p-1.5 rounded-full transition-colors duration-200 hover:bg-black hover:cursor-pointer group"
          >
            <X className="h-5 w-5 text-gray-500 transition-colors duration-200 group-hover:text-white" />
          </button>

          <div className="w-full md:w-1/2 p-6 md:p-12 bg-[#F5F7FA] overflow-y-auto">
            <div className="flex items-center mb-6 md:mb-8">
              <img loading="lazy" decoding="async" src="/logo.webp" alt="ProCounsel Logo Icon" className="h-10 md:h-12 rounded-lg" />
              <div className="ml-2">
                <p className="font-bold text-base md:text-lg text-black">ProCounsel</p>
              </div>
            </div>

            {currentStep === 'phone' ? (
              <>
                <div className="flex items-baseline mb-4 md:mb-6">
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#13097D] whitespace-nowrap">Log in or Sign up</h1>
                  <a href="/contact" className="text-xs md:text-sm underline text-gray-500 hover:text-gray-700 ml-auto whitespace-nowrap cursor-pointer">Need Help?</a>
                </div>
                <div className="flex items-center bg-white border border-gray-300 rounded-xl w-full md:max-w-[444px] h-11 px-3 mb-6 md:mb-12 focus-within:border-[#FA660F] focus-within:ring-1 focus-within:ring-[#FA660F]">
                  <div className="flex items-center cursor-pointer">
                    <img loading="lazy" decoding="async" src="/india.png" alt="India Flag" className="h-5 w-5 mr-2" />
                    <span className="text-black mr-1 text-sm md:text-base">+91</span>
                    <ChevronDown className="h-5 w-5 text-black" />
                  </div>
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="flex-1 min-w-0 pl-2 md:pl-3 border-none focus:ring-0 focus:outline-none text-gray-800 text-sm md:text-base"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setPhone(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading && phone.length === 10) {
                        handleSendOtp();
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                
                <button 
                  onClick={handleSendOtp}
                  disabled={isLoading || phone.length !== 10}
                  className="w-full md:max-w-[444px] h-11 bg-(--text-main) text-white rounded-xl font-semibold hover:bg-(--text-main)/80 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </button>
                
                <p className="text-[10px] md:text-xs text-gray-500 mt-4 text-center">
                  By continuing, you agree to Procounsel's <a href="/terms" className="underline text-black hover:text-[#FA660F] cursor-pointer">Terms & Condition</a> and <a href="/privacy-policy" className="underline text-black hover:text-[#FA660F] cursor-pointer">Privacy Policy</a>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline mb-4 md:mb-6">
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#13097D] whitespace-nowrap">Enter OTP</h1>
                  <button 
                    onClick={handleBackToPhone}
                    className="text-xs md:text-sm underline text-gray-500 hover:underline ml-auto whitespace-nowrap hover:cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  We've sent a 4-digit code to +91 {phone}
                </p>

                <div className="mb-6 md:mb-12">
                  <CustomOTP
                    length={4}
                    onComplete={handleVerifyOtp}
                    hasError={hasError}
                    disabled={isLoading}
                    className="justify-center"
                  />
                </div>
                
                {hasError && (
                  <p className="text-[#718EBF] font-medium text-sm mt-2 mb-6 md:mb-8 text-center">
                    Wrong OTP, try again
                  </p>
                )}
                
                <button 
                  onClick={handleResendOtp}
                  disabled={isLoading || resendTimer > 0}
                  className={`w-full md:max-w-[444px] h-11 rounded-xl font-semibold transition-colors hover:cursor-pointer ${
                    resendTimer > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-[#FA660F] hover:bg-orange-50'
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading 
                    ? 'Sending...' 
                    : resendTimer > 0 
                      ? (
                        <>
                          Resend OTP in <span className="text-[#FA660F]">{String(Math.floor(resendTimer / 60)).padStart(2, '0')}:{String(resendTimer % 60).padStart(2, '0')}</span>
                        </>
                      )
                      : 'Resend OTP'
                  }
                </button>
                
                <p className="text-[10px] md:text-xs text-gray-500 mt-4 text-center">
                  By continuing, you agree to Procounsel's <a href="#" className="underline text-black">Terms & Condition</a> and <a href="#" className="underline text-black">Privacy Policy</a>
                </p>
              </>
            )}
          </div>

          <div className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 text-center">
            <img loading="lazy" decoding="async" src={slideData[activeIndex].image} alt="Illustration" className="w-full max-w-sm mb-8" />
            <h2 className="text-2xl font-bold text-[#13097D] mb-2">{slideData[activeIndex].title}</h2>
            <p className="text-gray-600 mb-8">{slideData[activeIndex].description}</p>
            <div className="flex gap-2">
              {slideData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 hover:cursor-pointer ${
                    activeIndex === index ? 'w-6 bg-[#13097D]' : 'w-2 bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { LoginCard };