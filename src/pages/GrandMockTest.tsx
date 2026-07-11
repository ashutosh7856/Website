import { useState, useEffect } from "react";
import { Clock, Calendar, Target, FileText, Zap, BarChart, ChevronRight, ChevronUp, CheckCircle, Image as ImageIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/Grand Mock Test/CountdownTimer";
import RegistrationModal from "@/components/Grand Mock Test/RegistrationModal";
import SuccessModal from "@/components/Grand Mock Test/SuccessModal";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/AuthStore";
import { checkGrandMockTestRegistration } from "@/api/userTestSeries"; 

export default function GrandMockTest() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); 
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const { isAuthenticated, userId } = useAuthStore();

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (isAuthenticated && userId) {
        try {
          const response = await checkGrandMockTestRegistration(userId);
          
          if (response?.data?.hasRegistered === true) {
            setIsRegistered(true);
          }
        } catch (error) {
          console.error("Failed to check registration status", error);
        }
      }
    };

    checkRegistrationStatus();
  }, [isAuthenticated, userId]);

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const features = [
    {
      icon: <Target className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Real MHT CET Experience",
      description: "Feel the exact pressure, layout, and difficulty of the actual examination.",
    },
    {
      icon: <Clock className="w-full h-full text-[#2F43F2] p-1.5" />,
      title: "Time-bound 3 Hour Test",
      description: "Practice your time management with a strict 3-hour full-length mock paper.",
    },
    {
      icon: <FileText className="w-full h-full text-[#FA7415] p-1.5" />,
      title: "Latest CET Pattern",
      description: "Questions are meticulously curated strictly according to the latest 2026 syllabus.",
    },
    {
      icon: <BarChart className="w-full h-full text-[#2F43F2] p-1.5" />,
      title: "Identify Real Rank",
      description: "Get state-level benchmarking to understand where you stand among peers.",
    },
    {
      icon: <Zap className="w-full h-full text-[#22C55D] p-1.5" />,
      title: "Boost Speed & Accuracy",
      description: "Learn to handle exam pressure gracefully while maintaining high accuracy.",
    },
    {
      icon: <CheckCircle className="w-full h-full text-[#FA7415] p-1.5" />,
      title: "Detailed Analytics",
      description: "Get an in-depth performance report highlighting your strengths and weak areas by analyzing your results.",
    },
  ];

  const faqs = [
    {
      question: "Is the Grand Mock Test strictly based on the 2026 syllabus?",
      answer: "Yes, the test is designed completely in alignment with the latest MHT-CET 2026 syllabus and guidelines.",
    },
    {
      question: "Is there any registration fee?",
      answer: "No, the Grand Mock Test is 100% free for all aspiring MHT-CET students.",
    },
    {
      question: "How will I receive the test link?",
      answer: "Once you register, the test link and instructions will be sent to your registered email address and mobile number closer to the exam date.",
    },
    {
      question: "Can I take the test on my mobile phone?",
      answer: "While you can access it on mobile, we highly recommend taking the test on a laptop or desktop to experience the real CBT (Computer Based Test) environment.",
    },
  ];

  const handleEnrollNow = () => {
    if (isRegistered) return;
    setIsRegistrationOpen(true);
  };
  (window as any).__promoPageEnroll = handleEnrollNow;

  return (
    <div className="min-h-screen bg-white font-poppins leading-[100%]">
      {/* Hero Section */}
      <section
        className="pt-18 sm:pt-22 md:pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden"
        style={{
          minHeight: "auto",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 9.39%, #F5F6FF 83.91%)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
            
            <div className="w-full md:w-[50%] xl:w-[60%] space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 rounded-full gap-2 border border-green-200 shadow-sm">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-bold text-xs sm:text-sm tracking-wide uppercase">
                  100% Free Registration
                </span>
              </div>

              <h1 className="text-[#232323] font-semibold text-2xl sm:text-3xl md:text-[36px] tracking-normal md:text-left">
                GRAND MOCK TEST <br />
                <span className="text-[#2F43F2] font-semibold">by Aaditya COEP</span>
              </h1>

              <p 
                className="max-w-2xl text-sm sm:text-lg md:text-xl tracking-normal md:text-left mx-auto md:mx-0"
                style={{ color: "#6B7280", fontWeight: 500 }}
              >
                MHT CET Final Preparation Starts Here. Assess your readiness before the actual battle.
              </p>

              <div className="flex items-center justify-between md:justify-start w-full md:w-fit gap-3 sm:gap-6 bg-white/50 px-3 py-3 sm:p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F43F2]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold text-sm sm:text-base text-[#232323]">29 March (Sun)</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-300 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FA7415]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold text-sm sm:text-base text-[#232323]">2pm - 5pm</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-start pt-4 w-full">
                {isRegistered ? (
                  <div className="flex flex-row items-center gap-[12px] w-full sm:w-auto">
                    
                    <Button 
                      disabled
                      className="bg-green-600 text-white px-2 sm:px-6 py-5 sm:py-6 text-[12px] sm:text-base font-medium rounded-xl flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-md cursor-not-allowed opacity-90 whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 
                      Registered
                    </Button>
                    
                    <Button 
                      onClick={() => window.open('https://whatsapp.com/channel/0029Vb7l9UmJ93wNDFVyaa0B', '_blank')}
                      className="bg-[#25D366] hover:bg-[#20b858] text-white px-2 sm:px-6 py-5 sm:py-6 text-[12px] sm:text-base font-medium rounded-xl flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:-translate-y-1 whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-current" /> 
                      Join WhatsApp
                    </Button>

                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsRegistrationOpen(true)}
                    className="bg-[#FF660F] hover:bg-[#e15500] text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-medium rounded-xl cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-1"
                  >
                    Register Now for FREE
                  </Button>
                )}
                
                {!isRegistered && (
                  <p className="text-xs text-gray-500 mt-3 font-medium">Limited slots available. Secure your place today.</p>
                )}
              </div>
            </div>

            <div className="w-full md:w-[50%] xl:w-[40%] flex justify-center md:justify-end mt-8 md:mt-0">
              <div className="relative w-full max-w-[500px]">
                <div 
                  className="rounded-2xl relative w-full aspect-square bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400"
                  style={{ boxShadow: "0px 12px 24px -8px rgba(0, 0, 0, 0.10)" }}
                >
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Image Placeholder</p>
                  <img loading="lazy" decoding="async" src="/all maharashtra ranking.png" alt="Grand Mock Test" className="absolute inset-0 w-full h-full object-cover rounded-2xl" /> 
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-y border-gray-100 shadow-[0_10px_30px_rgba(47,67,242,0.03)] relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[18px] sm:text-2xl md:text-3xl font-bold text-[#0E1629] mb-8">
            The Ultimate Test Begins In
          </h2>
          <CountdownTimer />
        </div>
      </section>

      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-5 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Why Take The Grand Mock Test?
            </h2>
            <p 
              className="text-[12px] sm:text-lg max-w-2xl mx-auto"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              This isn't just another mock test. It is the closest simulation to the real MHT-CET exam you will ever take.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group transition-all duration-300 w-full shadow-none py-0 sm:min-h-[190px]"
                style={{
                  borderRadius: "24px",
                  border: "1px solid #E8EAED",
                  backgroundColor: "#FFFFFF",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2F43F2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8EAED"; }}
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
                      <h3 className="mb-2" style={{ fontWeight: 500, color: "#0E1629" }}>
                        <span className="text-[16px] sm:text-lg md:text-[20px]">{feature.title}</span>
                      </h3>
                      <p className="font-normal text-[#6B7280]">
                        <span className="text-[14px] sm:text-base md:text-[18px]">{feature.description}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

      <RegistrationModal 
        isOpen={isRegistrationOpen} 
        onClose={() => setIsRegistrationOpen(false)} 
        onSuccess={() => {
          setIsRegistrationOpen(false);
          setIsSuccessOpen(true);
          setIsRegistered(true);
        }}
      />

      <SuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
      />
    </div>
  );
}