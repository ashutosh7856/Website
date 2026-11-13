import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/api/course", () => ({
  getAllCounsellorCoursesForGuest: vi.fn(),
  getBoughtCourses: vi.fn(),
}));

import { getAllCounsellorCoursesForGuest, getBoughtCourses } from "@/api/course";
import { mbaApi, type ShortlistItem } from "@/api/mba";
import { mbaApplicationsApi, type Application, type CounsellorRequest } from "@/api/mbaApplications";
import { courseDetailPath, isMbaCourse, selectMbaCourses } from "@/api/mbaLearn";
import MbaLearn from "@/pages/mba/MbaLearn";
import MbaShortlist from "@/pages/mba/MbaShortlist";

function renderAt(path: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const row = (courseId: string, courseName: string, price: number, extra: Record<string, unknown> = {}) => ({
  courseId,
  courseName,
  category: "COURSE",
  courseThumbnailUrl: "",
  coursePrice: price,
  coursePriceAfterDiscount: price,
  rating: 0,
  soldCount: 0,
  ...extra,
});

describe("MBA course filter", () => {
  it("matches MBA / CAT terms as whole words only", () => {
    expect(isMbaCourse({ courseName: "CAT 2026 Quant crash course" })).toBe(true);
    expect(isMbaCourse({ courseName: "IIMs interview prep" })).toBe(true);
    expect(isMbaCourse({ courseName: "GD-PI masterclass" })).toBe(true);
    expect(isMbaCourse({ courseName: "Anything", category: "MBA" })).toBe(true);
    expect(isMbaCourse({ courseName: "Communication Skills" })).toBe(false);
    expect(isMbaCourse({ courseName: "Education for all" })).toBe(false);
    expect(isMbaCourse({ courseName: "HSC Titan Batch" })).toBe(false);
  });

  it("puts free courses first, then best sellers, and drops duplicates and non-MBA rows", () => {
    const list = selectMbaCourses(
      {
        data: [
          row("a", "MBA Finance basics", 499, { soldCount: 50, coursePrice: 999, coursePriceAfterDiscount: 499 }),
          row("b", "CAT VARC free", 0),
          row("c", "NEET Biology", 0),
          row("d", "XAT decision making", 299, { soldCount: 90 }),
          row("b", "CAT VARC free", 0),
        ],
      },
      new Set(["d"]),
    );
    expect(list.map((c) => c.courseId)).toEqual(["b", "d", "a"]);
    expect(list[2]).toMatchObject({ price: 499, listPrice: 999, enrolled: false });
    expect(list[1].enrolled).toBe(true);
    expect(selectMbaCourses(null)).toEqual([]);
  });
});

describe("/mba/learn", () => {
  beforeEach(() => {
    vi.mocked(getBoughtCourses).mockResolvedValue({ data: [], message: "" });
  });

  it("lists MBA courses linking to the course page inside the MBA app", async () => {
    vi.mocked(getAllCounsellorCoursesForGuest).mockResolvedValue({
      data: [row("c1", "CAT Quant in 30 days", 0), row("c2", "Music Class", 0)],
      message: "",
    } as never);
    renderAt("/mba/learn", <MbaLearn />);
    const link = await screen.findByRole("link", { name: /CAT Quant in 30 days/ });
    expect(link).toHaveAttribute("href", courseDetailPath("c1"));
    expect(courseDetailPath("c1")).toBe("/mba/learn/c1");
    expect(within(link).getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("Music Class")).not.toBeInTheDocument();
  });

  it("explains that courses are coming and links to practice when there are none", async () => {
    vi.mocked(getAllCounsellorCoursesForGuest).mockResolvedValue({ data: [row("x", "Music Class", 0)], message: "" } as never);
    renderAt("/mba/learn", <MbaLearn />);
    expect(await screen.findByText("MBA courses are coming soon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice now" })).toHaveAttribute("href", "/mba/practice");
  });
});

