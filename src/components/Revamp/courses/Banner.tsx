import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseSection from "./CourseSection";
import TestSection from "./TestSection";
import { listenToLiveSessionsStatus } from "@/lib/firebase";
import { useAuthStore } from "@/store/AuthStore";

export default function Banner() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoginToggle, toggleLogin } = useAuthStore();
  const [liveSessionsCount, setLiveSessionsCount] = useState(10);

  const handleLiveSessionsAccess = () => {
    if (isAuthenticated) {
      navigate("/live-sessions");
      return;
    }

    if (!isLoginToggle) {
      toggleLogin(() => navigate("/live-sessions"));
    }
  };

  useEffect(() => {
    const unsubscribe = listenToLiveSessionsStatus((allLives) => {
      const count = Object.values(allLives || {}).filter(
        (session: any) => Boolean(session?.isLive)
      ).length;
      setLiveSessionsCount(Math.max(count, 10));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>

      {/* phone design */}
      <div className="block relative md:hidden">

        <div className="w-full h-[210px] bg-[url('/probuddiesbg.webp')] bg-cover bg-center">
          <div className="w-full h-full bg-[#0E1629A6]/95 px-5 pt-6 text-white">
            <div className="flex flex-col gap-3">
              <h1 className="text-[1.625rem] font-bold leading-tight">Courses</h1>
              <p className="text-xs text-white/85 leading-relaxed max-w-[330px]">
                Learn from curated courses, discover practical test series, and join
                live sessions in one place to stay consistent with your goals.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <img loading="lazy" decoding="async" src="/onne.svg" alt="courses" className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">100+</span>
                    <span className="text-[10px] text-white/75">Courses</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-white/30" />

              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={handleLiveSessionsAccess}
              >
                  <div className="relative">
                    <img loading="lazy" decoding="async" src="/twoo.svg" alt="live sessions" className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{liveSessionsCount} Live</span>
                    <span className="text-[10px] text-white/75">Sessions now</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-white/30" />

                <div className="flex items-center gap-1.5">
                  <img loading="lazy" decoding="async" src="/threee.svg" alt="students" className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">1260+</span>
                    <span className="text-[10px] text-white/75">Students</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <CourseSection/>
          <TestSection/>
        </div>

      </div>






      {/* laptops and desktops view */}
      <div className="hidden md:block">
      <div className="w-full h-[520px] bg-[url('/probuddiesbg.webp')] bg-cover bg-center">
        <div className="flex flex-col gap-8 items-center justify-center w-full h-full bg-[#0E1629A6]/95">
          <div className="flex flex-col gap-6 items-center justify-center">
            <h1 className="text-white font-bold text-[3.75rem]">Courses</h1>
            <p className="bg-gradient-to-r text-transparent bg-clip-text from-[#6B7280] to-[#ffffff]/50 font-medium text-[1.5rem] text-center max-w-[753px]">
              Master in-demand skills with our expert-led courses. Learn at your own pace, practice with real-world projects, and advance your career with confidence.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="flex w-[200px] h-[58px] gap-2  border-r border-(--text-muted) justify-start items-center">
              <img loading="lazy" decoding="async" src="/onne.svg" alt="firstone" />
              <p className="flex flex-col text-[#FFC107] leading-8 font-medium text-[1.5rem]">
                100+<span className="leading-[22px] text-[1rem]">courses</span>
              </p>
            </div>

            <div className="flex w-[200px] h-[58px] gap-2  border-r border-(--text-muted) justify-start items-center relative" onClick={handleLiveSessionsAccess} style={{ cursor: "pointer" }}>
              <div className="relative">
                <img loading="lazy" decoding="async" src="/twoo.svg" alt="firstone" />
                <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" style={{ top: "-4px", right: "-4px" }} />
              </div>
              <p className="flex flex-col text-[#DC3545] leading-8 font-medium text-[1.5rem]">
                {liveSessionsCount}
                <span className="leading-[22px] text-[1rem]">
                  Live Sessions
                </span>
              </p>
            </div>

            <div className="flex w-[200px] h-[58px] gap-2  justify-start items-center">
              <img loading="lazy" decoding="async" src="/threee.svg" alt="firstone" />
              <p className="flex flex-col text-[#198754] leading-8 font-medium text-[1.5rem]">
                1260+
                <span className="leading-[22px] text-[1rem]">Students</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#F5F5F7] flex flex-col pb-20">
        <CourseSection />
        <TestSection />
        
        {/* Live Sessions Section */}
        <div className="w-full pt-16 pb-16">
          <div className="max-w-[1440px] h-full mx-auto px-[60px]">
            <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[220px]">
              <p className="font-[Poppins] font-medium text-[24px] text-[#0E1629] max-w-[760px] leading-normal">
                Join ongoing live sessions with expert professionals and learn in real time.
              </p>
              <button
                onClick={handleLiveSessionsAccess}
                className="px-10 py-4 bg-[#0E1629] text-white hover:cursor-pointer rounded-xl font-[Poppins] font-semibold text-lg hover:opacity-90 transition-all duration-300"
              >
                Explore Live Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
