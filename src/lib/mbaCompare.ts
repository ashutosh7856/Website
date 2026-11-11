import { MBA_PATHS } from "@/lib/mbaRoutes.mjs";
import { absoluteUrl } from "@/lib/siteUrl.mjs";

/**
 * URL state for the MBA college comparison (/mba-colleges/compare?c=a,b,c).
 * The prerendered page (no query string) shows DEFAULT_COMPARE so crawlers and
 * first-time visitors see a real comparison; any `c` list is read after mount.
 */

export const MAX_COMPARE = 4;
export const COMPARE_PARAM = "c";
/** The example comparison on the bare URL: the three oldest IIMs. */
export const DEFAULT_COMPARE = ["iim-ahmedabad", "iim-bangalore", "iim-calcutta"];

/** "iim-ahmedabad, IIM-Bangalore,,x" → valid, de-duplicated slugs, at most MAX_COMPARE. */
export function parseCompareParam(value: string | null | undefined, valid: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const part of String(value ?? "").split(",")) {
    const slug = part.trim().toLowerCase();
    if (!slug || !valid.has(slug) || out.includes(slug)) continue;
    out.push(slug);
    if (out.length === MAX_COMPARE) break;
  }
  return out;
}

/** The selection from a URL, or the default example when it names nothing valid. */
export function selectionFromSearch(search: string, valid: ReadonlySet<string>): string[] {
  const picked = parseCompareParam(new URLSearchParams(search).get(COMPARE_PARAM), valid);
  return picked.length ? picked : DEFAULT_COMPARE.filter((s) => valid.has(s));
}

/** "?c=iim-ahmedabad,iim-bangalore" (commas kept readable); "" for an empty list. */
export function compareSearch(slugs: string[]): string {
  const list = slugs.slice(0, MAX_COMPARE);
  return list.length ? `?${COMPARE_PARAM}=${list.map(encodeURIComponent).join(",")}` : "";
}

/** In-site link to a comparison, e.g. from a profile: "/mba-colleges/compare?c=fms-delhi". */
export const comparePath = (slugs: string[]): string => `${MBA_PATHS.compare}${compareSearch(slugs)}`;

/** Absolute link to this comparison, tagged for WhatsApp share attribution. */
export function compareShareUrl(slugs: string[], source = "whatsapp"): string {
  const params = new URLSearchParams({ utm_source: source, utm_medium: "share", utm_campaign: "mba_compare" });
  const search = compareSearch(slugs);
  return `${absoluteUrl(MBA_PATHS.compare)}${search ? `${search}&` : "?"}${params.toString()}`;
}

/** Add a slug (ignored when full or present) / remove a slug. */
export function addToSelection(slugs: string[], slug: string): string[] {
  return slugs.includes(slug) || slugs.length >= MAX_COMPARE ? slugs : [...slugs, slug];
}
export const removeFromSelection = (slugs: string[], slug: string): string[] => slugs.filter((s) => s !== slug);
