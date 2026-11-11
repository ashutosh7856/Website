/**
 * The route dial.
 *
 * One value against its own maximum, drawn in the same gold as the climbed part
 * of the trail — the arc and the trail report the same number, so they are the
 * same colour. A charting library for a single arc would cost more bundle than
 * this whole page.
 */
export default function ProgressRing({
  percent,
  size = 132,
  stroke = 12,
  label = 'of the route',
  ariaLabel = 'Route complete',
}: {
  percent: number;
  size?: number;
  stroke?: number;
  /** Caption under the number. Defaults to the school dashboard's wording. */
  label?: string;
  ariaLabel?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${ariaLabel}: ${safe} percent`}
      >
        <defs>
          <linearGradient id="ss-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF0F6" strokeWidth={stroke} />
        {safe > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ss-ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(safe / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray var(--motion-slow) var(--motion-ease)' }}
          />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="ss-data text-[30px] leading-none text-[var(--ink)]">{safe}%</span>
        <span className="ss-eyebrow mt-1.5 text-[var(--neutral-400)]">{label}</span>
      </div>
    </div>
  );
}
