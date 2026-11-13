import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SECTION_SHORT, formatPercent } from './format';
import { SectionChip } from './ui';
import { useScoreEstimate, type EstimateSection, type ScoreEstimate } from '@/api/mbaPyq';

/** Server-sent hrefs are only followed when they are in-app paths. */
const isAppPath = (href: string) => href.startsWith('/') && !href.startsWith('//');
const pct = (v: number | null) => formatPercent(v === null ? null : v * 100);

const CONFIDENCE: Record<NonNullable<ScoreEstimate['confidence']>, { label: string; color: string; bg: string }> = {
  low: { label: 'Low confidence', color: '#92400E', bg: 'var(--gold-50)' },
  medium: { label: 'Medium confidence', color: 'var(--brand-purple-700)', bg: 'var(--brand-purple-50)' },
  high: { label: 'High confidence', color: 'var(--green-600)', bg: 'var(--green-50)' },
};

/** A low–high band on a 0–max track, with a tick at the expected score. */
function RangeBar({ low, high, expected, max, label }: { low: number; high: number; expected: number; max: number; label: string }) {
  const at = (v: number) => `${Math.min(100, Math.max(0, (v / (max || 1)) * 100))}%`;
  return (
    <div
      role="img"
      aria-label={`${label}: likely ${low} to ${high} out of ${max}, most likely about ${Math.round(expected)}`}
      className="relative h-2.5 w-full rounded-full bg-[var(--neutral-100)]"
    >
      <span
        className="absolute inset-y-0 rounded-full bg-[var(--brand-purple-200)]"
        style={{ left: at(Math.max(0, low)), right: `calc(100% - ${at(high)})` }}
      />
      <span className="absolute -top-0.5 h-3.5 w-1 -translate-x-1/2 rounded-full bg-[var(--brand-purple-700)]" style={{ left: at(expected) }} />
    </div>
  );
}

