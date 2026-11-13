import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { isAppPath, useMbaInsights } from '@/api/mbaInsights';
import { formatPercent, sectionShort } from './format';
import { SectionChip } from './ui';

/** Dashboard: up to three weak topics, flagged only with enough evidence. */
export default function InsightsCard() {
  const { data, isPending, isError } = useMbaInsights();

  return (
    <section aria-labelledby="weak-spots-heading" className="ss-panel p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="weak-spots-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Weak spots
        </h2>
        <Link to="/mba/insights" className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
          All insights
        </Link>
      </div>
      {isPending ? (
        <div className="mt-3 h-[72px] animate-pulse rounded-xl bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : isError ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">Insights are unavailable right now.</p>
      ) : data.weakTopics.length === 0 ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          {data.topics.length === 0
            ? 'Answer a few questions and your topic accuracy will show up here.'
            : `No weak topic yet. A topic is flagged after ${data.rules.minAttempts} answers${
                data.lowEvidenceCount ? ` — ${data.lowEvidenceCount} topic${data.lowEvidenceCount === 1 ? ' needs' : 's need'} more` : ''
              }.`}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.weakTopics.slice(0, 3).map((t) => {
            const inner = (
              <>
                <SectionChip section={t.section} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{t.topic}</span>
                  <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">
                    {formatPercent(t.accuracy === null ? null : t.accuracy * 100)} over {t.attempts} answers in {sectionShort(t.section)}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--neutral-400)]" aria-hidden />
              </>
            );
            return (
              <li key={`${t.section}-${t.topic}`}>
                {isAppPath(t.href) ? (
                  <Link to={t.href} className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-3 hover:bg-[var(--brand-purple-50)]">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
