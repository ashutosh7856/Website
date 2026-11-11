import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { mbaApi, type InstituteSummary, type ShortlistItem } from "@/api/mba";
import type { MbaShellContext } from "@/lib/mbaShellContext";
import MbaColleges from "@/pages/mba/MbaColleges";
import MbaShortlist from "@/pages/mba/MbaShortlist";

/** The student app's Colleges list (GET /programs) and shortlist tracker (/me/shortlist). */

const freshness = { retrievedAt: "2026-11-11", cutoffPolicyBatches: ["2026-28"], note: "Official data." };
const institute: InstituteSummary = {
  slug: "iim-test",
  name: "Indian Institute of Management Test",
  shortName: "IIM Test",
  city: "Testpur",
  state: "Teststate",
  website: null,
  programs: [
    { code: "MBA", name: "MBA", durationYears: 2, feeTotal: 2000000, intake: 300, medianSalary: 1800000, medianSalaryYear: 2026 },
  ],
  hasCutoffs: true,
  dataFreshness: freshness,
};
const item: ShortlistItem = {
  slug: "iim-test",
  name: institute.name,
  shortName: institute.shortName,
  status: "interested",
  deadline: null,
  notes: "Old note",
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
};

const context: MbaShellContext = {
  profile: {
    userId: "u1",
    targetExam: "cat",
    targetPercentile: 97,
    currentLevel: "intermediate",
    weeklyStudyHours: 10,
    studyDays: [1, 2],
    createdAt: "",
    updatedAt: "",
  },
  firstName: "Asha",
  phone: null,
};

function renderInShell(path: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path={path} element={page} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(mbaApi, "getPrograms").mockResolvedValue({ institutes: [institute], dataFreshness: freshness });
});

describe("/mba/colleges", () => {
  it("lists institutes and adds one to the shortlist", async () => {
    vi.spyOn(mbaApi, "getShortlist").mockResolvedValue({ items: [] });
    const put = vi.spyOn(mbaApi, "putShortlistItem").mockResolvedValue(item);
    const user = userEvent.setup();
    renderInShell("/mba/colleges", <MbaColleges />);

    const card = (await screen.findByRole("heading", { name: "IIM Test" })).closest("article")!;
    expect(within(card).getByText("₹20,00,000")).toBeInTheDocument();
    // Eligibility starts from the onboarding target percentile when nothing was checked before.
    expect(screen.getByLabelText("Overall percentile *")).toHaveValue("97");

    await user.click(within(card).getByRole("button", { name: /Add to shortlist/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0]).toEqual(["iim-test", { status: "interested", deadline: null, notes: null }]);
  });
});

describe("/mba/shortlist", () => {
  it("saves a status change at once, sending the whole entry", async () => {
    vi.spyOn(mbaApi, "getShortlist").mockResolvedValue({ items: [item] });
    const put = vi.spyOn(mbaApi, "putShortlistItem").mockResolvedValue({ ...item, status: "applied" });
    const user = userEvent.setup();
    renderInShell("/mba/shortlist", <MbaShortlist />);

    await user.selectOptions(await screen.findByLabelText("Status"), "applied");
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0]).toEqual(["iim-test", { status: "applied", deadline: null, notes: "Old note" }]);
  });

  it("shows an empty state that points to the colleges page", async () => {
    vi.spyOn(mbaApi, "getShortlist").mockResolvedValue({ items: [] });
    renderInShell("/mba/shortlist", <MbaShortlist />);
    expect(await screen.findByText("Your shortlist is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse colleges" })).toHaveAttribute("href", "/mba/colleges");
  });
});
