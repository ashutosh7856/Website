import { Link } from 'react-router-dom';
import { SECTION_LABEL, type MbaDashboard } from '@/api/mba';
import { SECTION_ORDER } from '@/lib/mbaLevels';
import { accuracyOf, SECTION_SHORT, SECTION_TONE } from './format';

/**
 * Accuracy by section, as three dials.
 *
 * Each dial carries a tick at 60% — the summit line from mbaLevels — so the
 * student can see how far each section sits from "CAT-ready" without reading
 * the rule. A section with nothing attempted shows a dash, never 0%: no
 * attempts is not the same as no correct answers.
 */

const SUMMIT_LINE = 60;

function Ring({ percent, color, size = 96, stroke = 9 }: { percent: number | null; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const tick = (SUMMIT_LINE / 100) * 2 * Math.PI - Math.PI / 2;
  const cx = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden className="block h-auto w-full">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EEF0F6" strokeWidth={stroke} />
      {safe > 0 && (
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(safe / 100) * c} ${c}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dasharray var(--motion-slow) var(--motion-ease)' }}
        />
      )}
      <line
        x1={cx + (r - stroke / 2 - 2) * Math.cos(tick)}
        y1={cx + (r - stroke / 2 - 2) * Math.sin(tick)}
        x2={cx + (r + stroke / 2 + 2) * Math.cos(tick)}
        y2={cx + (r + stroke / 2 + 2) * Math.sin(tick)}
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SectionRings({ sections }: { sections: MbaDashboard['sections'] }) {
  const byId = new Map(sections.map((s) => [s.id, s]));
  return (
    <section aria-labelledby="sections-heading" className="ss-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sections-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Accuracy by section
        </h2>
        <p className="flex items-center gap-1.5 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          <span aria-hidden className="inline-block h-3 w-[2px] rounded bg-[var(--ink)]" />
          Summit line, 60%
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {SECTION_ORDER.map((id) => {
          const s = byId.get(id) ?? { attempted: 0, correct: 0 };
          const acc = accuracyOf(s.correct, s.attempted);
          const rounded = acc === null ? null : Math.floor(acc);
          return (
            <li key={id} className="flex min-w-0 flex-col items-center text-center">
              <div className="relative w-full max-w-[96px]">
                <Ring percent={acc} color={SECTION_TONE[id].bar} />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="ss-data text-[19px] leading-none text-[var(--ink)]">
                    {rounded === null ? '—' : `${rounded}%`}
                  </span>
                </span>
              </div>
              <p className="mt-2 font-[Poppins] text-[13px] font-semibold text-[var(--ink)]" title={SECTION_LABEL[id]}>
                {SECTION_SHORT[id]}
              </p>
              <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
                {s.attempted ? `${s.correct}/${s.attempted} correct` : 'Not started'}
              </p>
              <span className="sr-only">
                {SECTION_LABEL[id]}: {rounded === null ? 'not started' : `${rounded} percent accuracy over ${s.attempted} questions`}
              </span>
            </li>
          );
        })}
      </ul>
      {sections.every((s) => !s.attempted) && (
        <Link to="/mba/practice" className="mt-4 inline-block font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
          Solve your first question
        </Link>
      )}
    </section>
  );
}
