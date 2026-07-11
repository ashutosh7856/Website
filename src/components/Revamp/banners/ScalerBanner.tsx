import { ArrowRight } from 'lucide-react';

const SCALER_LINK = 'https://bit.ly/PRO50_';

const ScalerBanner = () => {
  const handleOpen = () => {
    window.open(SCALER_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="relative w-full max-w-[648px] h-[300px] md:h-[265px] rounded-[12px] md:rounded-2xl overflow-hidden shrink-0 cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #477DF1 0%, #0138AF 100%)',
      }}
    >
      <div className="absolute top-5 left-5 md:top-6 md:left-6 flex flex-col items-start z-10 w-[calc(100%-40px)] md:w-[380px]">
        <img loading="lazy" decoding="async"
          src="/scalerlogo.svg"
          alt="Scaler Academy Logo"
          className="w-[90px] md:w-[110px] h-auto object-contain mb-3 md:mb-4"
        />

        <h2 className="w-full font-poppins font-bold text-[18px] md:text-[22px] leading-[140%] text-white">
          Become Future Ready Software Developer with AI Skills
        </h2>

        <div className="mt-3 md:mt-4 flex flex-row items-center gap-3">
          <button
            onClick={handleOpen}
            type="button"
            className="font-poppins hover:cursor-pointer font-semibold text-[14px] leading-none text-white underline decoration-solid underline-offset-auto"
          >
            Apply Now
          </button>

          <button
            onClick={handleOpen}
            type="button"
            aria-label="Apply Now at Scaler Academy"
            className="flex items-center hover:cursor-pointer justify-center w-8 md:w-10 h-[28px] md:h-[35.6px] rounded-[5px] transition-colors shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#0138AF' }} />
          </button>
        </div>
      </div>

      <img loading="lazy" decoding="async"
        src="/scaler.svg"
        alt="Scaler Academy"
        className="absolute bottom-[5px] right-[5px] md:bottom-auto md:right-auto md:top-[30px] md:left-[400px] w-[140px] md:w-[220px] h-auto md:h-[220px] z-0 object-contain opacity-25 md:opacity-100 pointer-events-none"
      />
    </div>
  );
};

export default ScalerBanner;
