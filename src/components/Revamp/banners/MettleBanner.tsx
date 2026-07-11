import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const METTLE_PATH = '/mettle';

const MettleBanner = () => {
  const navigate = useNavigate();
  const go = () => navigate(METTLE_PATH);

  return (
    <div
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go()}
      aria-label="Mettle AI Career Assessment"
      className="relative w-full max-w-[648px] h-[300px] md:h-[265px] rounded-[12px] md:rounded-2xl overflow-hidden shrink-0 cursor-pointer"
      style={{
        background:
          'linear-gradient(125deg, #2B1D6E 0%, #4F46E5 48%, #7C3AED 100%)',
      }}
    >
      {/* soft brand glows */}
      <div
        className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.45) 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 65%)' }}
      />

      {/* decorative career-compass rings (crafted, not stock) */}
      <svg
        className="pointer-events-none absolute -right-6 bottom-[-30px] md:right-2 md:bottom-[-18px] w-[150px] md:w-[210px] h-auto opacity-30 md:opacity-50"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="92" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="100" cy="100" r="68" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="6 8" />
        <circle cx="100" cy="100" r="44" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M100 56 L112 100 L100 144 L88 100 Z" fill="#FFFFFF" fillOpacity="0.85" />
        <circle cx="100" cy="100" r="6" fill="#FFFFFF" />
      </svg>

      <div className="absolute top-5 left-5 md:top-6 md:left-6 right-5 md:right-auto flex flex-col items-start z-10 md:w-[420px]">
        <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-1 mb-3.5 md:mb-4">
          <img loading="lazy" decoding="async" src="/sparkles.svg" alt="" className="w-[14px] h-[14px]" />
          <span className="font-poppins font-semibold text-[10px] md:text-[11px] tracking-[0.14em] uppercase text-white">
            Mettle · AI Career Test
          </span>
        </div>

        <h2 className="w-full max-w-[230px] md:max-w-none font-poppins font-bold text-[20px] md:text-[26px] leading-[130%] md:leading-[136%] text-white">
          Discover the career you were built for
        </h2>

        <p className="mt-2 md:mt-2.5 font-poppins font-medium text-[12px] md:text-[13px] leading-[140%] text-white/80">
          AI-scored career report · ₹2,000
        </p>

        <div className="mt-4 md:mt-5 flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(); }}
            className="font-poppins font-semibold text-[14px] leading-none text-white underline decoration-solid underline-offset-2 hover:cursor-pointer"
          >
            Take the Test
          </button>

          <button
            type="button"
            aria-label="Take the Mettle Career Test"
            onClick={(e) => { e.stopPropagation(); go(); }}
            className="flex items-center justify-center w-8 md:w-10 h-[28px] md:h-[35.6px] rounded-[5px] bg-white hover:bg-white/90 transition-colors shrink-0 hover:cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#4F46E5' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MettleBanner;
