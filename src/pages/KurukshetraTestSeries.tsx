import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Target, ChevronUp, ChevronRight, PlayCircle, CheckCircle2, BookOpen, Video, Award } from "lucide-react";
import { useAuthStore } from "@/store/AuthStore";
import toast from "react-hot-toast";

type PricingPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
};

const PLAN_RANKS: Record<string, number> = {
  "demo-test": 1,
  "standard-plan": 2,
  "premium-plan": 3,
};

const PLAN_ID_MAPPING: Record<string, string> = {
  "demo-test": "",
  "standard-plan": "",
  "premium-plan": "",
};

export default function KurukshetraTestSeries() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { isAuthenticated, toggleLogin, role, userId } = useAuthStore();
  
  const [isProcessing, _setIsProcessing] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlanStatus = async () => {
      if (!isAuthenticated || !userId) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        setCurrentPlanId(null); 
      } catch (error) {
        console.error("Failed to fetch user plan status", error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchUserPlanStatus();
  }, [isAuthenticated, userId]);

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: "demo-test",
      name: "Demo Test",
      price: 49,
      features: [
        "1 Full-Length Demo Test",
        "Instant Result Analysis",
        "Experience the Platform",
      ],
    },
    {
      id: "standard-plan",
      name: "Standard Plan",
      price: 599,
      features: [
        "10 Full-Length Tests",
        "Free Chapter-wise Mock Tests",
        "Video & Written Solutions",
        "Mock Test Guidance Sessions",
      ],
    },
    {
      id: "premium-plan",
      name: "Premium Plan",
      price: 999,
      isPopular: true,
      features: [
        "20 Full-Length Tests",
        "Free Chapter-wise Mock Tests",
        "Video & Written Solutions",
        "Mock Test Guidance Sessions",
        "Priority Doubt Support",
      ],
    },
  ];

  const handleEnroll = async (planId: string, price: number) => {
    if (isProcessing) return;

    if (!isAuthenticated) {
      toast("Please login/signup to enroll", { icon: '🚨', duration: 4000 });
      useAuthStore.getState().setSkipOnboardingForPromo(true);
      toggleLogin();
      return;
    }

    if (role === "counselor") {
      toast.error("Counsellors cannot purchase test series.");
      return;
    }

    const targetCourseId = PLAN_ID_MAPPING[planId];
    if (!targetCourseId) {
      toast.error("Invalid plan configuration.");
      return;
    }

    toast.success(`Payment integration pending for ${planId} at ₹${price}`);
  };

  const features = [
    {
      icon: <Target className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Full-Length Tests",
      description: "Experience the exact pattern and difficulty of MHT-CET 2026.",
    },
    {
      icon: <PlayCircle className="w-full h-full text-[#2F43F2] p-1.5" />,
      title: "Detailed Video Solutions",
      description: "Step-by-step video explanations for tricky questions to clear concepts.",
    },
    {
      icon: <BookOpen className="w-full h-full text-[#FA7415] p-1.5" />,
      title: "Chapter-wise Tests",
      description: "Strengthen your weak topics with focused, chapter-specific assessments.",
    },
    {
      icon: <Video className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Guidance Sessions",
      description: "Live strategy sessions to help you maximize your score and manage time.",
    },
  ];

  const faqs = [
    {
      question: "Is this test series specifically for MHT-CET 2026?",
      answer: "Yes, the Kurukshetra Test Series is exclusively designed based on the latest MHT-CET 2026 syllabus and exam pattern.",
    },
    {
      question: "Can I upgrade from the Demo Test to a full package later?",
      answer: "Absolutely! You can take the ₹49 Demo Test to experience the platform and upgrade to the 10-test or 20-test package at any time.",
    },
    {
      question: "Are the video solutions available immediately after the test?",
      answer: "Yes, once you submit your mock test, you will get instant access to both written and video solutions along with a detailed performance analysis.",
    },
    {
      question: "How do the Mock Test Guidance Sessions work?",
      answer: "These are exclusive sessions where experts analyze common mistakes, teach time-management techniques, and provide actionable tips to boost your percentile.",
    },
  ];

  const currentRank = currentPlanId ? PLAN_RANKS[currentPlanId] : 0;

  return (
    <div className="min-h-screen bg-white font-poppins leading-[100%]">
      <section
        ref={heroSectionRef}
        className="pt-18 sm:pt-22 md:pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden bg-gradient-to-b from-blue-50/50 to-white"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
            
            <div className="w-full md:w-[55%] space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 rounded-full gap-2">
                <span className="text-red-600 font-semibold text-xs sm:text-sm tracking-wide">
                  🚨 MHT-CET 2026 Focus
                </span>
              </div>

              <h1 className="text-[#232323] font-bold text-2xl sm:text-3xl md:text-[40px] leading-tight">
                Kurukshetra Online <br />
                <span className="text-[#2F43F2]">Mock Test Series</span>
              </h1>
              <p className="text-base sm:text-xl font-medium text-gray-800">by Aaditya Coep</p>

              <p className="max-w-2xl text-sm sm:text-lg text-gray-600 leading-relaxed mx-auto md:mx-0">
                Score <strong className="text-black">99%ile</strong> with the RIGHT Mock Test Strategy. Practice with real exam-level questions, analyze your weaknesses, and conquer MHT-CET.
              </p>

              {currentPlanId && (
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg font-medium text-sm w-fit mx-auto md:mx-0">
                  <Award className="w-4 h-4" /> Active Member: {pricingPlans.find(p => p.id === currentPlanId)?.name}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 pt-4">
                <Button 
                  onClick={() => {
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="cursor-pointer w-full sm:w-auto bg-[#FF660F] hover:bg-[#e15500] text-white px-6 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium rounded-xl shadow-lg transition-transform hover:-translate-y-1"
                >
                  View Packages
                </Button>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                  Trusted by 61k+ Subscribers on Youtube
                </div>
              </div>
            </div>

            <div className="w-full md:w-[45%] flex justify-center mt-6 md:mt-0">
              <div className="relative w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-100 border-4 border-white">
                <img loading="lazy" decoding="async" 
                  src="/aditya.svg" 
                  alt="Kurukshetra Mock Test Series" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-5 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px] font-bold text-[#0E1629]">
              Everything You Need to Succeed
            </h2>
            <p className="text-[12px] sm:text-lg text-gray-600">
              Comprehensive tools designed to maximize your MHT-CET score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-gray-200 hover:border-[#2F43F2] transition-colors rounded-2xl shadow-sm hover:shadow-md">
                <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#2F43F2]">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl font-semibold text-[#0E1629] mb-1 sm:mb-2">{feature.title}</h3>
                      <p className="text-xs sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section 
        id="pricing-section" 
        className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20"
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.5) -10.21%, #F5F6FF 53.33%)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="text-center mb-8 sm:mb-16">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Choose Your Winning Strategy
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Start with a demo or go all-in with our comprehensive packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {pricingPlans.map((plan) => {
              const planRank = PLAN_RANKS[plan.id];
              const isCurrentPlan = currentPlanId === plan.id;
              const isIncluded = planRank < currentRank;
              const isDisabled = isCurrentPlan || isIncluded || isLoadingStatus;

              return (
                <Card 
                  key={plan.id} 
                  className={`relative rounded-3xl overflow-hidden transition-all duration-300 flex flex-col h-full ${
                    !isDisabled ? 'hover:-translate-y-2' : 'opacity-90'
                  } bg-white ${
                    plan.isPopular 
                      ? 'border-2 border-[#2F43F2] shadow-xl md:scale-105 z-10' 
                      : 'border border-gray-200 shadow-md'
                  }`}
                >
                  {plan.isPopular && !isCurrentPlan && (
                    <div className="bg-[#2F43F2] text-white text-center text-xs sm:text-sm font-semibold py-2">
                      MOST POPULAR & BEST VALUE
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="bg-green-500 text-white text-center text-xs sm:text-sm font-semibold py-2">
                      YOUR CURRENT PLAN
                    </div>
                  )}
                  
                  <CardContent className="p-6 sm:p-8 flex flex-col flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0E1629] mb-1 sm:mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-[#FF660F]">₹{plan.price}</span>
                    </div>
                    
                    <div className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base text-gray-700">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => handleEnroll(plan.id, plan.price)}
                      disabled={isDisabled || isProcessing}
                      className={`w-full py-6 mt-auto text-sm sm:text-lg font-medium rounded-xl transition-colors ${
                        isCurrentPlan 
                          ? 'bg-green-100 text-green-700 cursor-not-allowed hover:bg-green-100'
                          : isIncluded
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100'
                            : plan.isPopular 
                              ? 'bg-[#2F43F2] hover:bg-blue-700 text-white cursor-pointer' 
                              : 'bg-white border-2 border-[#2F43F2] text-[#2F43F2] hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      {isLoadingStatus 
                        ? 'Loading...' 
                        : isCurrentPlan 
                          ? 'Already Bought' 
                          : isIncluded 
                            ? 'Included in Current Plan' 
                            : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

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

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="w-full rounded-2xl p-2 transition-all duration-300"
                style={{ borderBottom: "1px solid #EFEFEF" }}
              >
                <button
                  onClick={() => handleFaqToggle(index)}
                  className="cursor-pointer w-full flex justify-between items-center text-left"
                >
                  <h3 className="font-medium text-sm sm:text-xl text-[#232323] pr-4">
                    {faq.question}
                  </h3>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="mt-3 sm:mt-4 transition-transform">
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
    </div>
  );
}