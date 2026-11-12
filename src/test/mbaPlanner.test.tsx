import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { plannerApi, type PlanTask, type WeekPlan, type NotificationsResponse } from "@/api/mbaPlanner";
import type { MbaShellContext } from "@/lib/mbaShellContext";
import MbaPlanner from "@/pages/mba/MbaPlanner";
import NotificationsBell from "@/components/mba/NotificationsBell";
import TodayPlanCard from "@/components/mba/TodayPlanCard";
import { addDays, buildWeekIcs, formatMinutes, weekProgress, weekStartOf } from "@/lib/mbaPlanner";

/** /mba/planner (server-generated week plan), the header bell, and the dashboard's today card. */

const task = (over: Partial<PlanTask>): PlanTask => ({
  id: "u1_2026-11-09_2026-11-12-practice-DILR",
  date: "2026-11-12",
  type: "practice",
  title: "Practise DILR",
  detail: "20 questions, about 60 min.",
  section: "DILR",
  topic: null,
  questionCount: 20,
  minutes: 60,
  href: "/mba/practice?section=DILR",
  status: "pending",
  source: "generated",
  generatedBy: "planner-v1",
  edited: false,
  autoCompleted: false,
  completedAt: null,
  createdAt: "2026-11-12T06:00:00.000Z",
  updatedAt: "2026-11-12T06:00:00.000Z",
  ...over,
});

const days = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
function makePlan(over: Partial<WeekPlan> = {}, tasks: PlanTask[] = []): WeekPlan {
  return {
    weekStart: "2026-11-09",
    weekEnd: "2026-11-15",
    today: "2026-11-12",
    generated: tasks.some((t) => t.source === "generated"),
    canGenerate: true,
    days: days.map((date, i) => {
      const own = tasks.filter((t) => t.date === date);
      return { date, weekday: (i + 1) % 7, rest: i === 6, examDay: false, plannedMinutes: own.reduce((n, t) => n + (t.status === "skipped" ? 0 : t.minutes), 0), tasks: own };
    }),
    summary: {
      planned: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      skipped: tasks.filter((t) => t.status === "skipped").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      plannedMinutes: tasks.filter((t) => t.status !== "skipped").reduce((n, t) => n + t.minutes, 0),
      doneMinutes: tasks.filter((t) => t.status === "done").reduce((n, t) => n + t.minutes, 0),
    },
    basis: {
      ruleVersion: "planner-v1",
      examDate: "2026-11-29",
      examDateSource: "profile",
      weeksToExam: 3,
      weeklyStudyHours: 14,
      studyDays: [1, 2, 3, 4, 5, 6],
      minutesPerStudyDay: 140,
      level: "intermediate",
      mocksThisWeek: 3,
      mistakesDue: 0,
      sections: [
        { id: "VARC", attempted: 0, accuracy: null, weight: 1 },
        { id: "DILR", attempted: 6, accuracy: 0, weight: 2.5 },
        { id: "QA", attempted: 0, accuracy: null, weight: 1 },
      ],
      rules: ["14 h a week over 6 study days → about 140 min per study day. Rest days: Sun.", "DILR gets more practice time: accuracy 0% over 6 questions (weight 2.5)."],
    },
    ...over,
  };
}

const context: MbaShellContext = { profile: null, firstName: "Asha", phone: null };

