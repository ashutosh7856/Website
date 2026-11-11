/**
 * In-memory JWT cache.
 *
 * Why: Safari's ITP can silently clear localStorage; also, during the
 * onboarding flow the JWT lives in Zustand's `tempJwt` (never in
 * localStorage) so every direct `localStorage.getItem('jwt')` call
 * returns null even though the user IS logged in.
 *
 * This module keeps one authoritative copy of the token in memory for the
 * page session and syncs it to/from localStorage on login / page load.
 */

let _token: string | null = null;

/** Read the auth token. Checks in-memory first, then localStorage. */
export function getToken(): string | null {
  if (_token) return _token;
  try {
    const stored = localStorage.getItem('jwt');
    if (stored) {
      _token = stored;
      return stored;
    }
  } catch {
    // localStorage may be unavailable (Safari private mode quota, ITP, etc.)
  }
  return null;
}

/** Read the stored phone/userId. */
export function getStoredPhone(): string | null {
  try {
    return localStorage.getItem('phone');
  } catch {
    return null;
  }
}

/**
 * Persist a token to both in-memory cache and localStorage.
 * Call this on successful login (existing user path).
 */
export function setToken(token: string, phone?: string): void {
  _token = token;
  try {
    localStorage.setItem('jwt', token);
    if (phone) localStorage.setItem('phone', phone);
  } catch {
    // Storage may be unavailable (private mode / blocked); in-memory token still applies.
  }
}

/**
 * Cache a token in memory ONLY — do NOT write to localStorage.
 * Used during onboarding: we hold the JWT in memory until the user
 * finishes onboarding, then `setToken()` (called by completeOnboarding)
 * writes it to localStorage.
 */
export function cacheTokenInMemory(token: string): void {
  _token = token;
}

/**
 * Clear the token from both in-memory cache and localStorage.
 * Call this on logout.
 */
export function clearToken(): void {
  _token = null;
  try {
    localStorage.removeItem('jwt');
    localStorage.removeItem('phone');
    localStorage.removeItem('role');
  } catch {
    // Storage may be unavailable (private mode / blocked); in-memory token still applies.
  }
}
