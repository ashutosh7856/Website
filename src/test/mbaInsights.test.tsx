import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import {
  mbaInsightsApi,
  type AttemptAnalysisResponse,
  type DailyBoard,
  type MbaInsights,
} from "@/api/mbaInsights";
import MockAnalyst from "@/components/mba/MockAnalyst";
import InsightsCard from "@/components/mba/InsightsCard";
import DailyLeaderboard from "@/components/mba/DailyLeaderboard";
import ReportIssue from "@/components/mba/ReportIssue";
import MbaInsightsPage from "@/pages/mba/MbaInsights";

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function httpError(status: number, detail = "nope") {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", String(status), { headers }, null, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data: { detail },
  });
}

afterEach(() => vi.restoreAllMocks());

const analysis: AttemptAnalysisResponse = {
  attemptId: "a1",
  ai: null,
  remainingToday: null,
  analysis: {
    attemptId: "a1",
    title: "Mock 01",
    submittedAt: "2026-11-11T10:00:00Z",
    score: 10,
    maxScore: 27,
    questionCount: 9,
    attempted: 7,
    lowEvidence: true,
    evidenceNote: "Only 7 questions attempted — patterns below are tentative.",
    sections: [],
    byDifficulty: [{ difficulty: "easy", total: 3, attempted: 2, correct: 1, incorrect: 1, skipped: 1, accuracy: 0.5 }],
    byTopic: [{ section: "QA", topic: "Algebra", total: 3, attempted: 3, correct: 2, incorrect: 1, skipped: 0, accuracy: 0.6667, timeSpentMs: 120000 }],
    missedEasy: [{ questionId: "q3", section: "VARC", number: 3, topic: "RC", difficulty: "easy", outcome: "skipped", timeSpentMs: 5000 }],
    timeSinks: [{ questionId: "q9", section: "QA", number: 2, topic: "Algebra", difficulty: "hard", outcome: "incorrect", timeSpentMs: 600000, sectionMedianMs: 57500, ratio: 10.43 }],
    selection: { easySkipped: 1, easyIncorrect: 1, hardAttempted: 3, hardCorrect: 2, timeOnIncorrectMs: 1, timeOnHardIncorrectMs: 1, timeSinkCount: 1 },
    links: [{ id: "topic:QA:Algebra", label: "Practise Algebra (Quant)", href: "/mba/practice?section=QA&topic=Algebra" }],
  },
};

describe("MockAnalyst", () => {
  it("shows the deterministic analysis and keeps it when the AI is unavailable", async () => {
    vi.spyOn(mbaInsightsApi, "getAnalysis").mockResolvedValue(analysis);
    const explain = vi.spyOn(mbaInsightsApi, "explainAnalysis").mockRejectedValue(httpError(503));
    wrap(<MockAnalyst attemptId="a1" />);

    expect(await screen.findByText(/Only 7 questions attempted/)).toBeInTheDocument();
    expect(screen.getByText("VARC Q3")).toBeInTheDocument();
    expect(screen.getByText("Quant Q2")).toBeInTheDocument();
    expect(screen.getByText(/10\.43×/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Explain with AI/ }));
    expect(await screen.findByText(/AI explanation is not available right now/)).toBeInTheDocument();
    expect(explain).toHaveBeenCalledWith("a1");
    expect(screen.getByText("VARC Q3")).toBeInTheDocument();
  });

  it("renders the AI explanation with in-app practice links", async () => {
    vi.spyOn(mbaInsightsApi, "getAnalysis").mockResolvedValue(analysis);
    vi.spyOn(mbaInsightsApi, "explainAnalysis").mockResolvedValue({
      ...analysis,
      ai: {
        summary: "Thin evidence, but QA time went into one hard question.",
        strengths: ["Hard QA accuracy 2/3"],
        priorities: [{ title: "Cap time per question", detail: "", nextSteps: ["Move on after 3 minutes"], link: analysis.analysis.links[0] }],
        selectionAdvice: "Pick easy VARC first.",
        generatedAt: "",
        model: "m",
      },
      remainingToday: 4,
    });
    wrap(<MockAnalyst attemptId="a1" />);
    fireEvent.click(await screen.findByRole("button", { name: /Explain with AI/ }));
    expect(await screen.findByText(/Thin evidence/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Practise Algebra/ })).toHaveAttribute("href", "/mba/practice?section=QA&topic=Algebra");
    expect(screen.queryByRole("button", { name: /Explain with AI/ })).not.toBeInTheDocument();
  });
});

