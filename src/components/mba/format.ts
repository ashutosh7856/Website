import DOMPurify from 'dompurify';
import type { SectionId } from '@/api/mba';

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
