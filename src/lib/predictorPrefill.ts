/**
 * Reads a number the home page hero passed in the query string
 * (`?rank=`, `?percentile=`, `?score=`) so a predictor opens with it filled in.
 *
 * Call it from an effect after mount, never during render: the prerendered
 * HTML is always the empty form, and hydration must match it.
 * Returns the value as the string to put in the input, or null when the
 * parameter is missing or out of range.
 */
export function readNumberParam(
  name: string,
  { min, max, integer = false }: { min: number; max: number; integer?: boolean },
): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(name)?.trim();
  if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  if (integer && !Number.isInteger(value)) return null;
  return raw;
}
