import { X, TrendingUp } from 'lucide-react';
import type { EarningsData } from '@/types/earnings';
import { useEffect } from 'react';

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EarningsData;
}

const PlanSlabCard = ({
  planName,
  commission,
  icon,
  styles
}: {
  planName: string;
  commission: number;
  icon: React.ReactNode;
  styles: { gradient: string; border: string; };
}) => (
  <div
    className="w-full h-[71px] md:h-[86px] rounded-2xl p-px"
    style={{ background: styles.border }}
  >
    <div
      className="w-full h-full rounded-[15px] px-3 py-2.5 md:p-4 flex justify-between items-center"
      style={{ background: styles.gradient }}
    >
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-xs md:text-lg text-[#232323]">{planName}</span>
        </div>
        <p className="font-normal md:font-medium text-xs md:text-sm text-[#718EBF] mt-1">Tier Level</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-base md:text-lg text-[#232323]">{commission}%</p>
        <p className="font-normal md:font-medium text-xs md:text-sm text-[#718EBF] mt-1">Commission</p>
      </div>
    </div>
  </div>
);

export default function CompensationModal({ isOpen, onClose, data }: CompensationModalProps) {
    useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  if (!isOpen) return null;

  const planStyles = {
    plus: {
      gradient: 'linear-gradient(266.55deg, rgba(222, 237, 255, 0.4) -57.8%, rgba(126, 136, 211, 0.4) 130.19%)',
      border: 'linear-gradient(265.56deg, rgba(113, 142, 191, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)',
    },
    pro: {
      gradient: 'linear-gradient(266.55deg, rgba(244, 232, 255, 0.4) -57.8%, rgba(250, 244, 255, 0.4) 130.19%)',
      border: 'linear-gradient(265.56deg, rgba(232, 212, 255, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)',
    },
    elite: {
      gradient: 'linear-gradient(266.55deg, rgba(255, 245, 206, 0.4) -57.8%, rgba(234, 197, 145, 0.4) 130.19%)',
      border: 'linear-gradient(265.56deg, rgba(255, 251, 237, 0.4) -99.75%, rgba(234, 197, 145, 0.4) 91.52%)',
    }
  };

  const PlusIcon = () => <img loading="lazy" decoding="async" src="/plusIcon.svg" alt="Plus Plan" className="w-6 h-6" />;
  const ProIcon = () => <img loading="lazy" decoding="async" src="/proIcon.svg" alt="Pro Plan" className="w-6 h-6" />;
  const EliteIcon = () => <img loading="lazy" decoding="async" src="/eliteIcon.svg" alt="Elite Plan" className="w-6 h-6" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-4">
      <div className="relative w-[335px] md:w-[480px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#F9FAFB] p-4 md:p-5 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F1FDF6] border border-[#C9F7DD] flex items-center justify-center shrink-0">
              <TrendingUp className="text-[#28A745] w-5 h-5" />
            </div>
            <h2 className="font-medium text-sm md:text-base text-[#232323]">Compensation Details</h2>
          </div>

          <h3 className="mt-4 md:mt-8 text-base md:text-xl font-semibold text-[#232323]">Slab Information</h3>
          <p className="mt-2 text-xs md:text-sm text-[#718EBF] max-w-md">
            Your total earning for this period is between <span className="font-semibold text-[#13097D]">0 to 5 Lacs ProCoins,</span> hence you fall under this slab.
          </p>
        </div>

        <div className="p-4 md:p-5">
          <h3 className="text-xs md:text-base font-medium md:font-semibold text-[#13097D] md:text-[#343C6A] mb-4">ProCounsel's Compensation</h3>
          <div className="space-y-2.5 md:space-y-6">
            <PlanSlabCard planName="Plus Plan" commission={parseInt(data.plusPlanCommission)} icon={<PlusIcon />} styles={planStyles.plus}/>
            <PlanSlabCard planName="Pro Plan" commission={parseInt(data.proPlanCommission)} icon={<ProIcon />} styles={planStyles.pro} />
            <PlanSlabCard planName="Elite Plan" commission={parseInt(data.elitePlanCommission)} icon={<EliteIcon />} styles={planStyles.elite} />
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-4 md:p-5 border-t border-[#EFEFEF] text-center">
            <p className="text-xs md:text-sm text-[#767676]">
                Compensation rates are calculated based on your<br />total Pro coin earnings
            </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 hover:cursor-pointer right-4 w-8 h-8 flex items-center justify-center text-black rounded-full transition-all duration-200 hover:bg-black hover:text-white hover:ring-2 hover:ring-black"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}