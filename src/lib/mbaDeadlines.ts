import type { DeadlineRow } from "@/lib/mbaRoutes.mjs";

/**
 * Helpers for the MBA admission deadline tracker (/mba-admission-deadlines).
 * The rows themselves come from deadlineRows() in src/lib/mbaRoutes.mjs, which
 * keeps only dated events with an official source; here they are filtered,
 * sorted, labelled and turned into an iCalendar file.
 */

export type { DeadlineRow };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "25 Nov 2026", or "Sep 2026" when the source gives only the month. */
export function deadlineLabel(row: Pick<DeadlineRow, "date" | "precision">): string {
  const [y, m, d] = row.date.split("-").map(Number);
  return row.precision === "day" ? `${d} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`;
}

/** Rows that apply to an exam ("all" keeps everything). */
export function filterByExam(rows: DeadlineRow[], exam: string): DeadlineRow[] {
  return exam === "all" ? rows : rows.filter((r) => r.exams.includes(exam));
}

export function sortByDate(rows: DeadlineRow[], direction: "asc" | "desc" = "asc"): DeadlineRow[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => sign * a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** Has the day (or the whole month) passed, as of `today` (YYYY-MM-DD)? */
export function isPast(row: Pick<DeadlineRow, "date" | "precision">, today: string): boolean {
  return row.precision === "day" ? row.date < today : row.date < today.slice(0, 7);
}

/** RFC 5545 TEXT escaping. */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold content lines at 75 characters (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

const compact = (iso: string) => iso.replace(/-/g, "");

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * An .ics calendar with one all-day event per row. Only exact days can be put
 * in a calendar; month-only rows are skipped. `stamp` is the DTSTAMP
 * (YYYYMMDDTHHMMSSZ) so the output is deterministic in tests.
 */
export function buildIcs(rows: DeadlineRow[], stamp: string): string {
  const events = rows
    .filter((r) => r.precision === "day")
    .flatMap((r) => [
      "BEGIN:VEVENT",
      `UID:${r.id}@procounsel.co.in`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(r.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(r.date))}`,
      `SUMMARY:${icsText(`${r.name}: ${r.event}${r.tentative ? " (tentative)" : ""}`)}`,
      `DESCRIPTION:${icsText(
        `${r.tentative ? "Tentative date. " : ""}Check the official source before acting: ${r.source.title} ${r.source.url}`,
      )}`,
      `URL:${r.source.url}`,
      "END:VEVENT",
    ]);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProCounsel//MBA admission deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

/** DTSTAMP for "now". */
export const icsStamp = (now: Date = new Date()): string => now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
