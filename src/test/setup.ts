import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Every test starts from a cold browser: empty localStorage, no in-memory
 * token, no Razorpay, no cached API answers.
 *
 * Anything held in module state MUST be reset between tests or one test
 * silently decides the next one's result. Two live here: the JWT cache in
 * tokenManager, and the request cache in schoolStudentApi — the latter dedupes
 * and caches by path, so without this a stubbed response from one test is
 * served to the test after it.
 */
beforeEach(async () => {
  localStorage.clear();
  const { clearToken } = await import("@/lib/tokenManager");
  clearToken();
  const { invalidateSchoolCache } = await import("@/api/schoolStudentApi");
  invalidateSchoolCache();
  delete (window as unknown as { Razorpay?: unknown }).Razorpay;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The app's API modules read import.meta.env at module load.
vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
vi.stubEnv("VITE_NEET_COUNSELLING_API_URL", "https://neet-api.test");
