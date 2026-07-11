import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdityaBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="relative w-[335px] md:w-full max-w-[648px] h-[320px] md:h-[265px] rounded-[12px] md:rounded-2xl overflow-hidden shrink-0 cursor-pointer"
      style={{
        background: 'linear-gradient(90deg, #DA9BC0 -25.31%, #FFFFFF 119.95%)'
      }}
    >
      <div className="absolute top-5 left-5 md:top-6 md:left-6 flex flex-col items-start z-10 w-[295px] md:w-auto">
        <h2 className="w-[280px] md:w-[433px] font-poppins font-bold text-[18px] md:text-[24px] leading-[140%] md:leading-[170%] text-[#634657]">
          Explore Our Comprehensive Range of Courses By Aaditya
        </h2>

        <div className="mt-2 md:mt-3.5 flex flex-col gap-1.5 md:gap-3 w-full">
          <div className="flex flex-col md:flex-row gap-1.5 md:gap-4">
            <div className="flex flex-row items-center gap-2">
              <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkles" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#634657] fill-[#634657] shrink-0"/>
              <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#634657]">
                Flexible learning paths
              </span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkles" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#634657] fill-[#634657] shrink-0"/>
              <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#634657]">
                Expert-led practical learning
              </span>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-2">
            <img loading="lazy" decoding="async" src="sparkles.svg" alt="sparkles" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#634657] fill-[#634657] shrink-0"/>
            <span className="font-poppins font-medium text-[12px] leading-tight md:leading-none text-[#634657]">
              Industry-relevant career programs
            </span>
          </div>
        </div>

        <div className="mt-2.5 md:mt-3.5 w-full md:w-[400px]">
          <p className="font-poppins font-normal text-[12px] leading-[140%] md:leading-none text-[#021028]">
            Crack admissions with structured support along <span className="font-semibold text-[#634657]">56K subscribers</span>
          </p>
        </div>

        <div className="mt-3 md:mt-4 flex flex-col md:flex-row items-start md:items-center gap-2.5 md:gap-0 z-20 relative">
          <div className="flex flex-row items-center gap-4">
            <button
              onClick={() => navigate('/live-sessions')}
              type="button"
              className="font-poppins font-semibold text-[14px] leading-none text-[#021028] underline decoration-solid decoration-auto underline-offset-auto"
            >
              Live Sessions
            </button>
            <button
              onClick={() => navigate('/live-sessions')}
              type="button"
              className="flex items-center justify-center w-8 md:w-10 h-[28px] md:h-[35.6px] rounded-[5px] bg-[#021028] hover:bg-[#1a2b4d] transition-colors shrink-0"
            >
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>

          <button
             onClick={() => navigate('/gurucool')}
             type="button"
             className="ml-0 md:ml-[17px] flex items-center justify-center w-[136px] h-[35px] bg-[#634657] rounded-xl hover:bg-[#523848] transition-colors shrink-0"
          >
             <span className="font-poppins font-semibold text-[12px] md:text-[14px] leading-none text-white underline decoration-solid decoration-auto underline-offset-auto">
                Explore courses
             </span>
          </button>

        </div>
      </div>

      {/* Reduced size and pushed up slightly for mobile */}
      <img loading="lazy" decoding="async" 
        src="/aditya.svg" 
        alt="Aaditya"
        className="absolute bottom-[5px] right-[0px] md:bottom-auto md:right-auto md:top-[50px] md:left-[424px] w-[140px] md:w-[220px] h-auto md:h-[215px] z-0 object-contain opacity-30 md:opacity-100 pointer-events-none"
      />

    </div>
  );
};

export default AdityaBanner;