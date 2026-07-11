import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { probuddiesApi } from '@/api/pro-buddies';
import { Loader2, Phone, Clock, TrendingUp, IndianRupee } from 'lucide-react';

type AnyMap = Record<string, unknown>;

const isAnyMap = (v: unknown): v is AnyMap =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toArray = (payload: unknown): AnyMap[] => {
  if (Array.isArray(payload)) return payload.filter(isAnyMap);
  if (!isAnyMap(payload)) return [];
  const keys = ['data', 'result', 'items', 'calls', 'callHistory'];
  for (const k of keys) {
    const n = payload[k];
    if (Array.isArray(n)) return n.filter(isAnyMap);
  }
  return [];
};

const toStr = (v: unknown, fb = 'NA') => {
  if (typeof v !== 'string') return fb;
  const t = v.trim();
  return t.length ? t : fb;
};

const parseDateTime = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return { dateLabel: 'NA', timeLabel: 'NA' };
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return { dateLabel: value, timeLabel: 'NA' };
  return {
    dateLabel: parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeLabel: parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const formatSeconds = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 'NA';
  if (num === 0) return '0s';
  const m = Math.floor(num / 60);
  const s = num % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

const getMonthlyChartData = (calls: Array<{ coins: number | null; dateLabel: string }>) => {
  const monthlyEarnings: Record<number, number> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  calls.forEach(call => {
    try {
      const [, month] = call.dateLabel.split(' ');
      const monthIndex = monthNames.findIndex(m => m === month);
      if (monthIndex !== -1) {
        monthlyEarnings[monthIndex] = (monthlyEarnings[monthIndex] || 0) + (call.coins ?? 0);
      }
    } catch {
      // Skip if date parsing fails
    }
  });

  return monthNames.map((label, index) => ({
    label,
    value: monthlyEarnings[index] || 0,
  }));
};

const getYearlyChartData = (calls: Array<{ coins: number | null; dateLabel: string }>) => {
  const yearlyEarnings: Record<number, number> = {};
  const currentYear = new Date().getFullYear();
  
  calls.forEach(call => {
    try {
      const dateParts = call.dateLabel.split(' ');
      if (dateParts.length >= 3) {
        const yearStr = dateParts[2];
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          yearlyEarnings[year] = (yearlyEarnings[year] || 0) + (call.coins ?? 0);
        }
      }
    } catch {
      // Skip if date parsing fails
    }
  });

  // Show last 4 years
  const years: number[] = [];
  for (let i = 3; i >= 0; i--) {
    years.push(currentYear - i);
  }

  return years.map(year => ({
    label: String(year),
    value: yearlyEarnings[year] || 0,
  }));
};

function EarningBlock({ title, amount, type }: { title: string; amount: string; type: 'earnings' | 'payout' }) {
  const isEarnings = type === 'earnings';
  return (
    <div className={`flex-1 rounded-[16px] border flex flex-col justify-center px-4 py-3 ${isEarnings ? 'border-[#C9F7DD]' : 'border-[#FFE3D1]'}`}>
      <span className="text-[13px] font-medium text-[#6B7280] leading-none mb-2">{title}</span>
      <div className="flex items-center gap-2">
        {isEarnings ? (
          <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="Procoin" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <IndianRupee className="w-4 h-4 text-[#F97116]" />
        )}
        <span className={`text-[20px] font-bold leading-none ${isEarnings ? 'text-[#14A249]' : 'text-[#F97116]'}`}>
          {amount}
        </span>
      </div>
    </div>
  );
}

const ProBuddyEarningsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Call Revenue' | 'Payouts'>('Call Revenue');
  const [slabTab, setSlabTab] = useState('Yearly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const proBuddyId = useMemo(() => localStorage.getItem('phone') || '', []);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['probuddy-earnings-calls', proBuddyId],
    queryFn: () => probuddiesApi.proBuddyCallHistory(proBuddyId),
    enabled: Boolean(proBuddyId),
  });

  const { data: profileData } = useQuery({
    queryKey: ['probuddy-profile', proBuddyId],
    queryFn: () => probuddiesApi.profileForProBuddy(proBuddyId),
    enabled: Boolean(proBuddyId),
  });

  const calls = useMemo(() => toArray(rawData).map((item, i) => {
    const { dateLabel, timeLabel } = parseDateTime(item.startTime ?? item.callDateTime);
    const paymentSettled = item.paymentSettled;
    const isPaid = paymentSettled === true;
    const isPending = paymentSettled === false || paymentSettled === null || paymentSettled === undefined;
    const coins = item.proCoinTransferred != null ? Number(item.proCoinTransferred) : null;
    const status = toStr(item.status ?? item.callStatus, 'unknown');

    return {
      id: toStr(item.id ?? item.callSid ?? `${i}`, `${i}`),
      userId: toStr(item.userId ?? null, ''),
      dateLabel,
      timeLabel,
      duration: formatSeconds(item.conversationDuration ?? item.duration),
      coins,
      status,
      isPaid,
      isPending,
      paymentLabel: paymentSettled === true ? 'Paid' : 'Pending',
    };
  }), [rawData]);

  const completedCalls = useMemo(() => calls.filter(c => c.status === 'completed'), [calls]);
  const paidCalls = useMemo(() => completedCalls.filter(c => c.isPaid), [completedCalls]);
  const pendingPaymentCalls = useMemo(() => completedCalls.filter(c => !c.isPaid), [completedCalls]);
  
  // Use walletAmount from profile for total coins (source of truth - unpaid/unsettled coins only)
  const walletAmount = useMemo(() => {
    const profileResponse = profileData as any;
    if (profileResponse?.data?.walletAmount) {
      return Number(profileResponse.data.walletAmount);
    }
    return 0;
  }, [profileData]);

  // Total Coins = Current wallet amount (unpaid coins)
  const totalCoins = walletAmount;
  
  // Total Earned = All coins earned from all calls (paid + unpaid)
  const totalEarned = useMemo(() =>
    completedCalls.reduce((sum, c) => sum + (c.coins ?? 0), 0), [completedCalls]);
  
  // Paid Coins = Coins that have been settled/paid out
  const paidCoins = useMemo(() =>
    paidCalls.reduce((sum, c) => sum + (c.coins ?? 0), 0), [paidCalls]);

  // Generate dynamic chart data
  const monthlyChartData = useMemo(() => getMonthlyChartData(completedCalls), [completedCalls]);
  const yearlyChartData = useMemo(() => getYearlyChartData(completedCalls), [completedCalls]);

  const chartData = slabTab === 'Monthly' ? monthlyChartData : yearlyChartData;
  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.value), 1);
    // Round up to nearest 500
    return Math.ceil(max / 500) * 500;
  }, [chartData]);

  return (
    <div className="pt-3 pl-3 pr-3 sm:pt-6 sm:pl-6 sm:pr-0 font-['Poppins'] h-full">
      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-transition { animation: fadeInSlide 0.25s ease-out forwards; }
      `}</style>

      {/* Tab switcher */}
      <div className="flex gap-2 h-[34px] mb-6">
        {(['Call Revenue', 'Payouts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 h-full rounded-[24px] cursor-pointer transition-colors text-[14px] font-medium ${
              activeTab === tab ? 'bg-[#E8E7F2] text-[#0E1629]' : 'text-[#6B7280]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div key={activeTab} className="tab-transition">

        {/* ── Call Revenue Tab ── */}
        {activeTab === 'Call Revenue' && (
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">

            {/* Stats column */}
            <div className="w-full xl:w-[420px] flex flex-col gap-5">

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] bg-[#EEF2FF] border border-[#C7D2FE] p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Phone className="w-4 h-4 text-[#2F43F2]" />
                    <span className="text-[12px] font-medium text-[#6B7280]">Total Calls</span>
                  </div>
                  <p className="text-[24px] font-bold text-[#0E1629]">{calls.length}</p>
                </div>
                <div className="rounded-[16px] bg-[#F0FDF4] border border-[#BBF7D0] p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-4 h-4 text-[#14A249]" />
                    <span className="text-[12px] font-medium text-[#6B7280]">Total Earned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="coin" className="w-5 h-5 rounded-full object-cover" />
                    <p className="text-[24px] font-bold text-[#14A249]">{totalEarned}</p>
                  </div>
                </div>
                <div className="rounded-[16px] bg-[#FFF7ED] border border-[#FDE68A] p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IndianRupee className="w-4 h-4 text-[#F97116]" />
                    <span className="text-[12px] font-medium text-[#6B7280]">Paid Out</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="coin" className="w-5 h-5 rounded-full object-cover" />
                    <p className="text-[24px] font-bold text-[#F97116]">{paidCoins}</p>
                  </div>
                </div>
                <div className="rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-[#E11D48]" />
                    <span className="text-[12px] font-medium text-[#6B7280]">Payment Pending</span>
                  </div>
                  <p className="text-[24px] font-bold text-[#E11D48]">{pendingPaymentCalls.length}</p>
                </div>
              </div>

              <hr className="border-[#EFEFEF]" />

              {/* Earnings blocks */}
              <div>
                <p className="text-[15px] font-semibold text-[#0E1629] mb-3">Earnings Breakdown</p>
                <div className="flex gap-3">
                  <EarningBlock title="Total Coins" amount={String(totalCoins)} type="earnings" />
                  <EarningBlock title="Settled" amount={String(paidCoins)} type="payout" />
                </div>
              </div>
            </div>

            {/* Chart column */}
            <div className="flex flex-col">
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#0E1629] leading-none mb-4">
                Earnings Trend
              </h3>
              <div className="w-full xl:w-[444px] h-[320px] sm:h-[380px] rounded-[16px] border border-[#EFEFEF] bg-white relative overflow-hidden">
                <h4 className="absolute top-[18px] left-[18px] text-[16px] sm:text-[18px] font-semibold text-[#0E1629] leading-none">
                  Current Slab
                </h4>
                <div className="absolute top-[56px] left-[18px] right-[18px] h-[52px] rounded-[12px] border border-[#EFEFEF] bg-[#F9FAFB] flex items-center justify-center gap-3">
                  {(['Monthly', 'Yearly'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlabTab(s)}
                      className={`flex-1 h-[41px] flex items-center justify-center cursor-pointer transition-colors text-[14px] font-medium leading-none rounded-[8px] ${
                        slabTab === s ? 'bg-[#2F43F2] text-white font-semibold' : 'text-[#0E1629]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="absolute top-[140px] left-[18px] right-[18px] h-[180px] sm:h-[220px] flex overflow-x-auto overflow-y-hidden pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="w-[40px] h-[190px] flex flex-col justify-between items-end pr-2 text-[12px] text-[#B8B8B8] border-r border-dashed border-[#E5E5E5] shrink-0">
                    <span>{maxChartValue}</span><span>{Math.round(maxChartValue * 0.67)}</span><span>{Math.round(maxChartValue * 0.33)}</span><span>0</span>
                  </div>
                  <div className="grow min-w-[412px] h-[190px] relative flex items-end justify-between pl-3 pr-2 border-b border-dashed border-[#E5E5E5]">
                    {chartData.map((d, i) => (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-end h-full relative cursor-pointer w-5 ${hoveredIndex === i ? 'z-50' : 'z-10'}`}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div className={`absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-white rounded-[8px] shadow-[0px_4px_16px_rgba(0,0,0,0.12)] px-3 py-2 flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${hoveredIndex === i ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                          <span className="text-[13px] font-bold text-[#0E1629]">{d.label}:</span>
                          <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="coin" className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[13px] font-medium text-[#EAB308]">{d.value}</span>
                          <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45 shadow-[4px_4px_10px_rgba(0,0,0,0.06)] rounded-[1px] -z-10" />
                        </div>
                        <div
                          className="w-5 bg-[#2F43F2] rounded-t-[4px] transition-all duration-300 opacity-90 hover:opacity-100"
                          style={{ height: `${maxChartValue > 0 ? (d.value / maxChartValue) * 100 : 0}%` }}
                        />
                        <div className="absolute bottom-[-45px] text-[12px] font-medium text-[#B8B8B8] -ml-[18px] -rotate-90 origin-top translate-y-[-50%]">
                          {d.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payouts Tab ── */}
        {activeTab === 'Payouts' && (
          <div className="flex flex-col gap-4 pr-0 sm:pr-4">

            {/* Summary strip — payment status only */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="text-[12px] font-medium text-[#6B7280]">Paid</span>
                <span className="text-[15px] font-bold text-[#14A249]">{paidCalls.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[12px] font-medium text-[#6B7280]">Payment Pending</span>
                <span className="text-[15px] font-bold text-[#B45309]">{pendingPaymentCalls.length}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-[#2F43F2]" />
              </div>
            ) : completedCalls.length === 0 ? (
              <p className="text-[#6B7280] py-4 text-[14px]">No completed calls found.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB]">
                {completedCalls.map((call) => (
                  <div
                    key={call.id}
                    className="w-full xl:max-w-[680px] rounded-[14px] border border-[#EFEFEF] bg-white flex items-center gap-3 px-4 py-3 hover:shadow-sm transition-all"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#2F43F2]" />
                    </div>

                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0E1629] truncate">
                        {call.userId || 'User'}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                        {call.dateLabel} · {call.timeLabel}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="text-center shrink-0 hidden sm:flex items-center gap-1 text-[#6B7280]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-medium">{call.duration}</span>
                    </div>

                    {/* Coins earned */}
                    {call.coins != null && (
                      <div className="flex items-center gap-1.5 shrink-0 bg-[#FFF8E1] border border-[#FDE68A] rounded-[10px] px-3 py-1.5">
                        <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="coin" className="w-4 h-4 rounded-full object-cover" />
                        <span className="text-[13px] font-bold text-[#B45309]">{call.coins}</span>
                      </div>
                    )}

                    {/* Payment status — the only status shown here */}
                    <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border ${
                      call.isPaid
                        ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                        : 'bg-[#FFFBEB] border-[#FDE68A]'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${call.isPaid ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                      <span className={`text-[12px] font-semibold ${call.isPaid ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                        {call.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProBuddyEarningsTab;
