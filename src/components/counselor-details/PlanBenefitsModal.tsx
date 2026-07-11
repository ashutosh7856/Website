import { CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  planName: 'plus' | 'pro' | 'elite';
  data: any;
}

export function PlanBenefitsModal({ isOpen, onClose, planName, data }: Props) {
  if (!isOpen || !data) return null;

  const benefits = data[planName] || [];
  const description = data.desc[planName];
  const price = data.prices[planName];

  const colors = {
    plus: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'text-blue-500' },
    pro: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'text-purple-500' },
    elite: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'text-orange-500' },
  }[planName];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`p-6 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-2xl font-bold capitalize ${colors.text}`}>{planName} Plan</h2>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Limited Access</span>
              </div>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                {description}
              </p>
            </div>
            
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Exclusive Benefits</h3>
          <div className="space-y-4">
            {benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex gap-3">
                <div className={`shrink-0 mt-0.5 ${colors.icon}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-gray-700 text-sm leading-snug">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500 font-medium">Plan Price</p>
                <div className="flex items-center gap-1">
                    <img loading="lazy" decoding="async" src="/coin.svg" alt="coins" className="w-4 h-4" />
                    <span className="text-xl font-bold text-[#343C6A]">{Number(price).toLocaleString('en-IN')}</span>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="bg-[#3537B4] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}