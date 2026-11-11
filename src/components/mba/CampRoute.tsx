import { Check, Lock } from 'lucide-react';
import { campProgressLabel, type ClimbView } from '@/lib/mbaLevels';

/**
 * The route, camp by camp — the text version of the drawing in the hero.
 *
 * Read top to bottom it is the climb from Base Camp to the summit. Each row
 * says what the camp asks for in plain words; the state is spelled out as well
 * as drawn, so nothing depends on telling gold from slate.
 */
export default function CampRoute({ climb }: { climb: ClimbView }) {
  return (
    <section aria-labelledby="route-heading" className="ss-panel p-5">
      <h2 id="route-heading" className="ss-display text-[17px] text-[var(--ink)]">
        The route
      </h2>
      <p className="mt-1 font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">
        Camps are climbed in order and follow your live numbers, so an accuracy camp can slip if your accuracy does.
      </p>

      <ol className="relative mt-4">
        {climb.camps.map((camp, i) => {
          const state = climb.states[i];
          const reached = state === 'reached';
          const next = state === 'next';
          const last = i === climb.camps.length - 1;
          return (
            <li key={camp.id} className="relative flex gap-3 pb-3.5 last:pb-0">
              {/* The rope between markers. Gold up to the camp you stand on. */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute top-8 bottom-0 left-[15px] w-[2px] rounded-full"
                  style={{ background: reached && climb.states[i + 1] === 'reached' ? '#F59E0B' : '#E3E6EF' }}
                />
              )}
              <span
                aria-hidden
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ss-data border-2 text-[12px]"
                style={
                  reached
                    ? { background: '#FBBF24', borderColor: '#F59E0B', color: '#2A1400' }
                    : next
                      ? { background: '#FFFFFF', borderColor: '#F59E0B', color: 'var(--ink)' }
                      : { background: '#F1F3F8', borderColor: '#D8DDE9', color: '#64748B' }
                }
              >
                {camp.number}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span
                    className="font-[Poppins] text-[14px] font-semibold"
                    style={{ color: state === 'ahead' ? '#475569' : 'var(--ink)' }}
                  >
                    {camp.name}
                  </span>
                  {reached ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 font-[Poppins] text-[11px] font-semibold text-[#166534]">
                      <Check className="h-3 w-3" aria-hidden />
                      Reached
                    </span>
                  ) : next ? (
                    <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-[Poppins] text-[11px] font-semibold text-[#92400E]">
                      {camp.progress > 0 ? `Next, ${campProgressLabel(camp)}` : 'Next'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-[Poppins] text-[11px] text-[#64748B]">
                      <Lock className="h-3 w-3" aria-hidden />
                      Ahead
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-[Poppins] text-[12px] leading-snug text-[var(--neutral-500)]">{camp.rule}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
