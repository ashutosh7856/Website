import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

/**
 * Every predictor is open to a signed-out visitor: the full result renders
 * with no blur, no lock and no login prompt, and a soft call-back form follows
 * it carrying the search. These pages rank in search, so a login wall over the
 * answer is a dead end — the lead is asked for, never required.
 */

const predictNEETRank = vi.hoisted(() => vi.fn());
const predictJEERank = vi.hoisted(() => vi.fn());
const predictJEEColleges = vi.hoisted(() => vi.fn());
const predictMHTCETColleges = vi.hoisted(() => vi.fn());
const captureLead = vi.hoisted(() => vi.fn(() => Promise.resolve({ ok: true })));

vi.mock("@/api/neetV2", async (original) => {
  const actual = await original<typeof import("@/api/neetV2")>();
  return { ...actual, predictNEETRank };
});
vi.mock("@/api/jee", async (original) => {
  const actual = await original<typeof import("@/api/jee")>();
  return { ...actual, predictJEERank, predictJEEColleges };
});
vi.mock("@/api/mhtcet", async (original) => {
  const actual = await original<typeof import("@/api/mhtcet")>();
  return { ...actual, predictMHTCETColleges };
});
vi.mock("@/api/leads", () => ({ captureLead }));

import NEETRankPredictorV2 from "@/pages/neet/NEETRankPredictorV2";
import JEERankPredictor from "@/pages/JEERankPredictor";
import JEECollegePredictor from "@/pages/JEECollegePredictor";
import MHTCETCollegePredictor from "@/pages/MHTCETCollegePredictor";
import { useAuthStore } from "@/store/AuthStore";

function renderPage(node: React.ReactNode) {
  return render(
    <HelmetProvider>
      <MemoryRouter>{node}</MemoryRouter>
    </HelmetProvider>,
  );
}

function expectNoLoginWall() {
  expect(screen.queryByText(/login to view results/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /login now/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/login to (unlock|see)/i)).not.toBeInTheDocument();
  expect(document.querySelector(".blur-sm")).toBeNull();
}

function storedSearch() {
  return JSON.parse(localStorage.getItem("pc_predictor_search") || "null");
}

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

describe("predictors without login", () => {
  it("NEET rank predictor calls the real API and shows the full rank", async () => {
    predictNEETRank.mockResolvedValue({
      marks: 650,
      year: 2025,
      predicted_rank: 4321,
      rank_range: "4000 - 4600",
      rank_min: 4000,
      rank_max: 4600,
    });
    renderPage(<NEETRankPredictorV2 />);

    fireEvent.change(screen.getByPlaceholderText("e.g. 650"), { target: { value: "650" } });
    fireEvent.click(screen.getByRole("button", { name: "Predict My Rank" }));

    expect(await screen.findByText("4,321")).toBeInTheDocument();
    expect(predictNEETRank).toHaveBeenCalledWith({ marks: 650, year: 2025 });
    expectNoLoginWall();
    expect(
      screen.getByRole("heading", { name: /want a counsellor to review your rank/i }),
    ).toBeInTheDocument();
    expect(storedSearch()).toMatchObject({ exam: "NEET", tool: "Rank Predictor" });

    // The result can be forwarded: a WhatsApp share built from the figures on screen.
    const share = screen.getByRole("link", { name: "Share on WhatsApp" });
    const text = decodeURIComponent(share.getAttribute("href")!.replace("https://wa.me/?text=", ""));
    expect(text).toContain("~4,321 (score 650)");
    expect(text).toContain("https://procounsel.co.in/neet-rank-predictor/?utm_source=whatsapp");
  });

  it("NEET rank predictor shows no share action before a result", () => {
    renderPage(<NEETRankPredictorV2 />);
    expect(screen.queryByRole("link", { name: "Share on WhatsApp" })).not.toBeInTheDocument();
  });

  it("JEE rank predictor shows the API result, not an estimate behind a lock", async () => {
    predictJEERank.mockResolvedValue({
      marks: 200,
      shift_level: "moderate",
      percentile_range: [98.1, 98.6],
      estimated_rank: 15432,
      rank_range: [14000, 17000],
      confidence: "High",
    });
    renderPage(<JEERankPredictor />);

    fireEvent.change(screen.getByPlaceholderText("e.g. 300"), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Predict My Rank" }));

    expect(await screen.findByText("15,432")).toBeInTheDocument();
    expect(predictJEERank).toHaveBeenCalledWith({ marks: 200, shift_level: "moderate" });
    expectNoLoginWall();
    expect(storedSearch()).toMatchObject({ exam: "JEE Main", tool: "Rank Predictor" });
  });

  it("JEE college predictor lists every college and offers a call-back", async () => {
    predictJEEColleges.mockResolvedValue({
      estimated_rank: 20000,
      colleges: [
        { institute_short: "NIT Example", program_name: ["Computer Science"], closing_rank: 21000, chance: "High" },
      ],
    });
    renderPage(<JEECollegePredictor />);

    fireEvent.change(screen.getAllByPlaceholderText(/e\.g\./)[0], { target: { value: "180" } });
    fireEvent.click(screen.getAllByRole("button", { name: /predict colleges/i })[0]);

    expect(await screen.findByText("NIT Example")).toBeInTheDocument();
    expect(predictJEEColleges).toHaveBeenCalledTimes(1);
    expectNoLoginWall();
    expect(
      screen.getByRole("heading", { name: /want a counsellor to review this list/i }),
    ).toBeInTheDocument();
  });

  it("MHT-CET college predictor shows every matching college", async () => {
    predictMHTCETColleges.mockResolvedValue({
      estimated_rank: 5000,
      colleges: [
        { college: "Alpha Institute of Technology", branches: ["Computer Engineering"], best_closing_rank: 4000, best_closing_percentile: 99.1, chance: "High" },
        { college: "Beta College of Engineering", branches: ["Mechanical Engineering"], best_closing_rank: 6000, best_closing_percentile: 98.2, chance: "Moderate" },
      ],
    });
    renderPage(<MHTCETCollegePredictor />);

    fireEvent.change(screen.getByPlaceholderText("e.g. 150"), { target: { value: "150" } });
    fireEvent.click(screen.getAllByRole("button", { name: /predict colleges/i })[0]);

    expect(await screen.findByText("Alpha Institute of Technology")).toBeInTheDocument();
    expect(screen.getByText("Beta College of Engineering")).toBeInTheDocument();
    expectNoLoginWall();
    expect(storedSearch()).toMatchObject({ exam: "MHT-CET", tool: "College Predictor" });

    // The call-back lead carries the search in its remarks.
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha Patil" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Request a call back" }));
    await waitFor(() => expect(captureLead).toHaveBeenCalledTimes(1));
    const payload = (captureLead.mock.calls[0] as unknown as [Record<string, string>])[0];
    expect(payload.interestedExamName).toBe("MHT-CET");
    expect(payload.remarks).toContain("MHT-CET College Predictor: 150 marks");
  });
});