function Tips({ tips }: { tips: ScoreEstimate['tips'] }) {
  if (tips.length === 0) return null;
  return (
    <ul className="space-y-2">
      {tips.map((t) => {
        const inner = (
          <>
            <span className="min-w-0 flex-1">
              <span className="block font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">{t.title}</span>
              <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{t.detail}</span>
            </span>
            {isAppPath(t.href) && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--neutral-400)]" aria-hidden />}
          </>
        );
        return (
          <li key={t.title}>
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
  );
}

function NotReady({ data, full }: { data: ScoreEstimate; full: boolean }) {
  const percent = Math.round(data.progress * 100);
  return (
    <div className="mt-3 space-y-3">
      <p className="font-[Poppins] text-[13px] text-[var(--neutral-600)]">
        We need a little more of your own work before we can estimate your score honestly.
      </p>
      <div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Data needed for an estimate"
          className="h-2.5 w-full rounded-full bg-[var(--neutral-100)]"
        >
          <span className="block h-full rounded-full bg-[var(--brand-purple-500)]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 font-[Poppins] text-[11px] text-[var(--neutral-500)]">{percent}% of the way there</p>
      </div>
      {data.needs.length > 0 && (
        <ul className="space-y-1.5 font-[Poppins] text-[12px] text-[var(--neutral-700)]">
          {data.needs.map((n) => {
            const parts = [
              n.timedTestsNeeded ? `${n.timedTestsNeeded} timed test${n.timedTestsNeeded === 1 ? '' : 's'}` : null,
              n.questionsNeeded ? `${n.questionsNeeded} more answered question${n.questionsNeeded === 1 ? '' : 's'}` : null,
            ].filter(Boolean);
            return (
              <li key={n.section} className="flex items-center gap-2">
                <SectionChip section={n.section} />
                <span>{parts.join(' and ')}</span>
              </li>
            );
          })}
        </ul>
      )}
      <Tips tips={full ? data.tips : data.tips.slice(0, 1)} />
    </div>
  );
}

function SectionRow({ s, full }: { s: EstimateSection; full: boolean }) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 font-[Poppins] text-[12px]">
        <span className="flex items-center gap-2">
          <SectionChip section={s.id} />
          <span className="text-[var(--neutral-500)]">{s.questionCount} questions</span>
        </span>
        <span className="ss-data text-[13px] text-[var(--ink)]">
          {s.low}–{s.high}
          <span className="text-[11px] text-[var(--neutral-400)]">/{s.maxScore}</span>
        </span>
      </div>
      <RangeBar low={s.low} high={s.high} expected={s.expected} max={s.maxScore} label={SECTION_SHORT[s.id]} />
      {full && (
        <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          {s.types
            .filter((t) => t.questionCount > 0)
            .map(
              (t) =>
                `${t.type === 'TITA' ? 'Type-in' : 'MCQ'}: you answer ${pct(t.attemptRate)} at ${pct(t.accuracy)} accuracy`,
            )
            .join(' · ')}
          {` · ${s.timedTests} timed test${s.timedTests === 1 ? '' : 's'}, ${s.answered} answers`}
        </p>
      )}
    </li>
  );
}

/**
 * The CAT raw-score estimate (GET /mba/me/score-estimate). `compact` on the
 * dashboard, `full` on Insights (per-section MCQ/TITA detail, inputs, every tip).
 */
export default function ScoreEstimateCard({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const { data, isPending, isError } = useScoreEstimate();
  const full = variant === 'full';

  return (
    <section id={full ? 'score-estimate' : undefined} aria-labelledby={`estimate-heading-${variant}`} className="ss-panel p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id={`estimate-heading-${variant}`} className="ss-display text-[17px] text-[var(--ink)]">
          Your CAT score estimate
        </h2>
        {!full && (
          <Link to="/mba/insights#score-estimate" className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
            Details
          </Link>
        )}
      </div>
      {isPending ? (
        <div className="mt-3 h-[96px] animate-pulse rounded-xl bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : isError ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">The estimate is unavailable right now.</p>
      ) : !data.ready || data.low === null || data.high === null || data.expected === null || data.maxScore === null ? (
        <NotReady data={data} full={full} />
      ) : (
        <div className="mt-3 space-y-4">
          <div>
            <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              Likely range on the CAT {data.pattern?.year} pattern
            </p>
            <p className="ss-data mt-0.5 text-[28px] leading-none text-[var(--ink)]">
              {data.low}–{data.high}
              <span className="text-[14px] text-[var(--neutral-400)]"> / {data.maxScore}</span>
            </p>
            <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
              Most likely about {Math.round(data.expected)}.
            </p>
            {data.confidence && (
              <span
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold"
                style={{ background: CONFIDENCE[data.confidence].bg, color: CONFIDENCE[data.confidence].color }}
                title={data.confidenceReason}
              >
                {CONFIDENCE[data.confidence].label}
              </span>
            )}
          </div>
          <ul className="space-y-3">
            {data.sections.map((s) => (
              <SectionRow key={s.id} s={s} full={full} />
            ))}
          </ul>
          {full && (
            <div className="space-y-1 rounded-xl bg-[var(--neutral-50)] p-3 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
              <p className="font-semibold text-[var(--ink)]">What it is based on</p>
              <p>
                {data.inputs.pyqAttempts} previous-year paper test{data.inputs.pyqAttempts === 1 ? '' : 's'} and{' '}
                {data.inputs.mockAttempts} ProCounsel mock{data.inputs.mockAttempts === 1 ? '' : 's'} ({data.inputs.timedAnswered}{' '}
                timed answers), counted most; {data.inputs.practiceQuestions} practice and {data.inputs.dailyQuestions} daily-challenge
                questions for accuracy only. Recent work counts more.
              </p>
              <p>{data.confidenceReason}</p>
              {data.pattern && <p>Type-in (TITA) share per section from {data.pattern.mixBasis}.</p>}
            </div>
          )}
          {data.tips.length > 0 && (
            <div className="space-y-2">
              <p className="font-[Poppins] text-[12px] font-semibold text-[var(--ink)]">How to tighten it</p>
              <Tips tips={full ? data.tips : data.tips.slice(0, 1)} />
            </div>
          )}
        </div>
      )}
      {data && (
        <p className="mt-3 font-[Poppins] text-[11px] leading-relaxed text-[var(--neutral-500)]">{data.disclaimer}</p>
      )}
    </section>
  );
}
