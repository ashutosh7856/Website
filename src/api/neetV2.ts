import axios from "axios";

/**
 * NEET 2026 predictor API (v2).
 *
 * Backend: https://neet-rank-predictor-two.vercel.app
 * The API now sends `Access-Control-Allow-Origin: *`, so we can call it directly
 * from the browser in production. In dev we still route through the Vite proxy
 * (`/neet-api`, see vite.config.ts) so requests stay same-origin.
 *
 * This is the richer successor to `src/api/neet.ts` and additionally exposes:
 *   - GET /api/admission-probability  (verdict + safe-college breakdown)
 *   - GET /api/round-cutoffs          (round-wise closing ranks — cutoff analyzer)
 *   - GET /api/colleges               (college name search / autocomplete)
 *   - GET /api/options                (dropdown values derived from the dataset)
 */

const NEET_BASE_URL = import.meta.env.DEV
  ? "/neet-api"
  : "https://neet-rank-predictor-two.vercel.app";

const client = axios.create({ baseURL: NEET_BASE_URL, timeout: 30000 });

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface NEETRankResponse {
  marks: number;
  year: number;
  predicted_rank: number;
  rank_range: string;
  rank_min: number;
  rank_max: number;
}

export interface NEETCollegeRow {
  college: string;
  state: string;
  type: string;
  quota: string;
  category: string;
  year: number;
  closing_rank: number;
  seats: number;
  closing_score: number;
  diff: number;
  probability: number;
  chance: string;
  url: string;
}

export interface NEETCollegePredictionResponse {
  rank: number;
  category: string;
  quota: string;
  state: string;
  count: number;
  colleges: NEETCollegeRow[];
}

export interface NEETProbabilityBreakdown {
  "Very High": number;
  High: number;
  Moderate: number;
  Low: number;
  "Very Low": number;
}

export interface NEETAdmissionProbabilityResponse {
  rank: number;
  category: string;
  quota: string;
  state: string;
  admission_probability: number;
  verdict: string;
  colleges_matched: number;
  colleges_in_reach: number;
  safe_colleges: number;
  breakdown: NEETProbabilityBreakdown;
  top_colleges: NEETCollegeRow[];
}

export interface NEETCutoffRow {
  college: string;
  state: string;
  type: string;
  quota: string;
  category: string;
  year: number;
  round: number;
  closing_rank: number;
  closing_score: number;
  seats: number;
  state_rank: number | null;
  category_rank: number | null;
  url: string;
}

export interface NEETRoundCutoffsResponse {
  college: string | null;
  state: string;
  type: string | null;
  quota: string | null;
  category: string | null;
  year: number | null;
  round: number | null;
  count: number;
  cutoffs: NEETCutoffRow[];
}

export interface NEETCollegeSuggestion {
  college: string;
  state: string;
  type: string;
}

export interface NEETCollegeSearchResponse {
  q: string;
  state: string;
  count: number;
  colleges: NEETCollegeSuggestion[];
}

export interface NEETOptions {
  categories: string[];
  quotas: string[];
  states: string[];
  types: string[];
  years: number[];
  rounds: number[];
}

/* ------------------------------------------------------------------ */
/*  Endpoints                                                          */
/* ------------------------------------------------------------------ */

export async function predictNEETRank(params: {
  marks: number;
  year?: number;
}): Promise<NEETRankResponse> {
  try {
    const { data } = await client.get<NEETRankResponse>("/api/predict-rank", {
      params: { marks: params.marks, year: params.year ?? 2025 },
    });
    return data;
  } catch (error) {
    throw normalizeError(error, "Failed to predict rank");
  }
}

export async function predictNEETColleges(params: {
  rank: number;
  category?: string;
  quota?: string;
  state?: string;
  limit?: number;
}): Promise<NEETCollegePredictionResponse> {
  try {
    const { data } = await client.get<NEETCollegePredictionResponse>(
      "/api/predict-colleges",
      {
        params: {
          rank: params.rank,
          category: params.category ?? "GN",
          quota: params.quota ?? "AIQ",
          state: params.state ?? "All",
          limit: params.limit ?? 200,
        },
      },
    );
    return data;
  } catch (error) {
    throw normalizeError(error, "Failed to predict colleges");
  }
}

export async function getAdmissionProbability(params: {
  rank: number;
  category?: string;
  quota?: string;
  state?: string;
  top?: number;
}): Promise<NEETAdmissionProbabilityResponse> {
  try {
    const { data } = await client.get<NEETAdmissionProbabilityResponse>(
      "/api/admission-probability",
      {
        params: {
          rank: params.rank,
          category: params.category ?? "GN",
          quota: params.quota ?? "AIQ",
          state: params.state ?? "All",
          top: params.top ?? 20,
        },
      },
    );
    return data;
  } catch (error) {
    throw normalizeError(error, "Failed to compute admission probability");
  }
}

