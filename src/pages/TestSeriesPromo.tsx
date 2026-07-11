import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, Trophy, ChevronUp, ChevronRight, Tag, Gift, Award, Info, Loader2 } from "lucide-react";
// import SmartImage from "@/components/ui/SmartImage";
import { useAuthStore } from "@/store/AuthStore";
import startRecharge from "@/api/wallet"; 
import toast from "react-hot-toast";
import CourseEnrollmentPopup from "@/components/landing-page/CourseEnrollmentPopup";
import CouponCodeModal from "@/components/modals/CouponCodeModal";
import ScholarshipTermsModal from "@/components/pcsat/ScholarshipTermsModal";
import RegistrationFormModal from "@/components/pcsat/RegistrationFormModal";
import { createRegistration, markFormAsPaid, checkRegistrationStatus } from "@/api/pcsat";
import type { PcsatRegistrationData } from "@/api/pcsat"

declare global {
  interface Window {
    Razorpay: unknown;
    fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    [key: string]: any;
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

const TEST_ID = "3baef8b7-5d0a-41a6-a21c-6aebb5f32bbb";
const TEST_NAME = "PCSAT 2026 (ProCounsel Scholarship Aptitude Test)";
export const PROMO_TEST_PRICE = 99;

export default function TestSeriesPromo() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  
  const { userId, isAuthenticated, toggleLogin, role } = useAuthStore();

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false); 
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const pendingActionRef = useRef<"REGISTER" | "COUPON" | null>(null);

  useEffect(() => {
    const verifyStatus = async () => {
        if (isAuthenticated && userId) {
            setIsLoadingStatus(true);
            try {
                const status = await checkRegistrationStatus(userId);
                if (status.registered && status.paid) {
                    setIsPurchased(true);
                } else if (status.registered && !status.paid) {
                    setIsPurchased(false);
                } else {
                    setIsPurchased(false);
                }
            } catch (error) {
                console.error("Failed to check status", error);
            } finally {
                setIsLoadingStatus(false);
            }
        }
    };

    verifyStatus();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (isAuthenticated && pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;

        if (role === "counselor") {
            toast.error("Counsellors cannot register for the test.");
            return;
        }

        if (action === "REGISTER") {
            setTimeout(() => setShowRegistrationModal(true), 500);
        } else if (action === "COUPON") {
            setTimeout(() => setShowCouponModal(true), 500);
        }
    }
  }, [isAuthenticated, role]);


  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleCouponApplied = (couponCode: string, finalPrice: number, percentage: number) => {
    setAppliedCoupon(couponCode);
    setDiscountedPrice(finalPrice);
    setDiscountPercentage(percentage);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setDiscountedPrice(null);
    setDiscountPercentage(null);
  };

  const applyCouponWrapper = async (_userId: string, _courseId: string, couponCode: string) => {
    if (couponCode === "AC50" || couponCode === "AC 50") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { status: true, message: "50% Discount Applied!", discountPercentage: 50 };
    }
    return { status: false, message: "Invalid or expired coupon code" };
  };

  const handleCouponButtonClick = () => {
    if (isPurchased) return;
    
    if (!isAuthenticated) {
      toast.error("Please login/signup to use a coupon");
      pendingActionRef.current = "COUPON";
      useAuthStore.getState().setSkipOnboardingForPromo(true);
      toggleLogin();
      return;
    }
    setShowCouponModal(true);
  };

  const handleRegistrationSubmit = async (formData: PcsatRegistrationData) => {
    setIsProcessing(true);
    const toastId = toast.loading("Processing details...");

    try {
        if(!userId) throw new Error("User ID is missing. Please re-login.");

        try {
            await createRegistration({
                ...formData,
                userId: userId
            });
        } catch (regError: any) {
            if (regError.status === 409 || (regError.message && regError.message.toLowerCase().includes("already registered"))) {
                const status = await checkRegistrationStatus(userId);
                
                if (status.paid) {
                    throw regError;
                } else {
                    toast.success("Resuming payment for existing registration...", { id: toastId });
                }
            } else {
                throw regError;
            }
        }
        
        toast.loading("Initiating payment...", { id: toastId });

        const finalAmount = discountedPrice !== null ? discountedPrice : PROMO_TEST_PRICE;
        const freshUser = useAuthStore.getState().user;
        
        const order = await startRecharge(freshUser?.userName || userId, finalAmount);
        if (!order || !order.orderId) throw new Error("Failed to create payment order");

        const options = {
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: "ProCounsel",
            description: `${TEST_NAME} - Enrollment`,
            prefill: {
                contact: formData.contactNumber, 
                email: formData.email,           
                name: formData.studentName,      
            },
            notes: {
                userId: userId,
                courseId: TEST_ID,
                ...(appliedCoupon && { couponCode: appliedCoupon }),
            },
            handler: async () => {
                try {
                    toast.loading("Confirming registration...", { id: toastId });
                    
                    await markFormAsPaid(userId);
                    
                    toast.success("Registration Successful!", { id: toastId });
                    
                    setIsPurchased(true); 
                    setShowRegistrationModal(false);
                    setShowSuccessPopup(true);
                    
                } catch (error) {
                    console.error(error);
                    toast.error("Payment successful but verification failed. Please contact support.", { id: toastId });
                } finally {
                    setIsProcessing(false);
                }
            },
            modal: {
                ondismiss: () => {
                    toast.dismiss(toastId);
                    setIsProcessing(false);
                    toast.error("Payment cancelled");
                },
            },
            theme: { color: "#13097D" },
        };

        const RZ = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
        const rzp = new RZ(options);
        rzp.open();

    } catch (error: any) {
        console.error(error);
        if (error.status === 409 || (error.message && error.message.toLowerCase().includes("already registered"))) {
             toast.error("You are already registered.", { id: toastId });
             setIsPurchased(true); 
             setShowRegistrationModal(false);
        } else {
             toast.error(error.message || "Registration failed", { id: toastId });
        }
        setIsProcessing(false);
    }
  };

  const handleEnrollNow = () => {
    if (isProcessing || isLoadingStatus) return;

    if (!isAuthenticated) {
      toast("Please login/signup to continue the registration process", {
         icon: '🔒',
         duration: 4000
      });
      
      pendingActionRef.current = "REGISTER";
      
      useAuthStore.getState().setSkipOnboardingForPromo(true);
      toggleLogin();
      return;
    }

    if (useAuthStore.getState().role === "counselor") {
      toast.error("Counsellors cannot take the test.");
      return;
    }
    
    if (isPurchased) {
      toast.success("You are already registered!");
      return;
    }

    setShowRegistrationModal(true);
  };

  (window as any).__promoPageEnroll = handleEnrollNow;

  const EnrollmentButton = () => {
    const role = useAuthStore.getState().role;
    
    if (isAuthenticated && role === "counselor") {
      return (
        <Button disabled className="bg-red-500 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl cursor-not-allowed">
          Counsellors cannot enroll
        </Button>
      );
    }

    if (isLoadingStatus) {
         return (
        <Button disabled className="bg-gray-200 text-gray-500 px-6 sm:px-8 py-4 sm:py-6 rounded-xl flex items-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" /> Checking...
        </Button>
      );
    }

    if (isPurchased) {
      return (
        <Button disabled className="bg-green-600/90 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl font-medium flex items-center gap-2">
          <Award className="w-5 h-5" /> Already Registered
        </Button>
      );
    }

    return (
      <Button
        onClick={handleEnrollNow}
        disabled={isProcessing}
        className="bg-[#FF660F] hover:bg-[#e15500] text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-medium rounded-xl cursor-pointer"
      >
        {isProcessing ? "Processing..." : "Register Now"}
      </Button>
    );
  };
  
  const features = [
    {
      icon: <Trophy className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Scholarship & Prizes",
      description: "Top performers get up to 100% scholarship and exciting gift hampers.",
    },
    {
      icon: <Award className="w-full h-full text-[#2F43F2] p-1.5" />,
      title: "Participation Certificate",
      description: "Official ProCounsel certificate for every single participant.",
    },
    {
      icon: <Gift className="w-full h-full text-[#FA7415] p-1.5" />,
      title: "Exciting Goodies",
      description: "Top 100 students win special goodies and gift hampers.",
    },
    {
      icon: <Clock className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Real Exam Simulation",
      description: "Experience the pressure and pattern of the actual board exams.",
    },
  ];

  const whyChooseUs = [
    "Syllabus: Complete 12th Boards (HSC)",
    "Instant Result Analysis",
    "State-level Benchmarking",
    "Expert-curated Questions",
  ];

  const faqs = [
    {
      question: "When is the PCSAT 2026?",
      answer: "The test is scheduled for 22nd March 2026, from 11:00 AM to 2:00 PM.",
    },
    {
      question: "What is the syllabus?",
      answer: "The test covers the Complete 12th Boards Syllabus (as per HSC Boards).",
    },
    {
      question: "What are the scholarship criteria?",
      answer: "Top 3 students get 100% Scholarship. Next Top 10 get 50% Scholarship. Top 100 get Goodies.",
    },
    {
      question: "Is there a discount on the fee?",
      answer: "Yes! Use coupon code 'COEP50' to get a Flat 50% discount on the registration fee.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins leading-[100%]">
      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        className="pt-18 sm:pt-22 md:pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden"
        style={{
          minHeight: "auto",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 9.39%, #F5F6FF 83.91%)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
            
            {/* Left Content */}
            <div className="w-full md:w-[50%] xl:w-[60%] space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FEECE199] rounded-full gap-2">
                <div className="w-2 h-2 bg-[#FA660F] rounded-full"></div>
                <span className="text-[#FA660F] font-normal text-xs sm:text-base tracking-normal">
                  PCSAT 2026 Registrations Open Now!
                </span>
              </div>

              <h1 className="text-[#232323] font-semibold text-2xl sm:text-3xl md:text-[36px] tracking-normal md:text-left">
                ProCounsel Scholarship <br/>
                <span className="text-[#2F43F2]">Aptitude Test 2026</span>
              </h1>

              <p 
                className="max-w-2xl text-sm sm:text-lg md:text-xl tracking-normal md:text-left mx-auto md:mx-0"
                style={{ color: "#6B7280", fontWeight: 500 }}
              >
                Test your knowledge on 12th Boards Syllabus. Win Scholarships up to 100% and exciting prizes.
              </p>

              {/* Event Details */}
              <div className="flex items-center justify-between md:justify-start w-full md:w-fit gap-2 sm:gap-6 bg-white/50 px-3 py-3 sm:p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F43F2]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold text-sm sm:text-base text-[#232323]">22 March</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-300 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FA7415]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold text-sm sm:text-base text-[#232323]">11am - 2pm</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-300 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#22C55D]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Eligibility</p>
                    <p className="font-semibold text-sm sm:text-base text-[#232323]">12th / HSC</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center md:items-start gap-4 pt-4 w-full">
                <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 flex-wrap">
                  <div className="flex flex-col gap-2">
                    {appliedCoupon && discountPercentage ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold w-fit">
                          <span>🎉 {discountPercentage}% OFF Applied</span>
                        </div>
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <span className="text-base text-gray-400 line-through">₹{PROMO_TEST_PRICE}</span>
                          <div className="text-3xl font-bold text-[#FF660F]">₹{discountedPrice}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Registration Fee</span>
                        <div className="text-2xl font-semibold text-[#232323]">₹{PROMO_TEST_PRICE}</div>
                      </div>
                    )}
                  </div>
                  <EnrollmentButton />
                </div>
                
                {!isPurchased && (
                  <div className="w-full max-w-md flex flex-col gap-2 items-center md:items-start">
                     {!appliedCoupon && (
                        <div className="text-xs text-[#2F43F2] font-medium bg-[#2F43F2]/10 px-3 py-1 rounded w-fit">
                            💡 Use code <span className="font-bold">AC50</span> for 50% OFF
                        </div>
                     )}

                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center w-full max-w-[300px]">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-mono text-green-800">{appliedCoupon}</span>
                        </div>
                        <button onClick={handleCouponRemoved} className="text-green-600 text-sm cursor-pointer font-medium">Remove</button>
                      </div>
                    ) : (
                      <button onClick={handleCouponButtonClick} className="flex items-center cursor-pointer gap-2 text-[#FF660F] text-sm font-medium hover:underline w-fit">
                        <Tag className="h-4 w-4" /> Have a coupon code?
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Video Section */}
            <div className="w-full md:w-[50%] xl:w-[40%] flex justify-center md:justify-end mt-8 md:mt-0">
              <div className="relative w-full max-w-[600px]">
                <div 
                  className="rounded-xl relative w-full aspect-4/3 overflow-hidden shadow-lg border border-white bg-black"
                  style={{
                    boxShadow: "0px 12px 24px -8px rgba(0, 0, 0, 0.15)"
                  }}
                >
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/k8OZb87pP8g?autoplay=1&mute=1&controls=1&loop=1&playlist=k8OZb87pP8g&playsinline=1&rel=0"
                    title="PCSAT 2026 Promo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll get Section */}
      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-5 lg:px-20">
        <div className="mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              What You Get with PCSAT
            </h2>
            <p 
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Features designed to give you the best testing experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group transition-all duration-300 w-full shadow-none py-0 sm:min-h-[190px]"
                style={{
                    borderRadius: "24px",
                    border: "1px solid #E8EAED",
                    backgroundColor: "#FFFFFF",
                    borderWidth: "1px",
                    boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2F43F2";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E8EAED";
                }}
              >
                <CardContent className="px-5 py-5 sm:px-6 sm:py-6 h-full">
                   <div className="flex flex-col h-full">
                      <div className="shrink-0 mb-4">
                        <div className="rounded-lg flex items-center justify-center transition-all duration-300 bg-[#ECEEFE] group-hover:bg-[#2F43F2] w-12 h-12 sm:w-14 sm:h-14">
                            <div className="icon-hover-white transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[#2F43F2] group-hover:text-white">
                                {feature.icon}
                            </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 
                            className="mb-2"
                            style={{
                                fontWeight: 500,
                                fontSize: "16px",
                                letterSpacing: "0%",
                                color: "#0E1629",
                            }}
                        >
                            <span className="sm:text-lg md:text-[20px]">{feature.title}</span>
                        </h3>
                        <p 
                            className="font-normal text-[#6B7280]"
                            style={{ fontSize: "14px" }}
                        >
                             <span className="sm:text-base md:text-[18px]">{feature.description}</span>
                        </p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards & Benefits Section (Why Choose Us) */}
      <section 
        className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20"
        style={{
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.5) -10.21%, #F5F6FF 53.33%)",
        }}
      >
        <div className="mx-auto w-full">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Rewards & Benefits
            </h2>
            <p 
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Why thousands of students are registering.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:items-center">
            {/* Left Column - Why Choose Us List */}
            <div className="w-full lg:w-[40%] space-y-4 sm:space-y-5 rounded-lg p-4 sm:p-6">
              <h3 className="text-xl font-semibold mb-4 text-[#0E1629]">Why take PCSAT?</h3>
              {whyChooseUs.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div 
                    className="shrink-0 self-start rounded w-6 h-6 sm:w-8 sm:h-8 p-[3px] sm:p-1"
                    style={{
                        backgroundColor: "#E9FBF0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                  >
                    <img loading="lazy" decoding="async" src="/checkcheck.svg" alt="check" className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
                  </div>
                  <p 
                     style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#0E1629",
                    }}
                  >
                    <span className="sm:text-lg">{benefit}</span>
                  </p>
                </div>
              ))}
              <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[#2F43F2] font-medium text-sm">
                  "This isn't just a test; it's your chance to assess your standing before the actual boards."
                </p>
              </div>
            </div>

            {/* Right Column - Prizes Card */}
            <div className="w-full lg:w-[60%]">
              <Card 
                className="bg-white border-none shadow-lg rounded-2xl overflow-hidden relative"
                style={{
                    boxShadow: "0px 0px 4px 0px #18003326",
                }}
              >
                <div className="bg-[#2F43F2] p-4 text-center">
                  <h3 className="text-white font-semibold text-xl flex items-center justify-center gap-2">
                    <Gift className="text-yellow-400" /> Scholarship & Prizes
                  </h3>
                </div>
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6">
                    {/* Tier 1 */}
                    <div className="flex items-center gap-4 border-b border-dashed pb-4">
                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Top 3 Students</p>
                            <p className="text-xl font-bold text-[#232323]">100% Scholarship</p>
                        </div>
                    </div>
                     {/* Tier 2 */}
                     <div className="flex items-center gap-4 border-b border-dashed pb-4">
                        <div className="bg-gray-100 p-3 rounded-full text-gray-600">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Next Top 10 Students</p>
                            <p className="text-xl font-bold text-[#232323]">50% Scholarship</p>
                        </div>
                    </div>
                     {/* Tier 3 */}
                     <div className="flex items-center gap-4 border-b border-dashed pb-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Gift className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Top 100 Students</p>
                            <p className="text-xl font-bold text-[#232323]">Exciting Goodies & Hampers</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <button 
                            onClick={() => setShowTermsModal(true)}
                            className="text-xs text-[#2F43F2] hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 font-medium transition-colors"
                        >
                            <Info className="w-3 h-3" />
                            *Terms & Conditions applied
                        </button>
                    </div>

                    {/* Participation */}
                    <div className="bg-[#F9FAFB] p-4 rounded-xl text-center mt-2">
                        <p className="text-gray-600 font-medium">
                         🎓 Participation Certificate for <span className="text-[#2F43F2] font-bold">ALL</span> students
                        </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20"
        style={{
            background: "linear-gradient(0deg, rgba(255, 255, 255, 0.5) -10.21%, #F5F6FF 53.33%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Frequently Asked Questions
            </h2>
            <p 
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="w-full rounded-2xl p-2 transition-all duration-300"
                style={{ borderBottom: "1px solid #EFEFEF" }}
              >
                <button
                  onClick={() => handleFaqToggle(index)}
                  className="w-full flex justify-between items-center text-left cursor-pointer"
                >
                  <h3 className="font-medium text-sm sm:text-xl text-[#232323] pr-4">
                    {faq.question}
                  </h3>
                  {openFaqIndex === index ? <ChevronUp className="w-5 h-5 text-black shrink-0" /> : <ChevronRight className="w-5 h-5 text-black shrink-0" />}
                </button>
                {openFaqIndex === index && (
                  <div className="mt-4 transition-transform">
                     <p 
                        className="text-xs sm:text-base"
                        style={{ color: "#6C6969", fontWeight: 400 }}
                     >
                         {faq.answer}
                     </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      {showSuccessPopup && (
        <CourseEnrollmentPopup
          courseName={TEST_NAME}
          onClose={() => {
            setShowSuccessPopup(false);
            window.location.reload();
          }}
        />
      )}
      
      {userId && (
        <CouponCodeModal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          courseId={TEST_ID}
          userId={userId}
          originalPrice={PROMO_TEST_PRICE}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
          appliedCoupon={appliedCoupon}
          applyCouponApi={applyCouponWrapper}
        />
      )}

      <ScholarshipTermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />

       <RegistrationFormModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegistrationSubmit}
        isProcessing={isProcessing}
        initialData={{
            studentName: useAuthStore.getState().user?.firstName 
                ? `${useAuthStore.getState().user?.firstName} ${useAuthStore.getState().user?.lastName || ''}` 
                : "",
            contactNumber: useAuthStore.getState().user?.phoneNumber || "",
            email: useAuthStore.getState().user?.email || "",
        }}
      />
    </div>
  );
}