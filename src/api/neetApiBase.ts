/**
 * Base URL of procounsel-neet-api (FastAPI) — the one Python backend for NEET v1
 * counselling, MHT-CET and MBA. It comes only from VITE_NEET_COUNSELLING_API_URL
 * (.env locally, a GitHub secret in the deploy workflow); there is deliberately no
 * hard-coded fallback, so every environment points at exactly one deployment.
 */
export const NEET_API_URL: string = (
  (import.meta.env.VITE_NEET_COUNSELLING_API_URL as string | undefined) ?? ""
)
  .trim()
  .replace(/\/+$/, "");

if (!NEET_API_URL) {
  console.error(
    "[ProCounsel] VITE_NEET_COUNSELLING_API_URL is not set; NEET, MHT-CET and MBA requests will fail.",
  );
}