const item: ShortlistItem = {
  slug: "iim-test",
  name: "Indian Institute of Management Test",
  shortName: "IIM Test",
  status: "applied",
  deadline: null,
  notes: null,
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
};
const app = (done: boolean): Application => ({
  ...item,
  officialDates: {
    applicationOpens: null,
    applicationDeadline: "2026-11-28",
    examDate: null,
    notes: null,
    sourceUrl: "https://example.org/admissions",
  },
  effectiveDeadline: "2026-11-28",
  deadlineSource: "official",
  checklist: [
    { id: "cat-scorecard", label: "CAT scorecard", hint: null, custom: false, optional: false, done, notApplicable: false, doneAt: null, documents: [] },
    { id: "sop-essays", label: "SOP / essays", hint: null, custom: false, optional: true, done: false, notApplicable: false, doneAt: null, documents: [] },
  ],
  progress: { done: done ? 1 : 0, total: 2 },
  outcome: { applied: null, shortlisted: null, interviewDone: null, result: null, decision: null, updatedAt: null },
});
const funnel = { applications: 1, applied: 0, shortlisted: 0, interviewDone: 0, admit: 0, waitlist: 0, reject: 0, accepted: 0, declined: 0 };
const documents = { enabled: true, maxBytes: 5242880, allowedTypes: ["application/pdf", "image/jpeg", "image/png"] };
const request: CounsellorRequest = {
  id: "r1",
  topic: "wat-pi",
  preferredTime: "Evenings",
  preferredSlots: [],
  note: null,
  slug: "iim-test",
  status: "contacted",
  counsellorName: "Priya",
  shareWithCounsellor: false,
  createdAt: "2026-11-10T00:00:00Z",
  updatedAt: "2026-11-10T00:00:00Z",
  assignedAt: "2026-11-10T00:00:00Z",
  closedAt: null,
  timeline: [{ at: "2026-11-10T00:00:00Z", text: "You asked for a call" }],
};

describe("/mba/shortlist application tracker", () => {
  beforeEach(() => {
    vi.spyOn(mbaApi, "getShortlist").mockResolvedValue({ items: [item] });
    vi.spyOn(mbaApplicationsApi, "getApplications").mockResolvedValue({ items: [app(false)], funnel, documents });
  });

  it("shows the checklist progress, official dates, and ticks an item", async () => {
    vi.spyOn(mbaApplicationsApi, "getCounsellorRequests").mockResolvedValue({ requests: [] });
    const patch = vi.spyOn(mbaApplicationsApi, "patchChecklistItem").mockResolvedValue(app(true));
    const user = userEvent.setup();
    renderAt("/mba/shortlist", <MbaShortlist />);

    expect(await screen.findByText("0/2 ready")).toBeInTheDocument();
    expect(screen.getByText(/closes 28 Nov 2026/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Documents/ }));
    await user.click(screen.getByRole("checkbox", { name: "CAT scorecard" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("iim-test", "cat-scorecard", { done: true }));
    expect(await screen.findByText("1/2 ready")).toBeInTheDocument();
  });

  it("shows earlier counsellor requests and sends a new one", async () => {
    vi.spyOn(mbaApplicationsApi, "getCounsellorRequests").mockResolvedValue({ requests: [request] });
    const create = vi.spyOn(mbaApplicationsApi, "createCounsellorRequest").mockResolvedValue({ ...request, id: "r2", status: "new", counsellorName: null });
    const user = userEvent.setup();
    renderAt("/mba/shortlist", <MbaShortlist />);

    expect(await screen.findByText("Contacted")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request a call" }));
    await user.selectOptions(screen.getByLabelText("What do you need help with?"), "applications");
    await user.type(screen.getByLabelText(/Best time to call/), "Sunday morning");
    await user.click(screen.getByRole("button", { name: "Send request" }));
    await waitFor(() =>
      expect(create.mock.calls[0][0]).toEqual({ topic: "applications", slug: null, preferredTime: "Sunday morning", note: null, shareWithCounsellor: false }),
    );
    expect(await screen.findByText(/Request sent/)).toBeInTheDocument();
  });
});
