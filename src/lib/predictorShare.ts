import { absoluteUrl } from "@/lib/siteUrl.mjs";

/**
 * Builders for the "Share on WhatsApp" action on predictor results.
 *
 * The shared text is a short summary of the result on screen plus the page's
 * canonical URL tagged with UTM params, so a friend who opens it is attributed
 * to WhatsApp (App.tsx -> persistVisitSource maps utm_source=whatsapp to the
 * WHATSAPP lead source). Callers pass only result figures — never the
 * student's name or phone.
 */

export const SHARE_TEXT_MAX = 300;

/** Canonical page URL with share UTM tags. */
export function buildShareUrl(path: string, campaign: string, source = "whatsapp"): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: "share",
    utm_campaign: campaign,
  });
  return `${absoluteUrl(path)}?${params.toString()}`;
}

/** The message body: summary (trimmed so the whole message stays under SHARE_TEXT_MAX) + URL. */
export function buildShareText(summary: string, url: string): string {
  const budget = Math.max(0, SHARE_TEXT_MAX - url.length - 1);
  let text = summary.replace(/\s+/g, " ").trim();
  if (text.length > budget) text = `${text.slice(0, Math.max(0, budget - 1)).trimEnd()}…`;
  return text ? `${text} ${url}` : url;
}

export function buildWhatsAppHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** en-IN grouping for ranks/counts in share text, e.g. 12345 -> "12,345". */
export function formatShareNumber(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}
