import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PredictorVariant = 'rank' | 'college' | 'mhtcet' | 'neet-rank' | 'neet-college';

type PredictorCardConfig = {
  title: string;
  description: string;
  cta: string;
  path: string;
  gradient: string;
  titleColor: string;
  textColor: string;
  buttonColor: string;
  icon: string;
  iconAlt: string;
};

const cardConfig: Record<PredictorVariant, PredictorCardConfig> = {
  rank: {
    title: 'JEE Rank Predictor',
    description:
      'Estimate your expected JEE rank from your performance and benchmark your next preparation steps.',
    cta: 'Predict Rank',
    path: '/jee-rank-predictor',
    gradient: 'linear-gradient(96deg, #FBC8AB -12%, #FFF6EF 65%, #FFFFFF 110%)',
    titleColor: '#6A2D1B',
    textColor: '#533329',
    buttonColor: '#6A2D1B',
    icon: '/ranking-1.png',
    iconAlt: 'Rank Predictor Icon',
  },
  college: {
    title: 'JEE College Predictor',
    description:
      'Find colleges that best match your expected rank so you can shortlist smarter and apply confidently.',
    cta: 'Predict Colleges',
    path: '/jee-college-predictor',
    gradient: 'linear-gradient(96deg, #CDE8A6 -12%, #F6FBEF 65%, #FFFFFF 110%)',
    titleColor: '#2F4A13',
    textColor: '#2D3F1A',
    buttonColor: '#2F4A13',
    icon: '/mortarboard-1.png',
    iconAlt: 'College Predictor Icon',
  },
  mhtcet: {
    title: 'MHT-CET College Predictor',
    description:
      'Discover likely MHT-CET colleges from your marks, rank, or percentile and plan your choices with confidence.',
    cta: 'Predict MHT-CET Colleges',
    path: '/mhtcet-college-predictor',
    gradient: 'linear-gradient(96deg, #C4E9EA -12%, #EFFAFA 65%, #FFFFFF 110%)',
    titleColor: '#0E4B4D',
    textColor: '#174447',
    buttonColor: '#0E4B4D',
    icon: '/mortarboard-1.png',
    iconAlt: 'MHT-CET College Predictor Icon',
  },
  'neet-rank': {
    title: 'NEET Rank Predictor',
    description:
      'Turn your expected NEET score into an accurate All India Rank estimate built on real NEET cutoff data.',
    cta: 'Predict NEET Rank',
    path: '/neet-rank-predictor',
    gradient: 'linear-gradient(96deg, #A7E8CE -12%, #ECFBF4 65%, #FFFFFF 110%)',
    titleColor: '#064E3B',
    textColor: '#0F5132',
    buttonColor: '#059669',
    icon: '/ranking-1.png',
    iconAlt: 'NEET Rank Predictor Icon',
  },
  'neet-college': {
    title: 'NEET College Predictor',
    description:
      'Find the MBBS and medical colleges you can target by rank, category, quota and state with admission chances.',
    cta: 'Predict NEET Colleges',
    path: '/neet-college-predictor',
    gradient: 'linear-gradient(96deg, #B9E6DD -12%, #EEFBF8 65%, #FFFFFF 110%)',
    titleColor: '#0E4B4D',
    textColor: '#134E4A',
    buttonColor: '#0D9488',
    icon: '/mortarboard-1.png',
    iconAlt: 'NEET College Predictor Icon',
  },
};

interface PredictorBannerProps {
  variant: PredictorVariant;
}

const PredictorBanner = ({ variant }: PredictorBannerProps) => {
  const navigate = useNavigate();
  const slide = cardConfig[variant];

  return (
    <div className="relative w-full max-w-[648px] h-[300px] md:h-[265px] rounded-[12px] md:rounded-2xl overflow-hidden shrink-0 cursor-pointer">
      <div
        className="relative h-full"
        style={{ background: slide.gradient }}
      >
        <div className="absolute top-5 left-5 md:top-6 md:left-6 flex flex-col items-start z-10 w-[calc(100%-40px)] md:w-[400px]">
          <h2
            className="w-full font-poppins font-bold text-[18px] md:text-[24px] leading-[140%] md:leading-[145%]"
            style={{ color: slide.titleColor }}
          >
            {slide.title}
          </h2>

          <p
            className="mt-3 md:mt-4 font-poppins font-medium text-[12px] md:text-[14px] leading-[145%]"
            style={{ color: slide.textColor }}
          >
            {slide.description}
          </p>

          <div className="mt-4 md:mt-5 flex flex-row items-center gap-3">
            <button
              onClick={() => navigate(slide.path)}
              type="button"
              className="font-poppins font-semibold text-[14px] underline cursor-pointer hover:cursor-pointer"
              style={{ color: slide.titleColor }}
            >
              {slide.cta}
            </button>

            <button
              onClick={() => navigate(slide.path)}
              type="button"
              aria-label={slide.cta}
              className="flex items-center justify-center w-8 md:w-10 hover:cursor-pointer h-[28px] md:h-[35.6px] rounded-[5px] transition-colors shrink-0"
              style={{ backgroundColor: slide.buttonColor }}
            >
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>

        <img loading="lazy" decoding="async"
          src={slide.icon}
          alt={slide.iconAlt}
          className="absolute bottom-5 right-5 md:right-7 w-[110px] md:w-[130px] h-auto object-contain opacity-35 md:opacity-100 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default PredictorBanner;