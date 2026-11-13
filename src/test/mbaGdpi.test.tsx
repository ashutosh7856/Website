import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { gdpiApi, wordCount, type GdpiItem, type GdpiSession } from "@/api/mbaGdpi";
import MbaGdpi from "@/pages/mba/MbaGdpi";
import MbaGdpiInterview from "@/pages/mba/MbaGdpiInterview";
import MbaGdpiWat from "@/pages/mba/MbaGdpiWat";

/** GDPI hub (bank + history), the AI mock interview and the timed WAT. */

const item = (over: Partial<GdpiItem>): GdpiItem => ({
  id: "pi-personal-intro",
  kind: "pi",
  group: "personal",
  prompt: "Walk us through your journey so far.",
  framing: "Whether you can tell a coherent story about yourself.",
  lookFor: [],
  angles: [],
  structure: ["Start with who you are today", "Two proof points", "Why MBA now"],
  avoid: ["Reciting your CV"],
  background: null,
  source: { kind: "original", title: "ProCounsel original GDPI guidance" },
  ...over,
});
const pi1 = item({});
const pi2 = item({ id: "pi-academics-engineering-project", group: "academics", background: "engineering", prompt: "Explain your final-year project to a layperson." });
const wat = item({ id: "wat-abstract-zero", kind: "wat", group: "abstract", prompt: "Zero", lookFor: ["Original interpretation", "Structure", "Clarity"], structure: [] });
const gd = item({
  id: "gd-business-four-day-week",
  kind: "gd",
  group: "business",
  prompt: "Should companies move to a four-day work week?",
  lookFor: ["Builds on others"],
  angles: [{ angle: "Productivity", forView: "Rested teams focus better.", againstView: "Some roles need daily cover." }],
  structure: [],
});

const feedback = {
  scores: { structure: 4, clarity: 3, relevance: 5, completeness: 2 },
  strengths: ["Clear opening"],
  improvements: ["Add a specific example"],
  betterOutline: ["Who you are today", "One proof point", "Why MBA now"],
  fallback: false,
};

const session = (over: Partial<GdpiSession> = {}): GdpiSession => ({
  id: "s1",
  kind: "pi",
  status: "in_progress",
  title: "Mock interview",
  focus: null,
  background: "engineering",
  durationMinutes: null,
  startedAt: "2026-11-11T06:00:00.000Z",
  endsAt: null,
  serverNow: "2026-11-11T06:00:00.000Z",
  completedAt: null,
  questions: [pi1, pi2],
  answers: [],
  summary: { answered: 0, total: 2, averageScores: null, overall: null },
  ...over,
});

function renderAt(path: string, routePath: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("wordCount", () => {
  it("counts whitespace-separated words", () => {
    expect(wordCount("  one two\nthree  ")).toBe(3);
    expect(wordCount("")).toBe(0);
  });
});

describe("/mba/gdpi hub", () => {
  it("filters PI questions by group and background, and shows guidance", async () => {
    vi.spyOn(gdpiApi, "getItems").mockResolvedValue({ items: [pi1, pi2, item({ id: "pi-academics-commerce-x", group: "academics", background: "commerce", prompt: "What is working capital?" })] });
    const user = userEvent.setup();
    renderAt("/mba/gdpi", "/mba/gdpi", <MbaGdpi />);
    expect(await screen.findByText(pi1.prompt)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("My background"), "engineering");
    expect(screen.queryByText("What is working capital?")).not.toBeInTheDocument();
    expect(screen.getByText(pi2.prompt)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Academics" }));
    expect(screen.queryByText(pi1.prompt)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Show guidance/ }));
    expect(screen.getByText("What the panel is assessing")).toBeInTheDocument();
  });

  it("shows GD angles for and against", async () => {
    vi.spyOn(gdpiApi, "getItems").mockResolvedValue({ items: [gd] });
    const user = userEvent.setup();
    renderAt("/mba/gdpi?tab=gd", "/mba/gdpi", <MbaGdpi />);
    await user.click(await screen.findByRole("button", { name: /Show guidance/ }));
    expect(screen.getByText("Rested teams focus better.")).toBeInTheDocument();
    expect(screen.getByText("Some roles need daily cover.")).toBeInTheDocument();
  });

  it("lists past sessions", async () => {
    vi.spyOn(gdpiApi, "getSessions").mockResolvedValue({
      sessions: [{ id: "s1", kind: "wat", status: "completed", title: "Zero", focus: null, answered: 1, total: 1, overall: 3.5, startedAt: "2026-11-11T06:00:00Z", completedAt: "2026-11-11T06:15:00Z" }],
    });
    renderAt("/mba/gdpi?tab=history", "/mba/gdpi", <MbaGdpi />);
    const link = await screen.findByRole("link", { name: /WAT: Zero/ });
    expect(link).toHaveAttribute("href", "/mba/gdpi/wat?session=s1");
    expect(screen.getByText("3.5/5")).toBeInTheDocument();
  });
});

