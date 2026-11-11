import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import { ArrowUp } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', earnings: 1200 },
  { day: 'Tue', earnings: 800 },
  { day: 'Wed', earnings: 1100 },
  { day: 'Thu', earnings: 500 },
  { day: 'Fri', earnings: 900 },
  { day: 'Sat', earnings: 1800 },
];

interface BarLabelProps {
  x: number;
  y: number;
  width: number;
  value: number;
}

// recharts injects these props when the element is cloned by <LabelList content>.
const RenderBarLabel = (props: Partial<BarLabelProps>) => {
  const { x, y, width, value } = props as BarLabelProps;
  return (
    <g>
      <rect x={x + width / 2 - 25} y={y - 28} width={50} height={20} fill="#718EBF" rx={4} />
      <text x={x + width / 2} y={y - 15} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={12}>
        ₹{value}
      </text>
    </g>
  );
};

export default function EarningsChart() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Earnings for this week</h3>
        <div className="flex items-center gap-2 text-sm">
          <button className="text-gray-500 hover:text-gray-800 px-3 py-1 rounded-md">Today</button>
          <button className="bg-gray-100 text-gray-800 font-semibold px-3 py-1 rounded-md">This week</button>
          <button className="text-gray-500 hover:text-gray-800 px-3 py-1 rounded-md">This Month</button>
        </div>
      </div>

      <div className="bg-[#F9FAFB] rounded-lg p-4">
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData} margin={{ top: 30, right: 0, left: 0, bottom: 5 }} barGap={56}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#232323', fontSize: 14, fontWeight: 500 }} />
              <YAxis hide={true} domain={[0, 'dataMax + 500']} />
              <Bar dataKey="earnings" fill="#3C82F6" barSize={70} radius={[8, 8, 0, 0]}>
                <LabelList dataKey="earnings" content={<RenderBarLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-6 bg-[#F9FAFB] rounded-lg p-4 space-y-4">
        <div>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                ₹12,450 
                <span className="text-sm font-medium text-green-600 flex items-center">
                    <ArrowUp className="w-4 h-4" /> 12%
                </span>
            </p>
            <p className="text-base text-gray-500 mt-1">This month</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-xl font-semibold text-[#13097D]">₹2,567</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-xl font-semibold text-[#13097D]">₹2,567</p>
            </div>
        </div>
      </div>
    </div>
  );
}