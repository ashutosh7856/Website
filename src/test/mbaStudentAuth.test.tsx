import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RevampLayout from "@/layouts/RevampLayout";
import MbaStudentLayout from "@/layouts/MbaStudentLayout";
import { useAuthStore, isMbaStudentRole } from "@/store/AuthStore";
import type { User } from "@/types/user";

/**
 * The MBA role — "mbaStudent" — from the OTP response to the shell it lands in.
 *
 * MBA students are ordinary users underneath (they have a /api/user/:id
 * profile), so the risk is in the shared code: the generic user path must keep
 * the new role instead of collapsing it to "student"/"user", and every other
 * role must come out exactly as before. Only `fetch` is faked.
 */

const json = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

let verifyResponse: Record<string, unknown>;
let isUserDetailsNull: boolean;
let calls: string[];

const USER_PROFILE = {
  userName: "9876543210",
  firstName: "Meera",
  lastName: "Rao",
  email: "meera@example.com",
  role: "user",
  interestedCourse: "mba",
};

const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  calls.push(url);
  if (url.includes("/api/auth/verifyAndUserSignup")) return json(verifyResponse);
  if (url.includes("/api/auth/isUserDetailsNull")) return json(isUserDetailsNull);
  if (url.includes("/api/counsellor/getCounsellorById")) return json({ message: "not found" }, 404);
  // A fresh copy each call: the store mutates the profile it receives.
  if (url.includes("/api/user/")) return json({ ...USER_PROFILE });
  return json({});
});

const MBA_LOGIN = {
  role: "mbaStudent",
  isUser: true,
  interestedCourse: "mba",
  userId: "9876543210",
  jwtToken: "mba-jwt",
};

const resetStore = () =>
  useAuthStore.setState({
    user: null,
    userId: null,
    role: null,
    isAuthenticated: false,
    isLoginToggle: false,
    userExist: false,
    loading: false,
    needsOnboarding: false,
    needsProfileCompletion: false,
    isProfileCompletionOpen: false,
    skipOnboardingForPromo: false,
    isCounselorSignupFlow: false,
    returnToPath: null,
    onLoginSuccess: null,
    pendingAction: null,
    tempJwt: null,
    tempPhone: null,
    schoolStudent: null,
  });

beforeEach(() => {
  calls = [];
  isUserDetailsNull = false;
  verifyResponse = {};
  localStorage.removeItem("pc_lead_captured");
  vi.stubGlobal("fetch", fakeFetch);
  resetStore();
});

afterEach(() => resetStore());

describe("isMbaStudentRole", () => {
  it("matches the backend spelling, any case, trimmed", () => {
    expect(isMbaStudentRole("mbaStudent")).toBe(true);
    expect(isMbaStudentRole(" MBASTUDENT ")).toBe(true);
    expect(isMbaStudentRole("student")).toBe(false);
    expect(isMbaStudentRole("schoolStudent")).toBe(false);
    expect(isMbaStudentRole(undefined)).toBe(false);
  });
});

