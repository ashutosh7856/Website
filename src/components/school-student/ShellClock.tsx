import { useEffect, useState } from 'react';
import { Icon } from '@/components/school-student/assets';

/**
 * The date and time, in the shell header.
 *
 * It lives here rather than on the dashboard hero because the hero version was
 * a line of eyebrow text over a photographic sky, and it lost: you had to go
 * looking for it. This sits in the sticky header next to the streak and points,
 * wearing the same chip as they do, so it is on every school page and reads at
 * a glance rather than on inspection.
 *
 * ─── The tick ────────────────────────────────────────────────────────────────
 *
 * It fires on the MINUTE BOUNDARY, not every sixty seconds from whenever the
 * page happened to load. A plain `setInterval(…, 60_000)` started at :47 shows
 * the wrong minute for 47 seconds out of every one, so a clock next to a
 * student's watch is visibly behind it. The first timeout lands on the
 * boundary, then an interval takes over.
 *
 * Seconds are not shown. A per-second re-render of the shell header, forever,
 * to animate a digit nobody is reading is not a trade worth making.
 */
export default function ShellClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      clearTimeout(align);
      clearInterval(interval);
    };
  }, []);

  // en-IN so the date reads the way it is written in India — 3 Sep, not Sep 3.
  const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  return (
    <time
      dateTime={now.toISOString()}
      className="ss-surface flex shrink-0 items-center gap-2 px-2.5 py-2 whitespace-nowrap sm:gap-2.5 sm:px-3 md:px-4"
    >
      <Icon name="bookingCalendar" className="hidden h-5 w-5 sm:block" />
      <span className="font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)]">
        <strong className="block text-[13px] font-bold text-[var(--neutral-900)] sm:text-[14px]">{time}</strong>
        {/* Phones get the time only — the date comes back once there is room. */}
        <span className="hidden sm:inline">{date}</span>
      </span>
    </time>
  );
}
