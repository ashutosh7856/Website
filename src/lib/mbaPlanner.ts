import type { PlanTask, PlanTaskType, WeekPlan } from '@/api/mbaPlanner';

/**
 * Pure helpers for the MBA study planner page: week navigation, labels, the
 * weekly summary and the .ics export. The plan itself is generated on the
 * server (procounsel-neet-api api/mba/planner.py, rules in `basis.rules`).
 */

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TASK_TYPE_LABEL: Record<PlanTaskType, string> = {
  practice: 'Practice',
  sectional_mock: 'Sectional mock',
  full_mock: 'Full mock',
  revise_mistakes: 'Revision',
  daily_challenge: 'Daily challenge',
  learn: 'Learn',
  custom: 'Your task',
};

/** Accent per task type, from the shell's palette. */
export const TASK_TYPE_TONE: Record<PlanTaskType, string> = {
  practice: 'var(--brand-purple-500)',
  sectional_mock: 'var(--gold-600)',
  full_mock: 'var(--gold-600)',
  revise_mistakes: 'var(--red-500)',
  daily_challenge: 'var(--green-600)',
  learn: '#2F43F2',
  custom: 'var(--neutral-500)',
};

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD of a local Date. */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** A YYYY-MM-DD read as a local calendar day (never shifted by the time zone). */
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export function addDays(day: string, n: number): string {
  const d = parseYmd(day);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** Monday of the week containing `day` (weeks run Monday to Sunday). */
export function weekStartOf(day: string): string {
  const d = parseYmd(day);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return ymd(d);
}

export function formatDay(day: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseYmd(day).toLocaleDateString('en-IN', opts);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Server-sent hrefs are only followed when they are in-app paths. */
export const isAppPath = (href: string | null | undefined): href is string =>
  !!href && href.startsWith('/') && !href.startsWith('//');

export function weekProgress(plan: Pick<WeekPlan, 'summary'>) {
  const { done, skipped, planned, doneMinutes, plannedMinutes } = plan.summary;
  const counted = planned - skipped;
  return {
    done,
    counted,
    percent: counted > 0 ? Math.round((done / counted) * 100) : 0,
    doneMinutes,
    plannedMinutes,
  };
}

// ── .ics export ──────────────────────────────────────────────────────────────

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** RFC 5545 line folding: lines longer than 75 characters continue with a leading space. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join('\r\n');
}

const compact = (day: string) => day.replace(/-/g, '');

/**
 * The week's tasks (skipped ones left out) as all-day calendar events.
 * `origin` makes task links absolute; `now` is the DTSTAMP.
 */
export function buildWeekIcs(plan: Pick<WeekPlan, 'days' | 'weekStart'>, origin: string, now: Date = new Date()): string {
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProCounsel//MBA Study Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`CAT study plan, week of ${plan.weekStart}`)}`,
  ];
  const tasks: PlanTask[] = plan.days.flatMap((d) => d.tasks).filter((t) => t.status !== 'skipped');
  for (const t of tasks) {
    const link = isAppPath(t.href) ? `${origin}${t.href}` : null;
    const description = [t.detail, `${formatMinutes(t.minutes)} · ${TASK_TYPE_LABEL[t.type]}`, link].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@procounsel-mba-plan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(t.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(t.date, 1))}`,
      `SUMMARY:${escapeText(`${t.title} (${formatMinutes(t.minutes)})`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      ...(link ? [`URL:${link}`] : []),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Hands the .ics to the browser as a file download. */
export function downloadIcs(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
