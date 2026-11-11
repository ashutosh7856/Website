import type { EligibilityInput, MbaCategory, MbaGender } from "@/api/mba";

/**
 * The eligibility form's raw state and its conversion to the POST /eligibility
 * body. Percentiles are kept as the strings typed so a half-typed "99." is not
 * rewritten under the cursor.
 *
 * The last submitted input is remembered on this device. The public tool and
 * the student app's Colleges page share it, so a student who checked on the
 * public page sees the same numbers in the app ("your latest percentiles").
 */

export interface EligibilityDraft {
  category: MbaCategory;
  pwd: boolean;
  gender: MbaGender | "";
  overall: string;
  varc: string;
  dilr: string;
  qa: string;
}

export type EligibilityErrors = Partial<Record<"overall" | "varc" | "dilr" | "qa", string>>;

export const EMPTY_DRAFT: EligibilityDraft = {
  category: "General",
  pwd: false,
  gender: "",
  overall: "",
  varc: "",
  dilr: "",
  qa: "",
};

const STORAGE_KEY = "pc:mbaEligibilityInput";

/** Keeps digits and one decimal point. */
export const cleanPercentile = (raw: string) =>
  raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 8);

function parsePercentile(raw: string, required: boolean, label: string): { value?: number; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return required ? { error: `Enter your ${label} percentile.` } : {};
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 100) return { error: `${label} must be between 0 and 100.` };
  return { value };
}

export function validateDraft(draft: EligibilityDraft): { input?: EligibilityInput; errors: EligibilityErrors } {
  const errors: EligibilityErrors = {};
  const overall = parsePercentile(draft.overall, true, "Overall");
  const varc = parsePercentile(draft.varc, false, "VARC");
  const dilr = parsePercentile(draft.dilr, false, "DILR");
  const qa = parsePercentile(draft.qa, false, "QA");
  if (overall.error) errors.overall = overall.error;
  if (varc.error) errors.varc = varc.error;
  if (dilr.error) errors.dilr = dilr.error;
  if (qa.error) errors.qa = qa.error;
  if (Object.keys(errors).length || overall.value === undefined) return { errors };
  const input: EligibilityInput = { category: draft.category, pwd: draft.pwd, overall: overall.value };
  if (draft.gender) input.gender = draft.gender;
  if (varc.value !== undefined) input.varc = varc.value;
  if (dilr.value !== undefined) input.dilr = dilr.value;
  if (qa.value !== undefined) input.qa = qa.value;
  return { input, errors };
}

export function draftFromInput(input: EligibilityInput): EligibilityDraft {
  const str = (v: number | undefined | null) => (v === undefined || v === null ? "" : String(v));
  return {
    category: input.category,
    pwd: input.pwd ?? false,
    gender: input.gender ?? "",
    overall: str(input.overall),
    varc: str(input.varc),
    dilr: str(input.dilr),
    qa: str(input.qa),
  };
}

export function saveLastEligibilityInput(input: EligibilityInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    /* storage unavailable */
  }
}

const CATEGORY_SET = new Set<string>(["General", "EWS", "NC-OBC", "SC", "ST"]);

export function loadLastEligibilityInput(): EligibilityInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EligibilityInput;
    if (!parsed || !CATEGORY_SET.has(parsed.category) || typeof parsed.overall !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}
