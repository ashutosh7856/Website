// Persists the visitor's most recent predictor search so it can be attached to
// the lead captured at login time (POST /api/leads/captureLead). Callers need to
// know which exam and what marks/rank a lead was searching for.
//
// Unlike the lead source (first-touch, see leadSource.ts), this is last-touch:
// the most recent search is the most useful thing to call the student about.

const SEARCH_KEY = "pc_predictor_search";

export interface PredictorSearch {
  exam: string; // NEET, MHT-CET, JEE — also sent as interestedExamName
  tool: string; // e.g. "Rank Predictor", "College Predictor"
  /** Human-readable detail for the caller, e.g. "640/720 marks · GN · AIQ" */
  summary: string;
}

export function persistPredictorSearch(search: PredictorSearch) {
  try {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(search));
  } catch {
    // storage unavailable (private mode) — ignore
  }
}

export function getPredictorSearch(): PredictorSearch | null {
  try {
    const raw = localStorage.getItem(SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.exam) return null;
    return parsed as PredictorSearch;
  } catch {
    return null;
  }
}

/** Compact one-liner for the lead's remarks field. */
export function formatPredictorRemark(search: PredictorSearch): string {
  return `${search.exam} ${search.tool}: ${search.summary}`;
}
