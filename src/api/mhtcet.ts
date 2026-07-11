import axios from "axios";

const PREDICTOR_BASE_URL = "https://mht-cet-predictor-beige.vercel.app";

export interface MHTCETCollegePredictionRequest {
  marks?: number;
  percentile?: number;
  rank?: number;
  category: string;
  branch?: string | null;
  top_n: number;
}

export interface MHTCETCollegeItem {
  college: string;
  branches: string[];
  best_closing_rank: number;
  best_closing_percentile: number;
  chance: string;
}

export interface MHTCETCollegePredictionResponse {
  estimated_rank: number;
  colleges: MHTCETCollegeItem[];
}

// Raw shape returned by the predictor backend (different field names).
interface RawPredictResponse {
  user_rank: number;
  category: string;
  branch_filter: string | null;
  results: MHTCETCollegeItem[];
}

// The backend filters on its own branch labels; map the few that differ from
// the names shown in the UI. "Other" means "no branch filter".
const BRANCH_MAP: Record<string, string> = {
  "Electronics and Telecommunication": "Electronics and Telecommunication Engg",
};

function toApiBranch(branch: string): string | undefined {
  if (!branch || branch === "All" || branch === "Other") return undefined;
  return BRANCH_MAP[branch] ?? branch;
}

const TRANSIENT_STATUSES = [429, 500, 502, 503, 504];
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A 503/502/504 from Cloud Run (cold start / overload) comes back with NO CORS
// header, so the browser surfaces it as a network error with no `response`.
// Treat both "no response" and transient status codes as retryable.
function isTransient(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true; // network / CORS-blocked / timeout
  return TRANSIENT_STATUSES.includes(error.response.status);
}

function toFriendlyError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return new Error(
          detail
            .map((err: { msg?: string }) => err.msg || "Validation error")
            .join(", ")
        );
      }
    }
    if (error.code === "ECONNABORTED") {
      return new Error("The request timed out. Please try again.");
    }
    if (error.response?.status === 429) {
      return new Error(
        "Too many requests right now. Please wait a moment and try again."
      );
    }
    // No response (network/CORS) or 5xx => server is busy/unreachable.
    if (!error.response || error.response.status >= 500) {
      return new Error(
        "Our prediction server is busy right now. Please try again in a few seconds."
      );
    }
    return new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to predict colleges"
    );
  }
  return new Error("Failed to predict colleges");
}

// Pick the right endpoint + key query param for the supplied input mode.
function resolveRequest(data: MHTCETCollegePredictionRequest): {
  endpoint: string;
  params: Record<string, string | number>;
} {
  const params: Record<string, string | number> = {
    category: data.category.toUpperCase(),
    top_n: data.top_n,
  };
  const branch = data.branch ? toApiBranch(data.branch) : undefined;
  if (branch) params.branch = branch;

  if (data.rank != null) {
    return { endpoint: `${PREDICTOR_BASE_URL}/predict`, params: { ...params, rank: data.rank } };
  }
  if (data.percentile != null) {
    return {
      endpoint: `${PREDICTOR_BASE_URL}/predict/by-percentile`,
      params: { ...params, percentile: data.percentile },
    };
  }
  return {
    endpoint: `${PREDICTOR_BASE_URL}/predict/by-marks`,
    params: { ...params, marks: data.marks ?? 0 },
  };
}

export async function predictMHTCETColleges(
  data: MHTCETCollegePredictionRequest
): Promise<MHTCETCollegePredictionResponse> {
  const { endpoint, params } = resolveRequest(data);
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get<RawPredictResponse>(endpoint, {
        params,
        timeout: 30000,
      });
      return {
        estimated_rank: response.data.user_rank,
        colleges: response.data.results ?? [],
      };
    } catch (error) {
      lastError = error;
      // Don't retry validation/client errors, and stop after the last attempt.
      if (!isTransient(error) || attempt === MAX_RETRIES) break;
      // Exponential backoff: ~700ms, then ~1400ms, with a little jitter.
      await sleep(700 * Math.pow(2, attempt) + Math.floor(Math.random() * 300));
    }
  }

  throw toFriendlyError(lastError);
}
