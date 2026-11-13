/**
 * One typed entry point for product analytics: `trackEvent(name, params)`.
 *
 * - Always pushes `{ event: name, ...params }` to `window.dataLayer`, the shape the
 *   existing custom events use (quick_lead_submitted, predictor_share_whatsapp), so
 *   GTM / the Google Ads tag in index.html can pick it up with no code change.
 * - When `VITE_GA4_MEASUREMENT_ID` is set (optional) the GA4 property is configured
 *   once on the existing gtag.js loader and every event is also sent to it with
 *   `gtag("event", …, { send_to })` — GA4 recommended names where they fit.
 * - A no-op during SSR and the build-time prerender (headless Chrome), and it never
 *   throws: analytics must never break a page.
 *
 * Params are counts, ids and buckets only — never names, phone numbers, emails or
 * free text a student typed.
 */

type Param = string | number | boolean | undefined;
export type EventParams = Record<string, Param>;

/** Every event the app sends, with its params. Add new ones here so names stay consistent. */
export interface AnalyticsEvents {
  generate_lead: { form_id: string; page_path: string; course?: string; exam?: string; lead_source?: string };
  share: { method: "whatsapp" | "copy_link"; content_type: string; item_id: string };
  cat_score_calculated: { score_bucket: string };
  mba_college_predictor_used: { tool: string; percentile_bucket?: string; results?: number };
  free_mock_cta_click: { location: string; cta: string; logged_in: boolean };
  sign_up: { method: string; role: string };
  login: { method: string; role: string };
  mba_onboarding_complete: { current_level: string; weekly_hours: number };
  mba_first_practice_answer: { section?: string };
  mba_mock_started: { test_kind: string; sections: string };
  mba_mock_submitted: { test_kind: string; sections: string; score_bucket: string };
  mba_daily_challenge_done: { questions: number };
  mba_planner_task_completed: { task_type: string };
  mba_shortlist_add: { location: string };
  mba_counsellor_request: { topic: string };
  mba_gdpi_session_done: { kind: string };
  mba_ai_hint_used: { level: string };
  mba_ai_coach_message: { coach: string };
  mba_ai_plan_explained: { week: string };
  mba_syllabus_completed: { section: string };
}

/**
 * Google Ads conversion for an MBA lead ("AW-…/label"). The only label in the codebase is the
 * study-abroad one (StudyAbroadLeadForm); MBA needs its own conversion action.
 * TODO(co-founder): create an "MBA lead" conversion action in Google Ads and paste its send_to here.
 */
export const MBA_LEAD_ADS_CONVERSION_SEND_TO: string | null = null;

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __pcGa4Configured?: boolean;
};

const GA4_ID = ((import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined) ?? "").trim();

function analyticsWindow(): GtagWindow | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;
  // react-snap / Puppeteer prerender: never record build-time "visits".
  if (navigator.webdriver || /HeadlessChrome|ReactSnap|Prerender/i.test(navigator.userAgent)) return null;
  return window as GtagWindow;
}

/** Configure the GA4 property on the gtag.js loader (once). Safe to call repeatedly. */
export function initAnalytics(): void {
  try {
    const w = analyticsWindow();
    if (!w || !GA4_ID || w.__pcGa4Configured || typeof w.gtag !== "function") return;
    w.gtag("config", GA4_ID);
    w.__pcGa4Configured = true;
  } catch {
    // analytics must never break the page
  }
}

function clean(params: EventParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out[key] = value;
  return out;
}

export function trackEvent<K extends keyof AnalyticsEvents>(name: K, params: AnalyticsEvents[K]): void {
  try {
    const w = analyticsWindow();
    if (!w) return;
    const payload = clean(params as EventParams);
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: name, ...payload });
    if (GA4_ID && typeof w.gtag === "function") {
      initAnalytics();
      w.gtag("event", name, { ...payload, send_to: GA4_ID });
    }
  } catch {
    // analytics must never break the page
  }
}

/** Google Ads conversion (only after the backend accepted the lead). No-op until the label is set. */
export function trackAdsConversion(sendTo: string | null): void {
  try {
    const w = analyticsWindow();
    if (!w || !sendTo || typeof w.gtag !== "function") return;
    w.gtag("event", "conversion", { send_to: sendTo, value: 1.0, currency: "INR" });
  } catch {
    // analytics must never break the page
  }
}

/** Fire `name` at most once per key on this device (e.g. a student's first practice answer). */
export function trackOnce<K extends keyof AnalyticsEvents>(key: string, name: K, params: AnalyticsEvents[K]): void {
  try {
    const storageKey = `pc_once_${name}_${key}`;
    if (typeof localStorage === "undefined" || localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
  } catch {
    return;
  }
  trackEvent(name, params);
}

/** Coarse bucket for a score/percentage so no exact result is sent: "<0", "0-9", "10-19", … */
export function bucket(value: number | null | undefined, size = 10): string {
  if (value == null || !Number.isFinite(value)) return "unknown";
  if (value < 0) return "<0";
  const low = Math.floor(value / size) * size;
  return `${low}-${low + size - 1}`;
}
