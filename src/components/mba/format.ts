import DOMPurify from 'dompurify';
import type { ProcounselPercentile, SectionId } from '@/api/mba';

/**
 * Question HTML comes from our own API, but it is authored content (scraped
 * official papers, licensed material) — it is sanitised before it touches the
 * DOM, every time.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, mathMl: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe'],
    FORBID_ATTR: ['style'],
  });
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/** mm:ss (or h:mm:ss) for a countdown. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Accuracy as a 0–100 number, computed from the counts the API returns.
 * The contract's `accuracy` field does not say whether it is a ratio or a
 * percentage, so the counts — which are unambiguous — are used instead.
 */
export function accuracyOf(correct: number, attempted: number): number | null {
  if (!attempted) return null;
  return (correct / attempted) * 100;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  // A bare YYYY-MM-DD is a calendar date (India time on the server) — read it
  // as local midnight, not UTC, so it never shows as the day before.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SECTION_SHORT: Record<SectionId, string> = {
  VARC: 'VARC',
  DILR: 'DILR',
  QA: 'Quant',
};

export const SECTION_TONE: Record<SectionId, { bg: string; fg: string; bar: string }> = {
  VARC: { bg: '#EFF6FF', fg: '#1D4ED8', bar: '#3B82F6' },
  DILR: { bg: '#FFF9EB', fg: '#B45309', bar: '#F59E0B' },
  QA: { bg: '#F4FFF8', fg: '#15803D', bar: '#22C55E' },
};

/** Short labels for the other MBA exams' sections (ids from the API's exam configs). */
const EXAM_SECTION_SHORT: Record<string, string> = {
  VALR: 'VA & LR', DM: 'Decision making', QADI: 'QA & DI', GK: 'GK',
  GE: 'English', ALR: 'Reasoning', QDIDS: 'Quant, DI & DS', EMV: 'Ethics',
  LS: 'Language', QS: 'Quant', LRS: 'Reasoning',
  QTDI: 'Quant & DI', LRC: 'Reasoning', LC: 'Language', GA: 'General awareness', IE: 'Innovation',
  LCM: 'Language', ICR: 'Reasoning', MS: 'Maths', DAS: 'Data analysis', EBE: 'Economy',
  QR: 'Quant', VR: 'Verbal', DI: 'Data insights',
  LOGR: 'Logical reasoning', ABR: 'Abstract reasoning', QAPT: 'Quant', VERB: 'Verbal',
};

/** Short label for any exam's section id (CAT ids keep their usual labels). */
export function sectionShort(id: string): string {
  return (SECTION_SHORT as Record<string, string>)[id] ?? EXAM_SECTION_SHORT[id] ?? id;
}

const EXTRA_TONES = [
  { bg: '#F5F3FF', fg: '#6D28D9', bar: '#8B5CF6' },
  { bg: '#FDF2F8', fg: '#BE185D', bar: '#EC4899' },
  { bg: '#ECFEFF', fg: '#0E7490', bar: '#06B6D4' },
  { bg: '#FFF7ED', fg: '#C2410C', bar: '#F97316' },
  { bg: '#F0FDF4', fg: '#15803D', bar: '#22C55E' },
  { bg: '#EFF6FF', fg: '#1D4ED8', bar: '#3B82F6' },
];

/** Colour for any exam's section id; CAT ids keep their fixed tones. */
export function sectionTone(id: string): { bg: string; fg: string; bar: string } {
  const fixed = (SECTION_TONE as Record<string, { bg: string; fg: string; bar: string } | undefined>)[id];
  if (fixed) return fixed;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EXTRA_TONES[h % EXTRA_TONES.length];
}

/** "Better than N% of ProCounsel students" — or, until enough students have taken it, how many have. */
export function percentileLine(p: ProcounselPercentile): string {
  if (p.percentile === null) {
    return p.students === 0
      ? `No other ProCounsel student has taken this test yet. We show where you stand once ${p.minStudents} have.`
      : `${p.students} other ProCounsel student${p.students === 1 ? ' has' : 's have'} taken this test. We show where you stand once ${p.minStudents} have.`;
  }
  return `Your score of ${p.score} is ahead of about ${Math.round(p.percentile)}% of ${p.students} ProCounsel students' first attempts.`;
}
