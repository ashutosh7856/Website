import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, Megaphone } from 'lucide-react';
import { useMbaExamUpdates } from '@/api/mbaExamUpdates';
import { formatDate } from '@/components/mba/format';

const SHOWN = 4;

/** Dashboard card: the latest official updates for the student's exams (hidden when there are none). */
export default function ExamUpdatesCard() {
  const { data } = useMbaExamUpdates();
  const ref = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const updates = data?.updates ?? [];

  // Notifications link to /mba/dashboard#exam-updates.
  useEffect(() => {
    if (hash === '#exam-updates' && updates.length) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, updates.length]);

  if (!updates.length) return null;
  return (
    <section ref={ref} id="exam-updates" aria-labelledby="exam-updates-heading" className="ss-panel scroll-mt-20 p-5">
      <h2 id="exam-updates-heading" className="ss-display flex items-center gap-2 text-[17px] text-[var(--ink)]">
        <Megaphone className="h-4 w-4 text-[var(--brand-purple-500)]" aria-hidden />
        Exam updates
      </h2>
      <ul className="mt-3 divide-y divide-[var(--borders-default)]">
        {updates.slice(0, SHOWN).map((u) => (
          <li key={u.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
            <p className="flex flex-wrap items-center gap-1.5 font-[Poppins] text-[11px] font-semibold text-[var(--neutral-500)]">
              <span className="rounded-full bg-[var(--brand-purple-100)] px-2 py-0.5 text-[var(--brand-purple-700)]">
                {u.examLabel}
              </span>
              <span>{u.kindLabel}</span>
              {u.eventDate && <span>· {formatDate(u.eventDate)}</span>}
            </p>
            <p className="font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{u.title}</p>
            {u.detail && <p className="font-[Poppins] text-[12.5px] text-[var(--neutral-600)]">{u.detail}</p>}
            <a
              href={u.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-500)] underline"
            >
              Official notice <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
        Always confirm dates on the official site before you act.
      </p>
    </section>
  );
}
