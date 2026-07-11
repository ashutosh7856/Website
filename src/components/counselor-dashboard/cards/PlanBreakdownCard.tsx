interface PlanBreakdownCardProps {
  planName: string;
  percentage: number;
  earnings: number;
  payout: number;
  styles: {
    gradient: string;
    textColor: string;
  };
}

export default function PlanBreakdownCard({ planName, percentage, earnings, payout, styles }: PlanBreakdownCardProps) {
  return (
    <div className="border border-[#EFEFEF] rounded-2xl overflow-hidden">
      <div className={`px-4 py-3 flex justify-between items-center ${styles.gradient}`}>
        <h3 className={`font-semibold text-sm ${styles.textColor}`}>{planName}</h3>
        <span className="bg-white text-xs font-medium px-2 py-1 rounded-full text-gray-700">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="p-4 bg-white flex justify-between items-center">
        <div>
          <p className="text-sm text-[#232323]">Earnings - This Cycle</p>
          <p className="text-xl font-semibold text-gray-800 mt-1 flex items-center gap-2">
             <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="Earnings" className="w-6 h-6" />
            {earnings.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#232323]">Payout</p>
          <p className="text-xl font-semibold text-[#F97116] mt-1">
            ₹ {payout.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}