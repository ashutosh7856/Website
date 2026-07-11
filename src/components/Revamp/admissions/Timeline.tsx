import { useEffect, useState, useRef } from "react";

const DESIGN_WIDTH = 1440;
const TIMELINE_WIDTH = 1280;
const SCALE_X = TIMELINE_WIDTH / DESIGN_WIDTH;

const scaleX = (value: number) => value * SCALE_X;

interface TimelineItemProps {
  month: string;
  title: string;
  iconUrl: string;
  subtitle?: string;
  position: "top" | "bottom";
}

const TimelineItem = ({
  month,
  title,
  iconUrl,
  subtitle,
  position,
}: TimelineItemProps) => {
  if (position === "bottom") {
    return (
      <div className="flex flex-col gap-[40px] items-center justify-center w-[151px] relative">
        <p className="font-bold not-italic text-[#2f43f2] text-[20px] text-center whitespace-pre-wrap leading-normal min-w-full w-[min-content] shrink-0">
          {month}
        </p>
        <div className="flex flex-col gap-[12px] items-center w-full shrink-0">
          <div className="flex items-center justify-center shrink-0">
            <img loading="lazy" decoding="async" src="/line-bottom.svg" alt="line" className="h-[52px] w-[6px] block" />
          </div>
          <div className="flex flex-col min-h-[48px] justify-end text-center text-[#2a2b2a] text-[15px] w-full shrink-0">
            {subtitle ? (
              <p className="whitespace-pre-wrap leading-[24.75px]">
                <span className="text-[#2a2b2a]">
                  {title}
                  <br aria-hidden="true" />
                </span>
                <span className="text-[#6b7280]">{subtitle}</span>
              </p>
            ) : (
              <p className="whitespace-pre-wrap leading-[24.75px]">{title}</p>
            )}
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[32px] left-[calc(50%-0.5px)] top-[32px] w-[37.689px] z-30">
          <div className="absolute bg-white left-0 size-[32px] top-0" />
          <img loading="lazy" decoding="async" src={iconUrl} alt={title} className="absolute left-[3.33px] size-[27.378px] top-[2.13px] max-w-none object-cover pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[40px] items-center justify-center w-[151px] relative">
      <div className="flex flex-col gap-[12px] items-center w-full shrink-0">
        <div className="flex flex-col min-h-[48px] justify-end text-center text-[#2a2b2a] text-[15px] w-full shrink-0">
          {subtitle ? (
            <p className="whitespace-pre-wrap leading-[24.75px]">
              <span className="text-[#6b7280]">
                {subtitle}
                <br aria-hidden="true" />
              </span>
              <span className="text-[#2a2b2a]">{title}</span>
            </p>
          ) : (
            <p className="whitespace-pre-wrap leading-[24.75px]">{title}</p>
          )}
        </div>
        <div className="flex items-center justify-center shrink-0">
          <img loading="lazy" decoding="async" src="/line-top.svg" alt="line" className="h-[52px] w-[6px] block" />
        </div>
      </div>
      <p className="font-bold not-italic text-[#2f43f2] text-[20px] text-center whitespace-pre-wrap leading-normal min-w-full w-[min-content] shrink-0">
        {month}
      </p>
      <div className="-translate-x-1/2 absolute bottom-[32px] h-[32px] left-[calc(50%-0.5px)] w-[30.588px] z-30">
        <div className="absolute bg-white h-[32px] left-[-0.12px] top-0 w-[30.588px]" />
        <img loading="lazy" decoding="async" src={iconUrl} alt={title} className="absolute left-[2.16px] size-[28px] top-[2px] max-w-none object-cover pointer-events-none" />
      </div>
    </div>
  );
};

export default function Timeline() {
  const [isVisible, setIsVisible] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // The last timeline item starts at 2000ms and fades in over 800ms.
            // So we trigger the arrows at 2800ms when the timeline is fully visible.
            timeoutId = setTimeout(() => {
              setShowArrows(true);
            }, 2800);
            
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    const el = sectionRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId); // Cleanup timeout to prevent memory leaks
    };
  }, []);

  const timelineData = [
    {
      month: "Dec-Jan",
      title: "Exam Preps & \nPre Boards",
      iconUrl: "/timeline-icons/exam-time.webp",
      position: "bottom" as const,
    },
    {
      month: "Feb-Mar",
      title: "Board Exams",
      iconUrl: "/timeline-icons/evaluation.png",
      position: "top" as const,
    },
    {
      month: "Mar-Apr",
      title: "Entrance Exam",
      subtitle: "(JEE, NEET)",
      iconUrl: "/timeline-icons/exam-time.webp",
      position: "bottom" as const,
    },
    {
      month: "May-Jun",
      title: "Registration",
      iconUrl: "/timeline-icons/application.png",
      position: "top" as const,
    },
    {
      month: "Jun-Jul",
      title: "Document verification",
      iconUrl: "/timeline-icons/registration.png",
      position: "bottom" as const,
    },
    {
      month: "Jul-Aug",
      title: "Seat Allotment/CAP",
      iconUrl: "/timeline-icons/immigration.webp",
      position: "top" as const,
    },
    {
      month: "Aug-Sep",
      title: "Non CAP/ SPOT/IL Rounds",
      iconUrl: "/timeline-icons/non-cap.webp",
      position: "bottom" as const,
    },
    {
      month: "Sep-Oct",
      title: "Start of Academic year",
      iconUrl: "/timeline-icons/college.png",
      position: "top" as const,
    },
    {
      month: "Aug-Sep",
      title:
        "Assistance with hostel, loans, internships, placements, and further studies",
      iconUrl: "/timeline-icons/assistance.webp",
      position: "bottom" as const,
    },
  ];

  return (
    <div ref={sectionRef} className="relative w-full bg-[#C6DDF040] pt-[80px] pb-2 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-4">
        {/* Section Heading */}
        <h2 className="text-[#0E1629] text-[24px] font-bold text-center mb-14 break-words" style={{ fontFamily: 'Poppins' }}>
          Procounsel Role in your Journey
        </h2>

        {/* Timeline Container */}
        <div className="relative h-[720px] w-full">
          <div className="absolute h-0 left-0 top-[344px] w-full z-20">
          <div className="absolute inset-[-1px_0_0_0]" style={{
            background: "linear-gradient(90deg, #FF6B35 0%, #F7931E 50%, #FF6B35 100%)",
            height: "1px"
          }} />
        </div>

          <div className="relative h-full w-full">
          <div className="absolute top-[10px] z-10 pointer-events-none" style={{ left: scaleX(91.5) }}>
            <div
              className={`absolute bottom-full -translate-x-1/2 mb-2 font-medium text-[15px] text-center whitespace-nowrap transition-opacity duration-500 delay-[800ms] ${showArrows ? "opacity-100" : "opacity-0"}`}
              style={{ left: scaleX(628.5), fontFamily: "Poppins", color: "#F7931E" }}
            >
              <strong>ProCounsel's secondary role:</strong><br />
              From subjects to success - guiding till projects & placements
            </div>
            <div className={`absolute top-0 left-0 h-[2px] bg-[#F7931E] transition-all duration-[600ms] ease-linear delay-[200ms] ${showArrows ? "w-[1117px]" : "w-0"}`} />
            <div className={`absolute top-0 left-0 w-[2px] bg-[#F7931E] transition-all duration-[200ms] ease-linear delay-[0ms] ${showArrows ? "h-[30px]" : "h-0"}`}>
              <div className={`absolute -bottom-[6px] left-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#F7931E] transition-opacity duration-[100ms] delay-[200ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
            <div className={`absolute top-0 w-[2px] bg-[#F7931E] transition-all duration-[200ms] ease-linear delay-[800ms] ${showArrows ? "h-[30px]" : "h-0"}`} style={{ left: scaleX(1257) }}>
              <div className={`absolute -bottom-[6px] left-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#F7931E] transition-opacity duration-[100ms] delay-[1000ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
          </div>

          <div className="absolute top-[80px] z-10 pointer-events-none" style={{ left: scaleX(562.875) }}>
            <div
              className={`absolute bottom-full -translate-x-1/2 mb-2 font-medium text-[15px] text-center whitespace-nowrap transition-opacity duration-500 delay-[1100ms] ${showArrows ? "opacity-100" : "opacity-0"}`}
              style={{ left: scaleX(235.6875), fontFamily: "Poppins", color: "#2f43f2" }}
            >
              <strong>ProCounsel's Primary role:</strong><br />
              Turning aspirations into college admissions
            </div>
            <div className={`absolute top-0 left-0 h-[2px] bg-[#2f43f2] transition-all duration-[400ms] ease-linear delay-[500ms] ${showArrows ? "w-[419px]" : "w-0"}`} />
            <div className={`absolute top-0 left-0 w-[2px] bg-[#2f43f2] transition-all duration-[200ms] ease-linear delay-[300ms] ${showArrows ? "h-[30px]" : "h-0"}`}>
              <div className={`absolute -bottom-[6px] left-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#2f43f2] transition-opacity duration-[100ms] delay-[500ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
            <div className={`absolute top-0 w-[2px] bg-[#2f43f2] transition-all duration-[200ms] ease-linear delay-[900ms] ${showArrows ? "h-[30px]" : "h-0"}`} style={{ left: scaleX(471.375) }}>
              <div className={`absolute -bottom-[6px] left-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#2f43f2] transition-opacity duration-[100ms] delay-[1100ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
          </div>

          <div className="absolute left-0 top-[150px] z-10 pointer-events-none">
            <div
              className={`absolute bottom-full -translate-x-1/2 mb-2 font-medium text-[15px] text-[#2A2B2A] text-center whitespace-nowrap transition-opacity duration-500 delay-[400ms] ${showArrows ? "opacity-100" : "opacity-0"}`}
              style={{ left: scaleX(124), fontFamily: "Poppins" }}
            >
              After Board Exams, school no<br />longer supports student.
            </div>
            <div className={`absolute top-0 left-0 h-[1.5px] bg-[#DC3A3A] transition-all duration-[250ms] ease-linear delay-0 ${showArrows ? "w-[223px]" : "w-0"}`} />
            <div className={`absolute top-0 w-[1.5px] bg-[#DC3A3A] transition-all duration-[150ms] ease-linear delay-[250ms] ${showArrows ? "h-[60px]" : "h-0"}`} style={{ left: scaleX(248) }}>
              <div className={`absolute -bottom-[6px] left-[-3.25px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#DC3A3A] transition-opacity duration-[100ms] delay-[400ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
          </div>

          <div className="absolute left-0 top-[560px] z-10 pointer-events-none">
            <div
              className={`absolute top-full -translate-x-1/2 mt-2 font-medium text-[15px] text-[#2A2B2A] text-center whitespace-nowrap transition-opacity duration-500 delay-[650ms] ${showArrows ? "opacity-100" : "opacity-0"}`}
              style={{ left: scaleX(202.5), fontFamily: "Poppins", lineHeight: "100%" }}
            >
              Coaching role:<br />After results support ends
            </div>
            <div className={`absolute top-0 left-0 h-[1.5px] bg-[#DC3A3A] transition-all duration-[350ms] ease-linear delay-[150ms] ${showArrows ? "w-[361px]" : "w-0"}`} />
            <div className={`absolute bottom-0 w-[1.5px] bg-[#DC3A3A] transition-all duration-[150ms] ease-linear delay-[500ms] ${showArrows ? "h-[60px]" : "h-0"}`} style={{ left: scaleX(405) }}>
              <div className={`absolute -top-[6px] left-[-3.25px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[#DC3A3A] transition-opacity duration-[100ms] delay-[650ms] ${showArrows ? "opacity-100" : "opacity-0"}`} />
            </div>
          </div>

          {timelineData.map((item, index) => {
            const delays = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000];
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${16 + index * ((TIMELINE_WIDTH - 32 - 151) / (timelineData.length - 1))}px`,
                  top: item.position === "bottom" ? "300px" : "209px",
                  width: "151px",
                  opacity: isVisible ? 1 : 0,
                  transition: `opacity 800ms cubic-bezier(0.4, 0, 0.2, 1) ${delays[index]}ms`
                }}
              >
                <TimelineItem {...item} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
  );
}