describe("MBA student login", () => {
  it("keeps the mbaStudent role and still loads the normal user profile", async () => {
    verifyResponse = MBA_LOGIN;

    await useAuthStore.getState().verifyOtp("9876543210", "1234");

    const state = useAuthStore.getState();
    expect(state.role).toBe("mbaStudent");
    expect(state.user?.role).toBe("mbaStudent");
    expect(state.user?.firstName).toBe("Meera");
    expect(state.isAuthenticated).toBe(true);
    expect(state.needsOnboarding).toBe(false);
    expect(localStorage.getItem("role")).toBe("mbaStudent");
    expect(localStorage.getItem("jwt")).toBe("mba-jwt");
    expect(calls.some((u) => u.includes("/api/user/9876543210"))).toBe(true);
    expect(calls.some((u) => u.includes("getCounsellorById"))).toBe(false);
  });

  it("tolerates a padded / differently-cased role string", async () => {
    verifyResponse = { ...MBA_LOGIN, role: " MbaStudent " };
    await useAuthStore.getState().verifyOtp("9876543210", "1234");
    expect(useAuthStore.getState().role).toBe("mbaStudent");
  });

  it("is never left in the site onboarding limbo (JWT goes to storage)", async () => {
    verifyResponse = MBA_LOGIN;
    isUserDetailsNull = true;

    await useAuthStore.getState().verifyOtp("9876543210", "1234");

    const state = useAuthStore.getState();
    expect(state.needsOnboarding).toBe(false);
    expect(state.tempJwt).toBeNull();
    expect(localStorage.getItem("jwt")).toBe("mba-jwt");
  });

  it("keeps the role across a forced refresh", async () => {
    verifyResponse = MBA_LOGIN;
    await useAuthStore.getState().verifyOtp("9876543210", "1234");
    calls = [];

    const refreshed = await useAuthStore.getState().refreshUser(true);

    expect(refreshed?.role).toBe("mbaStudent");
    expect(useAuthStore.getState().role).toBe("mbaStudent");
    expect(calls.some((u) => u.includes("/api/user/"))).toBe(true);
  });

  it("setUser keeps the camel-cased role", () => {
    useAuthStore.getState().setUser({ ...USER_PROFILE, role: "mbaStudent" } as unknown as User);
    expect(useAuthStore.getState().role).toBe("mbaStudent");
  });
});

describe("other roles are unchanged", () => {
  it("a user without the mbaStudent role is still a plain user", async () => {
    verifyResponse = { isUser: true, jwtToken: "user-jwt", userId: "9876543210", interestedCourse: "mba" };

    await useAuthStore.getState().verifyOtp("9876543210", "1234");

    expect(useAuthStore.getState().role).toBe("user");
    expect(localStorage.getItem("role")).not.toBe("mbaStudent");
  });

  it("a ProBuddy is still a ProBuddy", async () => {
    verifyResponse = { role: "proBuddy", isUser: false, jwtToken: "pb-jwt", userId: "9222222222" };
    await useAuthStore.getState().verifyOtp("9222222222", "1234");
    expect(useAuthStore.getState().role).toBe("proBuddy");
  });

  it("a counsellor is still a counsellor", async () => {
    verifyResponse = { isUser: false, jwtToken: "c-jwt", userId: "9111111111" };
    await useAuthStore.getState().verifyOtp("9111111111", "1234");
    expect(useAuthStore.getState().role).toBe("counselor");
  });
});

// ── Where each role lands ─────────────────────────────────────────────────────
const signIn = (role: string) => {
  localStorage.setItem("jwt", "jwt-test");
  useAuthStore.setState({
    user: { ...USER_PROFILE, role } as unknown as User,
    userId: "9876543210",
    role: role as never,
    isAuthenticated: true,
  });
};

const renderApp = (at: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[at]}>
      <Routes>
        <Route element={<RevampLayout />}>
          <Route path="/admissions" element={<div>site content</div>} />
        </Route>
        <Route path="/" element={<div>home</div>} />
        <Route path="/school-student/dashboard" element={<div>school shell</div>} />
        <Route path="/mba/dashboard" element={<div>mba shell</div>} />
        <Route path="/mba/guarded" element={<MbaStudentLayout />} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>,
  );

describe("role routing", () => {
  it("sends an MBA student from the site to /mba/dashboard", () => {
    signIn("mbaStudent");
    renderApp("/admissions");
    expect(screen.getByText("mba shell")).toBeInTheDocument();
    expect(screen.queryByText("site content")).not.toBeInTheDocument();
  });

  it("still sends a school student to their own shell", () => {
    signIn("schoolStudent");
    renderApp("/admissions");
    expect(screen.getByText("school shell")).toBeInTheDocument();
  });

  it("leaves the site layout alone for a normal user", () => {
    signIn("user");
    renderApp("/admissions");
    expect(screen.getByText("site content")).toBeInTheDocument();
  });

  it("keeps everyone but an MBA student out of the MBA shell", () => {
    signIn("user");
    renderApp("/mba/guarded");
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("keeps a logged-out visitor out of the MBA shell", () => {
    renderApp("/mba/guarded");
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
