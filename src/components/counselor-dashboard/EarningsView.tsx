import type { EarningsData } from '@/types/earnings';
import { Info } from 'lucide-react';
import EarningsTrendChart from './EarningsTrendChart';
import { useState } from 'react';
import CompensationModal from './modals/CompensationModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import PlanBreakdownCard from './cards/PlanBreakdownCard';

interface EarningsViewProps {
  data: EarningsData;
}

const COLORS = {
  elite: '#EE89DF',
  pro: '#978FED',
  plus: '#F6CF7D', 
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, payload }: any) => {
    const radius = outerRadius * 1.2; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    const textOffsetX = x > cx ? 8 : -8; 

    return (
      <g>
        <circle cx={x} cy={y} r={8} fill={payload.color} />
        <text 
            x={x + textOffsetX} 
            y={y} 
            fill={payload.color}
            textAnchor={textAnchor} 
            dominantBaseline="central" 
            fontSize="14px" 
            fontWeight="500"
        >
            {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <div className="mt-1 text-sm">
          <p className="text-gray-600">
            Percentage: <span className="font-medium" style={{ color: data.payload.color }}>{data.value.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const planStyles = {
  plus: {
    gradient: 'bg-[#F6CF7D]/20',
    textColor: 'text-[#F6CF7D]',
  },
  pro: {
    gradient: 'bg-[#978FED]/20',
    textColor: 'text-[#978FED]',
  },
  elite: {
    gradient: 'bg-[#EE89DF]/20',
    textColor: 'text-[#EE89DF]',
  }
};

const InfoCard = ({ title, amount, variant }: { title: string; amount: number; variant: 'earnings' | 'payout' }) => {
  const styles = {
    earnings: {
      bg: 'bg-[#F1FDF6]',
      border: 'border-[#C9F7DD]',
      amountColor: 'text-[#14A249]',
    },
    payout: {
      bg: 'bg-[#FFF6F0]',
      border: 'border-[#FFE3D1]',
      amountColor: 'text-[#F97116]',
    },
  };
  const selectedStyle = styles[variant];
  const formatNumber = (num: number) => num.toLocaleString('en-IN');

  return (
    <div className={`flex-1 p-4 rounded-xl border ${selectedStyle.bg} ${selectedStyle.border}`}>
      <p className="font-montserrat text-xs font-normal text-[#232323]">{title}</p>
      <div className={`flex items-center gap-1.5 mt-1 ${selectedStyle.amountColor}`}>
        {variant === 'earnings' ? (
          <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="coin" className="w-5 h-5" /> 
        ) : (
          <span className="text-xl font-semibold">₹</span>
        )}
        <span className="font-montserrat text-xl font-semibold">
          {formatNumber(amount)}
        </span>
      </div>
    </div>
  );
};


export default function EarningsView({ data }: EarningsViewProps) {
    const [timeframe, setTimeframe] = useState<'yearly' | 'monthly'>('yearly');
    const [isSlabModalOpen, setSlabModalOpen] = useState(false);

    const distributionData = [
      { name: 'Elite Plan', value: data.elitePercentage || 0, color: COLORS.elite },
      { name: 'Pro Plan', value: data.proPercentage || 0, color: COLORS.pro },
      { name: 'Plus Plan', value: data.plusPercentage || 0, color: COLORS.plus },
    ].filter(item => item.value > 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base lg:text-xl font-semibold text-[#343C6A] mb-4">Current Cycle Earnings</h2>
        <div className="flex gap-4 lg:gap-6">
          <InfoCard title="Earnings" amount={data.totalEarnings} variant="earnings" />
          <InfoCard title="Payout" amount={data.totalPayout} variant="payout" />
        </div>
      </div>

      <hr className="border-[#E4E4E4] my-6" />
      <div className="mb-6">
        <h2 className="text-base lg:text-xl font-semibold text-[#343C6A] mb-4">Earnings Trend</h2>
        <div className="border border-[#EFEFEF] rounded-xl">
          <div className="p-3 lg:p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#13097D]">Current Slab</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setSlabModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
                  <span className="font-semibold text-sm text-[#13097D]">{data.slabOfCounsellor}</span>
                  <Info size={20} fill="#13097D" className="text-white" />
                </button>
              </div>
            </div>

            <div className="flex items-center bg-[#F9FAFB] border border-[#EFEFEF] p-1 rounded-lg mt-4 h-[39px]">
              <button 
                onClick={() => setTimeframe('monthly')}
                className={`flex-1 text-center py-1 px-2 transition-colors hover:cursor-pointer ${
                  timeframe === 'monthly' ? 'bg-[#343C6A] text-white font-semibold text-xs rounded-md h-[27px]' : 'text-[#232323] text-xs font-medium'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setTimeframe('yearly')}
                className={`flex-1 text-center py-1 px-2 transition-colors hover:cursor-pointer ${
                  timeframe === 'yearly' ? 'bg-[#343C6A] text-white font-semibold text-xs rounded-md h-[27px]' : 'text-[#232323] text-xs font-medium'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <EarningsTrendChart 
            transactions={data.transactionData} 
            timeframe={timeframe}
          />
        </div>
      </div>

      <div className="block lg:hidden">
        <hr className="border-[#E4E4E4] my-6" />

        <div>
          <h2 className="text-base lg:text-xl font-semibold text-[#343C6A]">Earnings Distribution (This Cycle)</h2>
          <div className="mt-4 border border-[#EFEFEF] rounded-xl bg-white h-[257px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100} 
                          fill="#8884d8"
                          dataKey="value"
                          stroke="none"
                      >
                          {distributionData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
              </ResponsiveContainer>
          </div>
        </div>

        <hr className="border-[#E4E4E4] my-6" />

        <div>
          <h2 className="text-base lg:text-xl font-semibold text-[#343C6A]">Plan-wise Breakdown</h2>
          <div className="mt-4 border border-[#EFEFEF] rounded-xl bg-white p-4 space-y-4">
            <PlanBreakdownCard 
              planName="Plus Plan"
              percentage={data.plusPercentage}
              earnings={data.totalPlusEarnings}
              payout={data.totalPlusPayout}
              styles={planStyles.plus}
            />
            <PlanBreakdownCard 
              planName="Pro Plan"
              percentage={data.proPercentage}
              earnings={data.totalProEarnings}
              payout={data.totalProPayout}
              styles={planStyles.pro}
            />
            <PlanBreakdownCard 
              planName="Elite Plan"
              percentage={data.elitePercentage}
              earnings={data.totalEliteEarnings}
              payout={data.totalElitePayout}
              styles={planStyles.elite}
            />
          </div>
        </div>
      </div>
      
      <hr className="border-[#E4E4E4] my-6" />

      <div className="mb-6">
        <h2 className="text-base lg:text-xl font-semibold text-[#343C6A] mb-4">This Year Earnings</h2>
        <div className="flex gap-4 lg:gap-6">
          <InfoCard title="Earnings" amount={data.totalYearEarnings} variant="earnings" />
          <InfoCard title="Payout" amount={data.totalYearPayout} variant="payout" />
        </div>
      </div>

      <hr className="border-[#E4E4E4] my-6" />

      <div>
        <h2 className="text-base lg:text-xl font-semibold text-[#343C6A] mb-4">Lifetime Earnings</h2>
        <div className="flex gap-4 lg:gap-6">
          <InfoCard title="Earnings" amount={data.totalLifetimeEarnings} variant="earnings" />
          <InfoCard title="Payout" amount={data.totalLifetimePayout} variant="payout" />
        </div>
      </div>
      <CompensationModal 
        isOpen={isSlabModalOpen}
        onClose={() => setSlabModalOpen(false)}
        data={data}
      />
    </div>
  );
}