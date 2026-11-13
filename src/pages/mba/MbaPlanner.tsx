import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, MoveRight, Plus, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import PlanExplainer from '@/components/mba/PlanExplainer';
import { mbaErrorMessage } from '@/api/mba';
import { trackEvent } from '@/lib/analytics';
import {
  useCreateTask,
  useDeleteTask,
  useGeneratePlan,
  usePatchTask,
  useWeekPlan,
  type PlanDay,
  type PlanTask,
  type WeekPlan,
} from '@/api/mbaPlanner';
import {
  TASK_TYPE_LABEL,
  TASK_TYPE_TONE,
  WEEKDAY_SHORT,
  addDays,
  buildWeekIcs,
  downloadIcs,
  formatDay,
  formatMinutes,
  isAppPath,
  weekProgress,
} from '@/lib/mbaPlanner';

const inputClass =
  'mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[13px] font-normal text-[var(--ink)]';
const labelClass = 'block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]';
const iconButton =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--neutral-500)] hover:bg-[var(--brand-purple-50)] hover:text-[var(--brand-purple-700)] disabled:cursor-not-allowed disabled:opacity-50';

function TaskItem({ task, today }: { task: PlanTask; today: string }) {
  const patch = usePatchTask();
  const remove = useDeleteTask();
  const [moving, setMoving] = useState(false);
  const [moveTo, setMoveTo] = useState(task.date);
  const [error, setError] = useState<string | null>(null);
  const done = task.status === 'done';
  const skipped = task.status === 'skipped';
  const busy = patch.isPending || remove.isPending;

  const update = (body: Parameters<typeof patch.mutate>[0]) => {
    setError(null);
    patch.mutate(body, {
      onSuccess: () => {
        setMoving(false);
        if (body.status === 'done') trackEvent('mba_planner_task_completed', { task_type: task.type });
      },
      onError: (err) => setError(mbaErrorMessage(err, 'Could not update the task.')),
    });
  };

  const title = (
    <span
      className={`block font-[Poppins] text-[13px] leading-snug font-semibold break-words ${skipped ? 'text-[var(--neutral-400)] line-through' : 'text-[var(--ink)]'}`}
    >
      {task.title}
    </span>
  );

  return (
    <li
      className="rounded-xl border border-[var(--borders-default)] bg-white p-2.5"
      style={{ borderLeft: `3px solid ${TASK_TYPE_TONE[task.type]}`, opacity: skipped ? 0.75 : 1 }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => update({ id: task.id, status: done ? 'pending' : 'done' })}
          disabled={busy}
          aria-pressed={done}
          aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
          className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 disabled:opacity-50"
          style={{
            borderColor: done ? 'var(--green-600)' : 'var(--borders-default)',
            background: done ? 'var(--green-600)' : '#fff',
          }}
        >
          {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          {isAppPath(task.href) && !skipped ? (
            <Link to={task.href} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
          <span className="mt-1 flex flex-wrap items-center gap-1.5 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            <span className="font-semibold" style={{ color: TASK_TYPE_TONE[task.type] }}>
              {TASK_TYPE_LABEL[task.type]}
            </span>
            <span className="whitespace-nowrap">· {formatMinutes(task.minutes)}</span>
            {task.section && task.type !== 'practice' && <SectionChip section={task.section} />}
          </span>
          <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            {done && task.autoCompleted && 'Ticked off from your activity'}
            {skipped && 'Skipped'}
            {task.status === 'pending' && task.date < today && 'Still open'}
          </span>
          {task.detail && !skipped && (
            <span className="mt-1 block xl:hidden font-[Poppins] text-[11.5px] leading-snug text-[var(--neutral-500)]">{task.detail}</span>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-end gap-0.5">
        {skipped ? (
          <button type="button" onClick={() => update({ id: task.id, status: 'pending' })} disabled={busy} className={iconButton} aria-label={`Bring back ${task.title}`} title="Bring back">
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : (
          !done && (
            <button type="button" onClick={() => update({ id: task.id, status: 'skipped' })} disabled={busy} className={iconButton} aria-label={`Skip ${task.title}`} title="Skip">
              <SkipForward className="h-4 w-4" />
            </button>
          )
        )}
        {!done && (
          <button type="button" onClick={() => setMoving((m) => !m)} disabled={busy} className={iconButton} aria-expanded={moving} aria-label={`Move ${task.title} to another day`} title="Move to another day">
            <MoveRight className="h-4 w-4" />
          </button>
        )}
        {task.source === 'custom' && (
          <button
            type="button"
            onClick={() => remove.mutate(task.id, { onError: (err) => setError(mbaErrorMessage(err, 'Could not delete the task.')) })}
            disabled={busy}
            className={`${iconButton} hover:bg-red-50 hover:text-[var(--red-500)]`}
            aria-label={`Delete ${task.title}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {moving && (
        <form
          className="mt-2 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (moveTo && moveTo !== task.date) update({ id: task.id, date: moveTo });
          }}
        >
          <label className={`${labelClass} min-w-0 flex-1`}>
            Move to
            <input type="date" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={inputClass} required />
          </label>
          <button type="submit" disabled={busy || !moveTo || moveTo === task.date} className="btn-primary cursor-pointer px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            Move
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-1 font-[Poppins] text-[11.5px] text-[var(--red-500)]">
          {error}
        </p>
      )}
    </li>
  );
}

function DayCard({ day, today }: { day: PlanDay; today: string }) {
  const isToday = day.date === today;
  return (
    <section
      aria-label={formatDay(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}
      className="ss-panel flex min-w-0 flex-col p-3"
      style={isToday ? { boxShadow: '0 0 0 2px var(--brand-purple-500)' } : undefined}
    >
      <header>
        <h3 className="font-[Poppins] text-[13px] font-bold whitespace-nowrap text-[var(--ink)]">
          {WEEKDAY_SHORT[day.weekday]} <span className="font-normal text-[var(--neutral-500)]">{formatDay(day.date, { day: 'numeric', month: 'short' })}</span>
        </h3>
        <div className="mt-0.5 flex min-h-[20px] items-center justify-between gap-2">
          <span className="ss-data text-[12px] text-[var(--neutral-500)]">{day.plannedMinutes > 0 ? formatMinutes(day.plannedMinutes) : ''}</span>
          {isToday && (
            <span className="rounded-full bg-[var(--brand-purple-100)] px-2 py-0.5 font-[Poppins] text-[10.5px] font-bold text-[var(--brand-purple-700)]">Today</span>
          )}
        </div>
      </header>

      {day.examDay && (
        <p className="mt-2 rounded-xl bg-[var(--gold-50)] px-3 py-2 font-[Poppins] text-[12px] font-semibold text-[#92400E]">CAT day. All the best.</p>
      )}
      {day.tasks.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {day.tasks.map((t) => (
            <TaskItem key={t.id} task={t} today={today} />
          ))}
        </ul>
      ) : (
        !day.examDay && (
          <p className="mt-2 font-[Poppins] text-[12px] text-[var(--neutral-400)]">
            {day.rest ? 'Rest day. Recharge.' : day.date < today ? 'Nothing planned.' : 'Free day.'}
          </p>
        )
      )}
      {day.rest && day.tasks.length > 0 && <p className="mt-2 font-[Poppins] text-[11px] text-[var(--neutral-400)]">Rest day in your profile</p>}
    </section>
  );
}

function AddTaskForm({ plan, onDone }: { plan: WeekPlan; onDone: () => void }) {
  const create = useCreateTask();
  const firstOpen = plan.today >= plan.weekStart && plan.today <= plan.weekEnd ? plan.today : plan.weekStart;
  const [date, setDate] = useState(firstOpen);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate(
      { date, title: title.trim(), minutes },
      { onSuccess: onDone, onError: (err) => setError(mbaErrorMessage(err, 'Could not add the task.')) },
    );
  };

  return (
    <form onSubmit={submit} className="ss-panel space-y-3 p-4 md:p-5" aria-label="Add your own task">
      <h2 className="ss-display text-[16px] text-[var(--ink)]">Add your own task</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_170px_120px]">
        <label className={labelClass}>
          What
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} required maxLength={120} placeholder="Read an editorial, revise formulas…" className={inputClass} />
        </label>
        <label className={labelClass}>
          Day
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Minutes
          <input type="number" min={5} max={600} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} required className={inputClass} />
        </label>
      </div>
      {error && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={create.isPending || !title.trim()} className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {create.isPending ? 'Adding…' : 'Add task'}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}

function WhyThisPlan({ plan }: { plan: WeekPlan }) {
  const { basis } = plan;
  return (
    <section aria-labelledby="why-heading" className="ss-panel p-5">
      <h2 id="why-heading" className="ss-display text-[17px] text-[var(--ink)]">
        Why this plan
      </h2>
      <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
        Built by fixed rules from your profile and progress, so the same inputs always give the same week. Change your hours, study days or CAT date in{' '}
        <Link to="/mba/profile" className="font-semibold text-[var(--brand-purple-700)]">
          Profile
        </Link>
        , then rebuild.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 font-[Poppins] text-[12.5px] leading-snug text-[var(--neutral-700)]">
        {basis.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <dl className="mt-3">
        {basis.sections.map((s) => (
          <div key={s.id} className="ss-readout">
            <dt className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              {s.id} · {s.attempted} answered
            </dt>
            <dd className="ss-data text-[13px] text-[var(--ink)]">
              {s.accuracy === null ? 'no data yet' : `${Math.round(s.accuracy * 100)}%`} · weight {s.weight}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * /mba/planner — the student's week: generated by the server's rules,
 * editable task by task (done, skip, move, add your own).
 */
export default function MbaPlanner() {
  const [params, setParams] = useSearchParams();
  const week = params.get('week') ?? '';
  const { data: plan, isPending, isError, error, refetch } = useWeekPlan(week);
  const generate = useGeneratePlan();
  const [adding, setAdding] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const goTo = (next: string | null) => {
    setAdding(false);
    setGenError(null);
    setParams(next ? { week: next } : {}, { replace: true });
  };

  const build = () => {
    if (!plan) return;
    setGenError(null);
    generate.mutate(plan.weekStart, { onError: (err) => setGenError(mbaErrorMessage(err, 'Could not build the plan.')) });
  };

  const progress = plan ? weekProgress(plan) : null;
  const isThisWeek = !!plan && plan.today >= plan.weekStart && plan.today <= plan.weekEnd;
  const hasTasks = !!plan && plan.summary.planned > 0;

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="Study plan"
        title="Your week, planned"
        lead="Built from your study hours, CAT date and accuracy. Tick tasks off, skip or move them; the plan adapts."
        aside={
          progress && hasTasks ? (
            <span className="font-[Poppins] text-[12px] text-white/70">
              {progress.done}/{progress.counted} done
            </span>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="ss-surface flex items-center gap-1 p-1">
          <button type="button" onClick={() => plan && goTo(addDays(plan.weekStart, -7))} disabled={!plan} className={iconButton} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-1 font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
            {plan ? `${formatDay(plan.weekStart, { day: 'numeric', month: 'short' })} – ${formatDay(plan.weekEnd, { day: 'numeric', month: 'short' })}` : 'This week'}
          </span>
          <button type="button" onClick={() => plan && goTo(addDays(plan.weekStart, 7))} disabled={!plan} className={iconButton} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {plan && !isThisWeek && (
          <button type="button" onClick={() => goTo(null)} className="btn-secondary cursor-pointer px-3 py-2 font-[Poppins] text-[12px] font-semibold">
            This week
          </button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {plan?.canGenerate && plan.generated && (
            <button type="button" onClick={build} disabled={generate.isPending} className="btn-secondary flex cursor-pointer items-center gap-1.5 px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> {generate.isPending ? 'Rebuilding…' : 'Rebuild open tasks'}
            </button>
          )}
          {plan && (
            <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding} className="btn-secondary flex cursor-pointer items-center gap-1.5 px-3 py-2 font-[Poppins] text-[12px] font-semibold">
              <Plus className="h-4 w-4" /> Add task
            </button>
          )}
          {plan && hasTasks && (
            <button
              type="button"
              onClick={() => downloadIcs(buildWeekIcs(plan, window.location.origin), `cat-study-plan-${plan.weekStart}.ics`)}
              className="btn-secondary flex cursor-pointer items-center gap-1.5 px-3 py-2 font-[Poppins] text-[12px] font-semibold"
            >
              <CalendarPlus className="h-4 w-4" /> Add week to calendar
            </button>
          )}
        </div>
      </div>

      {genError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {genError}
        </p>
      )}

      {adding && plan && <AddTaskForm plan={plan} onDone={() => setAdding(false)} />}

      {isPending ? (
        <Skeleton rows={3} />
      ) : isError || !plan ? (
        <StateBlock tone="error" title="We couldn't load your plan" detail={mbaErrorMessage(error)} action={{ label: 'Try again', onClick: () => void refetch() }} />
      ) : (
        <>
          {!plan.generated && plan.canGenerate && (
            <section className="ss-panel flex flex-col items-start gap-3 p-5 md:flex-row md:items-center">
              <CalendarDays className="h-9 w-9 shrink-0 text-[var(--brand-purple-500)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <h2 className="ss-display text-[17px] text-[var(--ink)]">{isThisWeek ? "Plan this week" : 'Plan this week ahead'}</h2>
                <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
                  About {formatMinutes(plan.basis.minutesPerStudyDay)} on each study day, {plan.basis.mocksThisWeek} mock
                  {plan.basis.mocksThisWeek === 1 ? '' : 's'}, more time where your accuracy is lowest. You can change anything after.
                </p>
              </div>
              <button type="button" onClick={build} disabled={generate.isPending} className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-50">
                {generate.isPending ? 'Building…' : 'Build my plan'}
              </button>
            </section>
          )}

          {progress && hasTasks && (
            <section aria-labelledby="progress-heading" className="ss-panel p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="progress-heading" className="ss-display text-[17px] text-[var(--ink)]">
                  This week so far
                </h2>
                <span className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
                  {plan.summary.skipped > 0 && `${plan.summary.skipped} skipped · `}
                  {formatMinutes(progress.doneMinutes)} of {formatMinutes(progress.plannedMinutes)}
                </span>
              </div>
              <div
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--brand-purple-50)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percent}
                aria-label={`${progress.done} of ${progress.counted} tasks done`}
              >
                <div className="h-full rounded-full bg-[var(--brand-purple-500)]" style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-700)]">
                <strong className="ss-data text-[var(--ink)]">
                  {progress.done}/{progress.counted}
                </strong>{' '}
                tasks done
              </p>
            </section>
          )}

          {!hasTasks && !plan.canGenerate && (
            <StateBlock tone="empty" title="Nothing was planned for this week" detail="Plans can be built for this week and the weeks ahead." action={{ label: 'Go to this week', onClick: () => goTo(null) }} />
          )}

          {(hasTasks || plan.generated) && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
              {plan.days.map((d) => (
                <DayCard key={d.date} day={d} today={plan.today} />
              ))}
            </div>
          )}

          <WhyThisPlan plan={plan} />
          {hasTasks && <PlanExplainer key={plan.weekStart} week={plan.weekStart} />}
        </>
      )}
    </div>
  );
}
