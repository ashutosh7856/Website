import { useNavigate } from "react-router-dom";
import { TableProperties, ArrowRight } from "lucide-react";

/**
 * Prominent cross-link to the NEET round-wise cutoff analyzer (/neet-cutoffs).
 * Shown on the NEET college/rank predictor pages for easy access. Mobile-first:
 * stacks vertically and stays tappable on phones.
 */
export default function CutoffBanner({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/neet-cutoffs")}
      className={`group w-full text-left rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <TableProperties className="h-5 w-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-gray-800 leading-snug">
          Check round-wise NEET 2026 cutoffs
        </span>
        <span className="mt-0.5 block text-sm text-gray-500">
          See the closing rank of any MBBS/BDS college in every counselling round — AIQ & state quota.
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
        Open cutoffs
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