export async function getRoundCutoffs(params: {
  college?: string;
  state?: string;
  type?: string;
  quota?: string;
  category?: string;
  year?: number;
  round?: number;
  limit?: number;
}): Promise<NEETRoundCutoffsResponse> {
  try {
    // Only send params the user actually chose; the API treats missing = "any".
    const query: Record<string, string | number> = {
      state: params.state ?? "All",
      limit: params.limit ?? 1000,
    };
    if (params.college?.trim()) query.college = params.college.trim();
    if (params.type && params.type !== "All") query.type = params.type;
    if (params.quota && params.quota !== "All") query.quota = params.quota;
    if (params.category && params.category !== "All") query.category = params.category;
    if (params.year) query.year = params.year;
    if (params.round) query.round = params.round;

    const { data } = await client.get<NEETRoundCutoffsResponse>(
      "/api/round-cutoffs",
      { params: query },
    );
    return data;
  } catch (error) {
    throw normalizeError(error, "Failed to load cutoffs");
  }
}

export async function searchNEETColleges(params: {
  q: string;
  state?: string;
  limit?: number;
}): Promise<NEETCollegeSuggestion[]> {
  try {
    const { data } = await client.get<NEETCollegeSearchResponse>("/api/colleges", {
      params: {
        q: params.q,
        state: params.state ?? "All",
        limit: params.limit ?? 20,
      },
    });
    return data.colleges ?? [];
  } catch {
    // Autocomplete is best-effort; never surface an error toast for it.
    return [];
  }
}

let optionsCache: NEETOptions | null = null;

export async function getNEETOptions(): Promise<NEETOptions> {
  if (optionsCache) return optionsCache;
  try {
    const { data } = await client.get<NEETOptions>("/api/options");
    optionsCache = {
      categories: data.categories ?? [],
      quotas: data.quotas ?? [],
      states: data.states ?? [],
      types: data.types ?? [],
      years: (data.years ?? []).slice().sort((a, b) => b - a),
      rounds: (data.rounds ?? []).slice().sort((a, b) => a - b),
    };
    return optionsCache;
  } catch {
    return NEET_FALLBACK_OPTIONS;
  }
}

/* ------------------------------------------------------------------ */
/*  Curated, human-friendly labels (the API returns 1000+ raw codes;   */
/*  these cover the categories/quotas the vast majority of aspirants    */
/*  actually select). Full lists still come from getNEETOptions().      */
/* ------------------------------------------------------------------ */

export const NEET_COMMON_CATEGORIES: { value: string; label: string }[] = [
  { value: "GN", label: "General" },
  { value: "EWS", label: "EWS" },
  { value: "OBC", label: "OBC" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "GN-PH", label: "General (PwD)" },
  { value: "EWS-PH", label: "EWS (PwD)" },
  { value: "OBC-PH", label: "OBC (PwD)" },
  { value: "SC-PH", label: "SC (PwD)" },
  { value: "ST-PH", label: "ST (PwD)" },
];

export const NEET_QUOTA_LABELS: Record<string, string> = {
  AIQ: "All India Quota",
  SQ: "State Quota",
  MQ: "Management Quota",
  MNQ: "Management / NRI Quota",
  NRI: "NRI Quota",
  AMQ: "AMU Quota",
  AMU: "AMU Internal",
  OPMQ: "Open Management Quota",
  OPQ: "Open Quota",
};

export const NEET_FALLBACK_OPTIONS: NEETOptions = {
  categories: NEET_COMMON_CATEGORIES.map((c) => c.value),
  quotas: ["AIQ", "SQ", "MQ", "MNQ", "NRI", "AMQ", "AMU", "OPMQ", "OPQ"],
  states: [
    "All", "Andaman", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra Nagar", "Delhi", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "JammuKashmir", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  ],
  types: [
    "Govt-AIIMS", "Govt-Aided", "Govt-Central", "Govt-DNB", "Govt-Deemed",
    "Govt-ESI", "Govt-State", "Private", "Private-Deemed", "Private-Deemed-Minority",
    "Private-Minority", "Private-University",
  ],
  years: [2025, 2024, 2023, 2022],
  rounds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

export function quotaLabel(value: string): string {
  return NEET_QUOTA_LABELS[value] ?? value;
}

/* ------------------------------------------------------------------ */
/*  Offline rank estimate (for the blurred, pre-login preview so real   */
/*  cutoff data stays behind the login gate on the predictor pages).    */
/* ------------------------------------------------------------------ */

export function estimateNEETRank(marks: number): number {
  const clamped = Math.max(0, Math.min(720, marks));
  const points: [number, number][] = [
    [720, 1], [700, 25], [680, 200], [650, 1500], [600, 12000], [550, 40000],
    [500, 90000], [450, 170000], [400, 300000], [300, 700000], [200, 1100000],
    [0, 2000000],
  ];
  for (let i = 0; i < points.length - 1; i++) {
    const [m1, r1] = points[i];
    const [m2, r2] = points[i + 1];
    if (clamped <= m1 && clamped >= m2) {
      const t = (m1 - clamped) / (m1 - m2 || 1);
      return Math.max(1, Math.round(r1 + (r2 - r1) * t));
    }
  }
  return 1000000;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return new Error(detail.map((e: any) => e.msg || "Validation error").join(", "));
      }
    }
    return new Error(error.response?.data?.detail || error.message || fallback);
  }
  return new Error(fallback);
}
