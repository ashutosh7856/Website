import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import StudyAbroadPredictor from "@/pages/StudyAbroadPredictor";

const predictStudyAbroadColleges = vi.hoisted(() => vi.fn());
const createForeignStudent = vi.hoisted(() => vi.fn());

vi.mock("@/api/studyAbroadPredictor", async (original) => {
  const actual = await original<typeof import("@/api/studyAbroadPredictor")>();
  return { ...actual, predictStudyAbroadColleges };
});
vi.mock("@/api/foreignStudent", () => ({ createForeignStudent }));

const prediction = {
  readinessScore: 82,
  confidence: "High",
  profileSummary: "A strong computing profile with a realistic 2027 plan.",
  countryMatches: [
    { country: "Germany", fit: "Strong match", reason: "Good academic fit.", budgetReality: "Budget can work.", watchOut: "Check course language." },
  ],
  universityMatches: [
    ["Technical University of Munich", "Ambitious"],
    ["RWTH Aachen University", "Ambitious"],
    ["TU Berlin", "Target"],
    ["University of Bonn", "Target"],
    ["University of Passau", "Safer"],
    ["University of Potsdam", "Safer"],
  ].map(([name, fitBand]) => ({
    name,
    country: "Germany",
    fitBand,
    suggestedProgram: "MSc Computer Science",
    whyItFits: "Matches the academic profile.",
    budgetFit: "Likely within stated budget",
    admissionWatchOut: "Check prerequisites.",
  })),
  nextSteps: ["Verify programs", "Prepare documents", "Take IELTS", "Review deadlines"],
  importantNote: "Verify every course and requirement on official sources.",
  generatedAt: "2026-10-26T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  predictStudyAbroadColleges.mockResolvedValue(prediction);
  createForeignStudent.mockResolvedValue({ status: "Success" });
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});
function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/study-abroad/university-predictor"]}>
        <StudyAbroadPredictor />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Study Abroad College Predictor", () => {
  it("is an indexable, self-canonical page with useful structured data", async () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Study Abroad College Predictor");

    await waitFor(() => {
      expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"))
        .toBe("https://procounsel.co.in/study-abroad/university-predictor");
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content"))
        .toContain("index,follow");
    });

    await waitFor(() => {
      const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => JSON.parse(node.textContent || "null"));
      expect(schemas.some((schema) => schema?.["@type"] === "SoftwareApplication")).toBe(true);
      expect(schemas.some((schema) => schema?.["@type"] === "FAQPage")).toBe(true);
      expect(schemas.some((schema) => schema?.["@type"] === "BreadcrumbList")).toBe(true);
    });
  });

  it("captures the lead and renders the structured AI shortlist", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Field of study"), "Computer Science");
    await user.clear(screen.getByLabelText("Percentage"));
    await user.type(screen.getByLabelText("Percentage"), "82");
    await user.click(screen.getByRole("button", { name: /Germany/i }));
    await user.type(screen.getByLabelText("Full name"), "Asha Student");
    await user.type(screen.getByLabelText("Mobile number"), "9876543210");
    await user.type(screen.getByLabelText("Email address"), "asha@example.com");
    await user.click(screen.getByRole("button", { name: /Find my university matches/i }));

    await waitFor(() => expect(predictStudyAbroadColleges).toHaveBeenCalledTimes(1));
    expect(createForeignStudent).toHaveBeenCalledWith(expect.objectContaining({
      name: "Asha Student",
      phone: "9876543210",
      interestedCountry: "Germany",
    }));

    expect(await screen.findByText("Your six initial matches")).toBeInTheDocument();
    expect(screen.getByText("Technical University of Munich")).toBeInTheDocument();
    expect(screen.getByText("University of Potsdam")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });
});