describe("/mba/gdpi/interview", () => {
  it("starts a session, answers a question, shows feedback and moves on", async () => {
    const create = vi.spyOn(gdpiApi, "createSession").mockResolvedValue(session());
    vi.spyOn(gdpiApi, "getSession").mockResolvedValue(session());
    const answered = session({
      answers: [{ questionId: pi1.id, mode: "text" as const, delivery: null, answerText: "I am an engineer who builds payment systems.", wordCount: 8, overtime: false, feedback, answeredAt: "" }],
      summary: { answered: 1, total: 2, averageScores: feedback.scores, overall: 3.5 },
    });
    const submit = vi.spyOn(gdpiApi, "submitAnswer").mockResolvedValue({ answer: answered.answers[0], session: answered, remainingToday: 7 });
    const user = userEvent.setup();
    renderAt("/mba/gdpi/interview", "/mba/gdpi/interview", <MbaGdpiInterview />);

    await user.click(screen.getByRole("button", { name: "Engineering" }));
    await user.click(screen.getByRole("button", { name: "Start mock interview" }));
    expect(create.mock.calls[0][0]).toEqual({ kind: "pi", background: "engineering", focus: undefined });

    expect(await screen.findByText(pi1.prompt)).toBeInTheDocument();
    const box = screen.getByLabelText("Your answer");
    const send = screen.getByRole("button", { name: "Submit for feedback" });
    await user.type(box, "Too short");
    expect(send).toBeDisabled();
    await user.clear(box);
    await user.type(box, "I am an engineer who builds payment systems.");
    await user.click(send);
    expect(submit).toHaveBeenCalledWith("s1", { questionId: pi1.id, answerText: "I am an engineer who builds payment systems." });

    expect(await screen.findByText("Add a specific example")).toBeInTheDocument();
    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("7 AI feedback left today")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(screen.getByText(pi2.prompt)).toBeInTheDocument();
  });

  it("explains a 503 when AI is not configured", async () => {
    const err = Object.assign(new Error("x"), { isAxiosError: true, response: { status: 503, data: { detail: "not configured" } } });
    vi.spyOn(gdpiApi, "createSession").mockRejectedValue(err);
    const user = userEvent.setup();
    renderAt("/mba/gdpi/interview", "/mba/gdpi/interview", <MbaGdpiInterview />);
    await user.click(screen.getByRole("button", { name: "Start mock interview" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("AI feedback isn't available right now");
  });

  it("shows the summary of a completed session", async () => {
    vi.spyOn(gdpiApi, "getSession").mockResolvedValue(
      session({
        status: "completed",
        questions: [pi1],
        answers: [{ questionId: pi1.id, mode: "text" as const, delivery: null, answerText: "My answer text here.", wordCount: 4, overtime: false, feedback, answeredAt: "" }],
        summary: { answered: 1, total: 1, averageScores: feedback.scores, overall: 3.5 },
      }),
    );
    renderAt("/mba/gdpi/interview?session=s1", "/mba/gdpi/interview", <MbaGdpiInterview />);
    expect(await screen.findByText("Session summary")).toBeInTheDocument();
    expect(screen.getAllByText("3.5/5").length).toBeGreaterThan(0);
  });
});

describe("/mba/gdpi/wat", () => {
  it("starts a timed essay on a chosen topic and submits it", async () => {
    vi.spyOn(gdpiApi, "getItems").mockResolvedValue({ items: [wat] });
    const now = new Date().toISOString();
    const running = session({ id: "w1", kind: "wat", title: "Zero", questions: [wat], durationMinutes: 20, serverNow: now, endsAt: new Date(Date.now() + 20 * 60_000).toISOString(), summary: { answered: 0, total: 1, averageScores: null, overall: null } });
    const create = vi.spyOn(gdpiApi, "createSession").mockResolvedValue(running);
    vi.spyOn(gdpiApi, "getSession").mockResolvedValue(running);
    const essay = "Zero is where every count begins and where many ideas end.";
    const done = { ...running, status: "completed" as const, answers: [{ questionId: wat.id, mode: "text" as const, delivery: null, answerText: essay, wordCount: 12, overtime: false, feedback, answeredAt: "" }] };
    const submit = vi.spyOn(gdpiApi, "submitAnswer").mockResolvedValue({ answer: done.answers[0], session: done, remainingToday: 3 });
    const user = userEvent.setup();
    renderAt("/mba/gdpi/wat?topic=wat-abstract-zero", "/mba/gdpi/wat", <MbaGdpiWat />);

    expect(await screen.findByText("Zero")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "20 minutes" }));
    await user.click(screen.getByRole("button", { name: "Start the clock" }));
    expect(create.mock.calls[0][0]).toEqual({ kind: "wat", itemId: "wat-abstract-zero", durationMinutes: 20 });

    expect(await screen.findByRole("timer")).toHaveTextContent(/^(20:00|19:5\d)$/);
    await user.type(screen.getByLabelText("Your essay"), essay);
    expect(screen.getByText("11 words")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit essay" }));
    expect(submit).toHaveBeenCalledWith("w1", { questionId: wat.id, answerText: essay });
    await waitFor(() => expect(screen.getByText("Add a specific example")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Write another essay" })).toBeInTheDocument();
  });
});