function renderAt(element: React.ReactNode, path = "/mba/planner") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="/mba/planner" element={element} />
            <Route path="/mba/dashboard" element={element} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("planner helpers", () => {
  it("does week maths on calendar days", () => {
    expect(weekStartOf("2026-11-12")).toBe("2026-11-09");
    expect(weekStartOf("2026-11-15")).toBe("2026-11-09");
    expect(weekStartOf("2026-11-16")).toBe("2026-11-16");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-11-09", -7)).toBe("2026-11-02");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(150)).toBe("2h 30m");
  });

  it("summarises progress without counting skipped tasks", () => {
    const plan = makePlan({}, [task({ status: "done" }), task({ id: "b", status: "skipped" }), task({ id: "c" })]);
    expect(weekProgress(plan)).toMatchObject({ done: 1, counted: 2, percent: 50, doneMinutes: 60, plannedMinutes: 120 });
  });

  it("exports the week as all-day calendar events, skipping skipped tasks", () => {
    const plan = makePlan({}, [task({ title: "Practise DILR; sets, tables" }), task({ id: "skip", status: "skipped", title: "Skipped one" })]);
    const ics = buildWeekIcs(plan, "https://example.test", new Date(Date.UTC(2026, 10, 12, 6, 0, 0)));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261112");
    expect(ics).toContain("DTEND;VALUE=DATE:20261113");
    expect(ics).toContain("SUMMARY:Practise DILR\\; sets\\, tables (1h)");
    expect(ics).toContain("URL:https://example.test/mba/practice?section=DILR");
    expect(ics).toContain("DTSTAMP:20261112T060000Z");
    expect(ics).not.toContain("Skipped one");
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
});

describe("/mba/planner", () => {
  it("offers to build the week when there is no plan, and builds it", async () => {
    const built = makePlan({}, [task({})]);
    vi.spyOn(plannerApi, "getPlan").mockResolvedValueOnce(makePlan()).mockResolvedValue(built);
    const generate = vi.spyOn(plannerApi, "generate").mockResolvedValue(built);
    renderAt(<MbaPlanner />);
    await userEvent.click(await screen.findByRole("button", { name: "Build my plan" }));
    expect(generate).toHaveBeenCalledWith("2026-11-09");
    expect(await screen.findByRole("link", { name: "Practise DILR" })).toHaveAttribute("href", "/mba/practice?section=DILR");
  });

  it("shows the week grid, rest day, progress and the rules, and lets the student tick, skip and move tasks", async () => {
    const mock = task({ id: "m", date: "2026-11-14", type: "full_mock", title: "Full CAT mock", minutes: 150, href: "/mba/mocks", section: null });
    const done = task({ id: "d", date: "2026-11-11", type: "daily_challenge", title: "Daily challenge", minutes: 10, href: "/mba/daily", section: null, status: "done", autoCompleted: true });
    const custom = task({ id: "c", type: "custom", title: "Read an editorial", source: "custom", href: null, section: null, minutes: 20 });
    vi.spyOn(plannerApi, "getPlan").mockResolvedValue(makePlan({}, [task({}), mock, done, custom]));
    const patch = vi.spyOn(plannerApi, "patchTask").mockResolvedValue(task({ status: "done" }));
    const del = vi.spyOn(plannerApi, "deleteTask").mockResolvedValue({ deleted: true });
    renderAt(<MbaPlanner />);

    const sunday = await screen.findByRole("region", { name: /Sunday/ });
    expect(within(sunday).getByText("Rest day. Recharge.")).toBeInTheDocument();
    const thursday = screen.getByRole("region", { name: /Thursday/ });
    expect(within(thursday).getByText("Today")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Full CAT mock" })).toHaveAttribute("href", "/mba/mocks");
    expect(screen.getByText(/Ticked off from your activity/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "1 of 4 tasks done" })).toBeInTheDocument();
    expect(screen.getByText(/DILR gets more practice time/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add week to calendar/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mark Practise DILR as done" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("u1_2026-11-09_2026-11-12-practice-DILR", { status: "done" }));
    await userEvent.click(screen.getByRole("button", { name: "Skip Full CAT mock" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("m", { status: "skipped" }));

    await userEvent.click(screen.getByRole("button", { name: "Move Full CAT mock to another day" }));
    const moveInput = screen.getByLabelText("Move to");
    await userEvent.clear(moveInput);
    await userEvent.type(moveInput, "2026-11-13");
    await userEvent.click(screen.getByRole("button", { name: "Move" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("m", { date: "2026-11-13" }));

    // Only the student's own tasks can be deleted.
    expect(screen.queryByRole("button", { name: "Delete Practise DILR" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete Read an editorial" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("c"));
  });

  it("adds a custom task", async () => {
    vi.spyOn(plannerApi, "getPlan").mockResolvedValue(makePlan({}, [task({})]));
    const create = vi.spyOn(plannerApi, "createTask").mockResolvedValue(task({ id: "new", source: "custom" }));
    renderAt(<MbaPlanner />);
    await userEvent.click(await screen.findByRole("button", { name: "Add task" }));
    await userEvent.type(screen.getByLabelText("What"), "Revise formulas");
    const form = screen.getByRole("form", { name: "Add your own task" });
    await userEvent.click(within(form).getByRole("button", { name: "Add task" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ date: "2026-11-12", title: "Revise formulas", minutes: 30 }));
  });
});

describe("dashboard today card", () => {
  it("lists today's tasks with their links", async () => {
    vi.spyOn(plannerApi, "getPlan").mockResolvedValue(makePlan({}, [task({}), task({ id: "x", date: "2026-11-13", title: "Tomorrow" })]));
    renderAt(<TodayPlanCard />, "/mba/dashboard");
    expect(await screen.findByRole("heading", { name: "Today’s plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Practise DILR/ })).toHaveAttribute("href", "/mba/practice?section=DILR");
    expect(screen.queryByText("Tomorrow")).not.toBeInTheDocument();
    expect(screen.getByText(/0 of 1 done/)).toBeInTheDocument();
  });
});

describe("notifications bell", () => {
  const response: NotificationsResponse = {
    unreadCount: 2,
    lastSeenAt: null,
    items: [
      { id: "mistakes-2026-11-12", kind: "mistakes_due", title: "6 mistakes due for review", detail: "Spaced review.", href: "/mba/mistakes?due=true", at: "2026-11-11T18:30:00.000Z", unread: true },
      { id: "cat-2026-11-29-30", kind: "cat_countdown", title: "17 days to CAT", detail: "CAT is on 29 Nov 2026.", href: "/mba/planner", at: "2026-10-29T18:30:00.000Z", unread: true },
    ],
  };

  it("shows the unread count, opens a panel of links and marks everything seen", async () => {
    vi.spyOn(plannerApi, "getNotifications").mockResolvedValue(response);
    const seen = vi.spyOn(plannerApi, "markSeen").mockResolvedValue({ lastSeenAt: "2026-11-12T06:00:00.000Z", dismissed: 0 });
    renderAt(<NotificationsBell />);
    const bell = await screen.findByRole("button", { name: "Notifications, 2 new" });
    await userEvent.click(bell);
    const panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(within(panel).getByRole("link", { name: /6 mistakes due for review/ })).toHaveAttribute("href", "/mba/mistakes?due=true");
    expect(within(panel).getByRole("link", { name: /17 days to CAT/ })).toHaveAttribute("href", "/mba/planner");
    expect(seen).toHaveBeenCalledWith([]);

    await userEvent.click(within(panel).getByRole("button", { name: "Dismiss: 17 days to CAT" }));
    expect(seen).toHaveBeenLastCalledWith(["cat-2026-11-29-30"]);
    expect(within(panel).queryByText("17 days to CAT")).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says when there is nothing new", async () => {
    vi.spyOn(plannerApi, "getNotifications").mockResolvedValue({ items: [], unreadCount: 0, lastSeenAt: null });
    renderAt(<NotificationsBell />);
    await userEvent.click(await screen.findByRole("button", { name: "Notifications" }));
    expect(screen.getByText(/all caught up/)).toBeInTheDocument();
  });
});
