import { ArrowRight } from 'lucide-react';

const GYANDHAN_LINK = 'https://www.gyandhan.com/loaneligs?campaign_partner=Catalystai+Technology+Private+Limited';

const GyanDhanBanner = () => {
  const handleOpenLoanEligibility = () => {
    window.open(GYANDHAN_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="relative w-full max-w-[648px] h-[300px] md:h-[265px] rounded-[12px] md:rounded-2xl overflow-hidden shrink-0 cursor-pointer"
      style={{
        background: 'linear-gradient(90deg, #81C041 -84.26%, #FFFFFF 99.51%)'
      }}
    >
      <div className="absolute top-5 left-5 md:top-6 md:left-6 flex flex-col items-start z-10 w-[calc(100%-40px)] md:w-auto">
        
        <h2 className="w-full md:w-[417px] font-poppins font-bold text-[18px] md:text-[24px] leading-[140%] md:leading-[170%] text-[#48387C]">
          Plan your education journey with clarity and confidence to
        </h2>

        <div className="mt-2 md:mt-3.5 flex flex-col gap-1.5 md:gap-3">
          <div className="flex flex-col md:flex-row gap-1.5 md:gap-4">
            <div className="flex flex-row items-center gap-2">
              <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkle" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#48387C] fill-[#48387C] shrink-0" />
              <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#48387C]">
                Access the right loans
              </span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkle" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#48387C] fill-[#48387C] shrink-0" />
              <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#48387C]">
                Get expert advice
              </span>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-2">
            <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkle" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#48387C] fill-[#48387C] shrink-0" />
            <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#48387C]">
              A supportive network
            </span>
          </div>
        </div>

        <div className="mt-2.5 md:mt-3.5 w-[280px] md:w-[380px]">
          <p className="font-poppins font-medium text-[12px] leading-[140%] md:leading-none text-[#181818]">
            So you can focus on what truly matters: <span className="font-bold text-[#48387C]">Building Your Future.</span>
          </p>
        </div>

        <div className="mt-3 md:mt-[15px] flex flex-row items-center gap-4">
          <button
            onClick={handleOpenLoanEligibility}
            type="button"
            className="font-poppins hover:cursor-pointer font-semibold text-[14px] leading-none text-[#48387C] underline decoration-solid decoration-auto underline-offset-auto"
          >
            Check your Loan Eligibility
          </button>
          
          <button
            onClick={handleOpenLoanEligibility}
            type="button"
            className="flex items-center hover:cursor-pointer justify-center w-8 md:w-10 h-[28px] md:h-[35.6px] rounded-[5px] bg-[#48387C] hover:bg-[#3b2d66] transition-colors shrink-0"
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>
      </div>

      <img loading="lazy" decoding="async" 
        src="/gyandhanlogo.svg" 
        alt="GyanDhan Logo"
        className="absolute top-4 right-4 md:top-7 md:left-[536px] w-[45px] md:w-[84px] h-auto md:h-[71.65px] z-20 object-contain"
      />

      <img loading="lazy" decoding="async" 
        src="/gyandhan2.svg" 
        alt="Education Illustration"
        className="absolute bottom-[5px] right-[5px] md:bottom-auto md:right-auto md:top-[118px] md:left-[408px] w-[150px] md:w-[229px] h-auto md:h-[135px] z-10 object-contain opacity-30 md:opacity-100"
      />

    </div>
  );
};

export default GyanDhanBanner;