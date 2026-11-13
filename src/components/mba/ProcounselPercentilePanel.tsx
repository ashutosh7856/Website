import { Users } from 'lucide-react';
import type { ProcounselPercentile } from '@/api/mba';
import { percentileLine } from './format';

/** Result page: the attempt's standing among ProCounsel students — never an official CAT percentile. */
export default function ProcounselPercentilePanel({ value }: { value: ProcounselPercentile }) {
  return (
    <section aria-labelledby="pc-percentile-heading" className="ss-panel flex items-start gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-50)]">
        <Users className="h-5 w-5 text-[var(--brand-purple-700)]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="pc-percentile-heading" className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]">
          ProCounsel percentile
        </h2>
        {value.percentile !== null && (
          <p className="ss-data mt-0.5 text-[24px] leading-none text-[var(--ink)]">{value.percentile.toFixed(1)}</p>
        )}
        <p className="mt-1 font-[Poppins] text-[13px] text-[var(--neutral-700)]">{percentileLine(value)}</p>
        <p className="mt-1 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          Compared only with ProCounsel students&rsquo; first attempt of this same test. This is not your official CAT
          percentile, which only the IIMs publish with the CAT result.
        </p>
      </div>
    </section>
  );
}
