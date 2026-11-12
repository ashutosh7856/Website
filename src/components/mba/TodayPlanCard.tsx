import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useWeekPlan } from '@/api/mbaPlanner';
import { TASK_TYPE_LABEL, TASK_TYPE_TONE, formatMinutes, isAppPath } from '@/lib/mbaPlanner';

/**
 * Dashboard card: today's tasks from the study plan (GET /mba/me/plan).
 * Quietly renders nothing while loading or on error — the dashboard's own
 * priorities stay the main call to action.
 */
export default function TodayPlanCard() {
  const { data: plan, isSuccess } = useWeekPlan('');
  if (!isSuccess || !plan) return null;
  const today = plan.days.find((d) => d.date === plan.today);
  const tasks = (today?.tasks ?? []).filter((t) => t.status !== 'skipped');
  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <section aria-labelledby="today-plan-heading" className="ss-panel p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="today-plan-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Today&rsquo;s plan
        </h2>
        <Link to="/mba/planner" className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
          Week view
        </Link>
      </div>
      {!plan.generated ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          No plan for this week yet.{' '}
          <Link to="/mba/planner" className="font-semibold text-[var(--brand-purple-700)]">
            Build one in a click
          </Link>{' '}
          from your hours and CAT date.
        </p>
      ) : tasks.length === 0 ? (
        <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          {today?.rest ? 'Rest day. Recharge for tomorrow.' : 'Nothing planned for today.'}
        </p>
      ) : (
        <>
          <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {done} of {tasks.length} done · {formatMinutes(tasks.reduce((n, t) => n + t.minutes, 0))}
          </p>
          <ul className="mt-3 space-y-2">
            {tasks.slice(0, 4).map((t) => {
              const inner = (
                <>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2"
                    style={{
                      borderColor: t.status === 'done' ? 'var(--green-600)' : 'var(--borders-default)',
                      background: t.status === 'done' ? 'var(--green-600)' : '#fff',
                    }}
                    aria-label={t.status === 'done' ? 'Done' : undefined}
                  >
                    {t.status === 'done' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">{t.title}</span>
                    <span className="block font-[Poppins] text-[11px]" style={{ color: TASK_TYPE_TONE[t.type] }}>
                      {TASK_TYPE_LABEL[t.type]} · {formatMinutes(t.minutes)}
                    </span>
                  </span>
                  {isAppPath(t.href) && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--neutral-400)]" />}
                </>
              );
              return (
                <li key={t.id}>
                  {isAppPath(t.href) ? (
                    <Link to={t.href} className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-2.5 hover:bg-[var(--brand-purple-50)]">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--borders-default)] p-2.5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {tasks.length > 4 && (
            <Link to="/mba/planner" className="mt-2 inline-block font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
              +{tasks.length - 4} more
            </Link>
          )}
        </>
      )}
    </section>
  );
}
