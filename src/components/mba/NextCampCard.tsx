import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CampId, ClimbView } from '@/lib/mbaLevels';

/**
 * What it takes to reach the next camp, requirement by requirement.
 *
 * Every bar is one rule from mbaLevels with the student's real count against
 * it ("38/100 questions"). The one action offered goes to the page where that
 * rule is earned — practice for question and accuracy camps, mocks for test
 * camps.
 */

const ACTION: Record<CampId, { label: string; to: string }> = {
  base: { label: 'Set up your profile', to: '/mba/profile' },
  'first-steps': { label: 'Start practising', to: '/mba/practice' },
  diagnostic: { label: 'Take a mock', to: '/mba/mocks' },
  ridge: { label: 'Keep practising', to: '/mba/practice' },
  'strong-sections': { label: 'Practise by section', to: '/mba/practice' },
  'high-camp': { label: 'Take a mock', to: '/mba/mocks' },
  summit: { label: 'Practise by section', to: '/mba/practice' },
};

export default function NextCampCard({ climb }: { climb: ClimbView }) {
  const next = climb.next;

  if (!next) {
    return (
      <section
        aria-labelledby="next-camp-heading"
        className="ss-panel overflow-hidden p-5"
        style={{ background: 'var(--gradients-reward-card)', borderColor: 'var(--borders-gold-soft)' }}
      >
        <h2 id="next-camp-heading" className="ss-display text-[19px] text-[var(--ink)]">
          Summit reached: CAT-ready
        </h2>
        <p className="mt-1.5 max-w-[34rem] font-[Poppins] text-[13px] leading-relaxed text-[#6B4E00]">
          Every section is at 60% or better over 50 questions, with 3 tests submitted. Hold that line with a mock
          a week and your mistake reviews.
        </p>
        <Link to="/mba/mocks" className="ss-go mt-4 px-4 py-2.5 text-[13px]">
          Take a mock
        </Link>
      </section>
    );
  }

  const action = ACTION[next.id];
  const single = next.checks.length === 1;
  const pct = Math.round(next.progress * 100);
  const met = next.checks.filter((c) => c.met).length;

  return (
    <section aria-labelledby="next-camp-heading" className="ss-panel relative overflow-hidden p-5">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[#F59E0B]" />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-[Poppins] text-[12px] font-semibold text-[#B45309]">
            Next camp, {next.number} of {climb.camps.length}
          </p>
          <h2 id="next-camp-heading" className="ss-display mt-0.5 text-[22px] leading-tight text-[var(--ink)]">
            {next.name}
          </h2>
        </div>
        {single ? (
          <p className="ss-data text-[28px] leading-none text-[var(--ink)]">
            {pct}
            <span className="text-[14px] text-[var(--neutral-400)]">%</span>
          </p>
        ) : (
          <p className="text-right">
            <span className="ss-data block text-[28px] leading-none text-[var(--ink)]">
              {met}
              <span className="text-[14px] text-[var(--neutral-400)]">/{next.checks.length}</span>
            </span>
            <span className="mt-1 block font-[Poppins] text-[11px] text-[var(--neutral-500)]">requirements met</span>
          </p>
        )}
      </div>

      <ul className="mt-4 space-y-3.5">
        {next.checks.map((check) => (
          <li key={check.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="flex min-w-0 items-center gap-1.5 font-[Poppins] text-[13px] font-medium text-[var(--ink)]">
                {check.met && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--green-600)]" aria-hidden />}
                {check.label}
              </span>
              <span className="ss-data text-[12px] text-[var(--neutral-600)]">
                {check.value}
                {check.met && <span className="sr-only"> (done)</span>}
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EEF0F6]"
              role="progressbar"
              aria-label={check.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(check.progress * 100)}
              aria-valuetext={check.value}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(check.progress * 100)}%`,
                  background: check.met ? 'var(--green-500)' : 'linear-gradient(90deg,#FBBF24,#F59E0B)',
                  transition: 'width var(--motion-slow) var(--motion-ease)',
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <Link to={action.to} className="ss-go mt-5 px-4 py-2.5 text-[13px]">
        {action.label}
      </Link>
    </section>
  );
}
