import { ChevronRight, Check } from "lucide-react";
import { NavigationControls } from "../components/LeftRightButton";

export default function PartnerPrograms() {
  return (
    <div className="bg-[#C6DDF040] w-full py-10">
      <div className="max-w-[1440px] mx-auto px-[60px]">
        {/* Partner Cards Container */}
        <div className="flex gap-[24px] justify-center mb-8">
          {/* Gyan Dhan Card */}
          <div className="w-[648px] h-[265px] rounded-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] relative overflow-hidden"
               style={{ background: "linear-gradient(90deg, #81c041 84.259%, white 90.509%)" }}>
            {/* Logo */}
            <div className="absolute top-[28px] right-[32px] w-[84px] h-[72px]">
              <img loading="lazy" decoding="async" src="/gyandhan-logo.png" alt="GyanDhan" className="w-full h-full object-contain" />
            </div>

            {/* Main Content */}
            <div className="p-6">
              <h2 className="font-[Poppins] font-bold text-[24px] text-[#48387c] leading-normal max-w-[417px] mb-[62px]">
                Plan your education journey with clarity and confidence to
              </h2>

              {/* Features */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex gap-[176px]">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-[#48387c]" strokeWidth={3} />
                    <span className="font-[Poppins] font-medium text-[12px] text-[#48387c]">
                      Access the right loans
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-[#48387c]" strokeWidth={3} />
                    <span className="font-[Poppins] font-medium text-[12px] text-[#48387c]">
                      Get expert advice
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-[#48387c]" strokeWidth={3} />
                  <span className="font-[Poppins] font-medium text-[12px] text-[#48387c]">
                    A supportive network
                  </span>
                </div>
              </div>

              {/* Bottom Text */}
              <p className="font-[Poppins] font-medium text-[12px] text-[#181818] mb-4">
                So you can focus on what truly matters:{" "}
                <span className="font-[Poppins] font-bold text-[#48387c]">Building Your Future.</span>
              </p>

              {/* CTA Button */}
              <div className="flex items-center gap-4">
                <p className="font-[Poppins] font-semibold text-[14px] text-[#48387c] underline cursor-pointer">
                  Check your Loan Eligibility
                </p>
                <div className="w-[40px] h-[36px] bg-[#48387c] rounded flex items-center justify-center cursor-pointer">
                  <ChevronRight size={20} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="absolute bottom-0 right-0 w-[229px] h-[135px]">
              <img loading="lazy" decoding="async" src="/gyandhan-illustration.png" alt="Education" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Scaler Card */}
          <div className="w-[648px] h-[265px] rounded-[16px] shadow-[2px_2px_7px_0px_rgba(47,67,242,0.2)] relative overflow-hidden"
               style={{ background: "linear-gradient(90.99deg, #0041CA 100.35%, #FFFFFF 86.506%)" }}>
            {/* Logo */}
            <div className="absolute top-[33px] right-[28px] w-[112px] h-[39px]">
              <img loading="lazy" decoding="async" src="/scaler-logo.png" alt="Scaler" className="w-full h-full object-contain" />
            </div>

            {/* Main Content */}
            <div className="p-6">
              <h2 className="font-[Poppins] font-bold text-[24px] text-[#0041ca] leading-normal max-w-[391px] mb-[62px]">
                Become Software Developer with AI Skills
              </h2>

              {/* Features */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex gap-[31px]">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-[#0041ca]" strokeWidth={3} />
                    <span className="font-[Poppins] font-medium text-[12px] text-[#0041ca]">
                      Hands-on learning
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-[#0041ca]" strokeWidth={3} />
                    <span className="font-[Poppins] font-medium text-[12px] text-[#0041ca]">
                      Learn industry-relevant skills
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-[#0041ca]" strokeWidth={3} />
                  <span className="font-[Poppins] font-medium text-[12px] text-[#0041ca]">
                    Build real projects
                  </span>
                </div>
              </div>

              {/* Bottom Text */}
              <p className="font-[Poppins] font-normal text-[12px] text-[#021028] mb-4">
                In-demand software{" "}
                <span className="font-[Poppins] font-semibold text-[#0041ca]">skills</span> with{" "}
                <span className="font-[Poppins] font-semibold text-[#0041ca]">AI</span> to real-world problems.
              </p>

              {/* CTA Button */}
              <div className="flex items-center gap-4">
                <p className="font-[Poppins] font-semibold text-[14px] text-[#0041ca] underline cursor-pointer">
                  Apply Now
                </p>
                <div className="w-[40px] h-[36px] bg-[#0041ca] rounded flex items-center justify-center cursor-pointer">
                  <ChevronRight size={20} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="absolute bottom-0 right-0 w-[176px] h-[150px]">
              <img loading="lazy" decoding="async" src="/scaler-illustration.png" alt="Coding" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="max-w-[1320px] w-full">
          <NavigationControls showSeeAll={false} />
        </div>
      </div>
    </div>
  );
}