const insights: MbaInsights = {
  topics: [
    { section: "QA", topic: "Algebra", questions: 6, attempts: 10, correct: 4, accuracy: 0.4, avgTimeMs: 90000, timedAnswers: 3, confidence: "sufficient", status: "weak", href: "/mba/practice?section=QA&topic=Algebra" },
    { section: "VARC", topic: "RC", questions: 3, attempts: 3, correct: 1, accuracy: 0.3333, avgTimeMs: null, timedAnswers: 0, confidence: "low", status: "low_evidence", href: "/mba/practice?section=VARC&topic=RC" },
  ],
  weakTopics: [],
  lowEvidenceCount: 1,
  trend: [{ attemptId: "a1", title: "Mock 01", kind: "full_mock", submittedAt: "2026-11-11T10:00:00Z", score: 10, maxScore: 27, sections: [{ id: "QA", score: 6, maxScore: 12, accuracy: 0.66 }] }],
  rules: { minAttempts: 8, weakBelow: 0.6, strongFrom: 0.8 },
};
insights.weakTopics = [insights.topics[0]];

describe("Insights", () => {
  it("dashboard card lists only evidence-backed weak topics", async () => {
    vi.spyOn(mbaInsightsApi, "getInsights").mockResolvedValue(insights);
    wrap(<InsightsCard />);
    const link = await screen.findByRole("link", { name: /Algebra/ });
    expect(link).toHaveAttribute("href", "/mba/practice?section=QA&topic=Algebra");
    expect(screen.queryByText("RC")).not.toBeInTheDocument();
  });

  it("insights page labels low-confidence topics and shows the trend", async () => {
    vi.spyOn(mbaInsightsApi, "getInsights").mockResolvedValue(insights);
    wrap(<MbaInsightsPage />);
    const table = (await screen.findByRole("heading", { name: "By topic" })).closest("section")!;
    expect(within(table).getByText("Low confidence")).toBeInTheDocument();
    expect(within(table).getByText("Weak")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mock 01" })).toHaveAttribute("href", "/mba/results/a1");
  });
});

const board: DailyBoard = {
  date: "2026-11-12",
  questionCount: 6,
  participants: 21,
  optedIn: false,
  entries: [{ rank: 1, displayName: "Ravi K.", answered: 6, correct: 6, accuracy: 1, isYou: false }],
  you: null,
  rule: "Ranked by accuracy.",
};

describe("DailyLeaderboard", () => {
  it("non-opted students see the explainer and can join with a display name", async () => {
    vi.spyOn(mbaInsightsApi, "getLeaderboardPrefs").mockResolvedValue({ optedIn: false, displayName: "Asha V.", suggestedName: "Asha V." });
    vi.spyOn(mbaInsightsApi, "getDailyBoard").mockResolvedValue(board);
    const put = vi.spyOn(mbaInsightsApi, "putLeaderboardPrefs").mockResolvedValue({ optedIn: true, displayName: "Asha", suggestedName: "Asha V." });
    wrap(<DailyLeaderboard />);
    expect(await screen.findByText(/never your phone number/)).toBeInTheDocument();
    expect(await screen.findByText("Ravi K.")).toBeInTheDocument();
    const input = screen.getByLabelText("Display name");
    expect(input).toHaveValue("Asha V.");
    fireEvent.change(input, { target: { value: "Asha" } });
    fireEvent.click(screen.getByRole("button", { name: "Join leaderboard" }));
    await waitFor(() => expect(put).toHaveBeenCalledWith({ optedIn: true, displayName: "Asha" }));
  });

  it("shows the student's own rank below the top 20", async () => {
    vi.spyOn(mbaInsightsApi, "getLeaderboardPrefs").mockResolvedValue({ optedIn: true, displayName: "Asha V.", suggestedName: "Asha V." });
    vi.spyOn(mbaInsightsApi, "getDailyBoard").mockResolvedValue({
      ...board,
      optedIn: true,
      you: { rank: 23, displayName: "Asha V.", answered: 6, correct: 3, accuracy: 0.5, isYou: true },
    });
    wrap(<DailyLeaderboard />);
    expect(await screen.findByText("23")).toBeInTheDocument();
    expect(screen.getByText("Asha V. (you)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave leaderboard" })).toBeInTheDocument();
  });
});

describe("ReportIssue", () => {
  it("sends one report per question and shows rate-limit errors", async () => {
    vi.spyOn(mbaInsightsApi, "getMyReport").mockResolvedValue({ report: null });
    const submit = vi
      .spyOn(mbaInsightsApi, "submitReport")
      .mockResolvedValueOnce({ questionId: "q1", category: "typo", note: "x", status: "open", createdAt: "", updatedAt: "" })
      .mockRejectedValueOnce(httpError(429, "You can send up to 20 reports a day."));
    wrap(<ReportIssue questionId="q1" />);
    fireEvent.click(screen.getByRole("button", { name: /Report an issue/ }));
    const send = await screen.findByRole("button", { name: "Send report" });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Typo or formatting" }));
    fireEvent.change(screen.getByLabelText(/Details/), { target: { value: "x" } });
    fireEvent.click(send);
    expect(await screen.findByText(/our faculty will check it/)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith("q1", { category: "typo", note: "x" });
    fireEvent.click(screen.getByRole("radio", { name: "Something else" }));
    fireEvent.click(screen.getByRole("button", { name: "Update report" }));
    expect(await screen.findByText(/up to 20 reports a day/)).toBeInTheDocument();
  });
});
