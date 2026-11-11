import type { CapRow } from "@/data/mbaSnapshotTypes";
import { MAH_CAP_CUTOFFS } from "@/data/mahCapCutoffs";
import { citySlugFor } from "@/lib/mbaRoutes.mjs";

/** The State CET Cell's CAP list metadata (null when the data is absent). */
export const CAP_META = MAH_CAP_CUTOFFS.meta;

/** CAP courses in a city (by MBA city slug), or every course. */
export function capRows(citySlug?: string): CapRow[] {
  const rows = MAH_CAP_CUTOFFS.rows;
  return citySlug ? rows.filter((r) => citySlugFor(r.city) === citySlug) : rows;
}

/** Distinct institutes in a city's CAP rows, highest OPEN state-level closing first. */
export function capInstitutes(citySlug: string): string[] {
  return [...new Set(capRows(citySlug).map((r) => r.institute))];
}
