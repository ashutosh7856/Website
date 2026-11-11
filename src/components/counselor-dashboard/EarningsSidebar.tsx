import type { EarningsData } from '@/types/earnings';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import PlanBreakdownCard from './cards/PlanBreakdownCard';

interface EarningsSidebarProps {
  data: EarningsData;
}

const COLORS = {
  elite: '#EE89DF',
  pro: '#978FED',
  plus: '#F6CF7D', 
};

interface PieLabelArgs {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  payload: { color: string };
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value: number; payload: { color: string } }>;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, percent, payload } = props as PieLabelArgs;
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
            fontSize="12px" 
            fontWeight="500"
        >
            {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
};

const CustomPieTooltip = ({ active, payload }: PieTooltipProps) => {
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


export default function EarningsSidebar({ data }: EarningsSidebarProps) {
  const distributionData = [
    { name: 'Elite Plan', value: data.elitePercentage || 0, color: COLORS.elite },
    { name: 'Pro Plan', value: data.proPercentage || 0, color: COLORS.pro },
    { name: 'Plus Plan', value: data.plusPercentage || 0, color: COLORS.plus },
  ].filter(item => item.value > 0);


  return (
    <div className="hidden lg:block space-y-6 flex-shrink-0">
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

      <hr className="border-[#E4E4E4]" />

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
  );
}