import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mbaApi, type MbaDashboard as Dashboard } from "@/api/mba";
import type { MbaShellContext } from "@/lib/mbaShellContext";
import MbaDashboard from "@/pages/mba/MbaDashboard";
import { mbaInsightsApi } from "@/api/mbaInsights";

/** /mba/dashboard — Road to IIM, built only from GET /me/dashboard. */

const profile = {
  userId: "u1",
  targetExam: "cat" as const,
  targetPercentile: 99,
  examDate: "2026-11-29",
  currentLevel: "intermediate" as const,
  weeklyStudyHours: 10,
  studyDays: [1, 2],
  createdAt: "",
  updatedAt: "",
};
const context: MbaShellContext = { profile, firstName: "Asha", phone: null };

const dashboard: Dashboard = {
  profile,
  daysToExam: 18,
  sections: [
    { id: "VARC", attempted: 20, correct: 12, accuracy: 0.6 },
    { id: "DILR", attempted: 8, correct: 3, accuracy: 0.375 },
    { id: "QA", attempted: 10, correct: 7, accuracy: 0.7 },
  ],
  totals: { questionsAttempted: 38, correct: 22, bookmarked: 2, mistakesDue: 3, mocksCompleted: 1 },
  recentAttempts: [
    { id: "a1", testId: "cat-2024-s1-full", title: "CAT 2024 Slot 1 mock", status: "submitted", startedAt: "2026-11-08T10:00:00Z", submittedAt: "2026-11-08T12:00:00Z", score: 61, maxScore: 204 },
  ],
  inProgressAttempt: { id: "a2", testId: "cat-2023-s2-qa", title: "CAT 2023 QA sectional", status: "in_progress", startedAt: "2026-11-11T10:00:00Z" },
  priorities: [
    { kind: "resume_mock", title: "Resume your QA sectional", detail: "14 minutes left", href: "/mba/mocks/attempts/a2" },
    { kind: "review_mistakes", title: "Review 3 mistakes", detail: "Due today", href: "/mba/mistakes?due=true" },
    { kind: "practice_weak_section", title: "Practice DILR", detail: "Weakest section", href: "/mba/practice?section=DILR" },
  ],
  streak: { current: 4, lastActiveDate: "2026-11-11" },
};

function renderDashboard(data: Dashboard) {
  vi.spyOn(mbaApi, "getDashboard").mockResolvedValue(data);
  vi.spyOn(mbaInsightsApi, "getInsights").mockResolvedValue({ topics: [], weakTopics: [], lowEvidenceCount: 0, trend: [], rules: { minAttempts: 8, weakBelow: 0.6, strongFrom: 0.8 } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/mba/dashboard"]}>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="/mba/dashboard" element={<MbaDashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("/mba/dashboard", () => {
  it("shows the climb, the next camp's requirement and the existing dashboard data", async () => {
    renderDashboard(dashboard);

    expect(await screen.findByRole("heading", { name: "Road to IIM" })).toBeInTheDocument();
    // 38 questions + 1 test: Diagnostic reached, Ridge next.
    // Two drawings (wide and narrow; CSS shows one), one summary.
    expect(screen.getAllByRole("img", { name: /camp 3 of 7, Diagnostic, reached\. Next camp: Ridge/ })).toHaveLength(2);
    const next = screen.getByRole("heading", { name: "Ridge", level: 2 }).closest("section")!;
    expect(within(next).getByText("38/100 questions")).toBeInTheDocument();
    expect(within(next).getByRole("link", { name: "Keep practising" })).toHaveAttribute("href", "/mba/practice");

    // Countdown and streak.
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText(/days to CAT/)).toBeInTheDocument();
    expect(screen.getByText("4-day streak")).toBeInTheDocument();

    // Priorities keep their server hrefs.
    expect(screen.getByRole("link", { name: /Resume your QA sectional/ })).toHaveAttribute("href", "/mba/mocks/attempts/a2");
    expect(screen.getByRole("link", { name: /Review 3 mistakes/ })).toHaveAttribute("href", "/mba/mistakes?due=true");
    expect(screen.getByRole("link", { name: /Practice DILR/ })).toHaveAttribute("href", "/mba/practice?section=DILR");

    // Resume card, recent attempts, sections.
    expect(screen.getByRole("link", { name: /Resume your mock/ })).toHaveAttribute("href", "/mba/exam/cat-2023-s2-qa");
    expect(screen.getByRole("link", { name: /CAT 2024 Slot 1 mock/ })).toHaveAttribute("href", "/mba/results/a1");
    expect(screen.getByText("Data Interpretation & Logical Reasoning: 37 percent accuracy over 8 questions", { exact: false })).toBeInTheDocument();

    // The route as text: seven camps, three reached.
    const route = screen.getByRole("heading", { name: "The route" }).closest("section")!;
    expect(within(route).getAllByRole("listitem")).toHaveLength(7);
    expect(within(route).getAllByText("Reached")).toHaveLength(3);
  });

  it("asks for the CAT date when there is no countdown, and starts a new student at Base Camp", async () => {
    renderDashboard({
      ...dashboard,
      daysToExam: null,
      sections: dashboard.sections.map((s) => ({ ...s, attempted: 0, correct: 0, accuracy: null })),
      totals: { questionsAttempted: 0, correct: 0, bookmarked: 0, mistakesDue: 0, mocksCompleted: 0 },
      recentAttempts: [],
      inProgressAttempt: null,
      streak: { current: 0, lastActiveDate: null },
    });
    expect(await screen.findByRole("link", { name: /Add your CAT date/ })).toHaveAttribute("href", "/mba/profile");
    expect(screen.getByRole("heading", { name: "First Steps", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("0/10 questions")).toBeInTheDocument();
    expect(screen.queryByText(/Resume your mock/)).not.toBeInTheDocument();
  });
});
