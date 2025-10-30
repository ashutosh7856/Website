import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomOTP from '../ui/custom-otp';
import { useAuthStore } from '@/store/AuthStore';
import { useNavigate } from 'react-router-dom';
import { checkUrl } from '@/api/auth';

const slideData = [
  {
    image: '/login1.png',
    title: 'For Students. With Counsellors.',
    description: 'We personalize the platform for you. Just tell us who you are and what you\'re here to achieve.'
  },
  {
    image: '/login2.png',
    title: 'Find Your Perfect Path.',
    description: 'Explore thousands of courses and careers, all tailored to your unique strengths and interests.'
  },
  {
    image: '/login3.png',
    title: 'Connect With Experts.',
    description: 'Schedule one-on-one sessions with top counsellors to get personalized guidance.'
  }
];

const LoginCard: React.FC = () => {
  const { sendOtp, verifyOtp, toggleLogin } = useAuthStore();
  const navigate = useNavigate();
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
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(phone);
      setCurrentStep('otp');
      setResendTimer(60);
      toast.success('OTP sent successfully!', { duration: 3000 });
    } catch {
      toast.error('Failed to send OTP', { duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await verifyOtp(phone, otp);
      toast.success('Verification successful!', { duration: 3000 });
      const token = localStorage.getItem('jwt');
      if (token) {
        const isProfileIncomplete = await checkUrl(phone, token);
        setIsLoading(false);
        if (isProfileIncomplete) {
          navigate('/');
        } else {
        }
      } else {
        throw new Error("Authentication token not found after login.");
      }
    } catch {
      setHasError(true);
      toast.error('Invalid OTP, please try again', { duration: 3000 });
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
      toast.success('OTP resent successfully!', { duration: 3000 });
    } catch {
      toast.error('Failed to resend OTP', { duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-none md:backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-5xl md:max-h-[90vh] relative overflow-hidden">
          <button 
            onClick={() => toggleLogin()}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full transition-colors duration-200 hover:bg-black group"
          >
            <X className="h-5 w-5 text-gray-500 transition-colors duration-200 group-hover:text-white" />
          </button>

          {/* Left Column */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-12 bg-[#F5F7FA]">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <img src="/favicon.png" alt="ProCounsel Logo Icon" className="h-15" />
              <div>
                <p className="font-bold text-lg text-black">ProCounsel</p>
                <p className="text-xs text-black">By CatalystAI</p>
              </div>
            </div>

            {currentStep === 'phone' ? (
              <>
                <div className="flex items-baseline mb-6">
                  <h1 className="text-3xl font-semibold text-[#13097D] whitespace-nowrap">Log in or Sign up</h1>
                  <a href="#" className="text-sm underline text-gray-500 hover:underline ml-auto whitespace-nowrap">Need Help?</a>
                </div>
                
                <div className="flex items-center bg-white border border-gray-300 rounded-xl w-full max-w-[444px] h-[44px] px-3 mb-12 sm:mb-24 focus-within:border-[#FA660F] focus-within:ring-1 focus-within:ring-[#FA660F]">
                  <div className="flex items-center cursor-pointer">
                    <img src="/india.png" alt="India Flag" className="h-5 w-5 mr-2" />
                    <span className="text-black mr-1">+91</span>
                    <ChevronDown className="h-5 w-5 text-black" />
                  </div>
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="flex-1 min-w-0 pl-3 border-none focus:ring-0 focus:outline-none text-gray-800 text-sm sm:text-base"
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
                  className="w-full max-w-[444px] h-[44px] bg-[#FA660F] text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </button>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  By continuing, you agree to Procounsel's <a href="#" className="underline text-black">Terms & Condition</a> and <a href="#" className="underline text-black">Privacy Policy</a>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline mb-6">
                  <h1 className="text-3xl font-semibold text-[#13097D] whitespace-nowrap">Enter OTP</h1>
                  <button 
                    onClick={handleBackToPhone}
                    className="text-sm underline text-gray-500 hover:underline ml-auto whitespace-nowrap"
                  >
                    Change Number
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  We've sent a 4-digit code to +91 {phone}
                </p>

                <div className="mb-12 sm:mb-24">
                  <CustomOTP
                    length={4}
                    onComplete={handleVerifyOtp}
                    hasError={hasError}
                    disabled={isLoading}
                    className="justify-center"
                  />
                </div>
                
                {hasError && (
                  <p className="text-[#718EBF] font-medium text-sm mt-2 mb-8 text-center">
                    Wrong OTP, try again
                  </p>
                )}
                
                <button 
                  onClick={handleResendOtp}
                  disabled={isLoading || resendTimer > 0}
                  className={`w-full max-w-[444px] h-[44px] rounded-xl font-semibold transition-colors ${
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
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  By continuing, you agree to Procounsel's <a href="#" className="underline text-black">Terms & Condition</a> and <a href="#" className="underline text-black">Privacy Policy</a>
                </p>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 text-center">
            <img src={slideData[activeIndex].image} alt="Illustration" className="w-full max-w-sm mb-8" />
            <h2 className="text-2xl font-bold text-[#13097D] mb-2">{slideData[activeIndex].title}</h2>
            <p className="text-gray-600 mb-8">{slideData[activeIndex].description}</p>
            <div className="flex gap-2">
              {slideData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
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