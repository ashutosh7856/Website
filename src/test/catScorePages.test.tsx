import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";
import { procounselApi } from "@/api/procounselApi";
import CatScoreCalculator from "@/pages/mba-public/CatScoreCalculator";
import FreeCatMockTest from "@/pages/mba-public/FreeCatMockTest";
import { CAT_MARKING_SOURCE } from "@/lib/mbaPublic";

/** Both pages are prerendered with the API blocked: everything comes from the snapshot. */

vi.mock("@/components/leads/QuickLeadForm", () => ({
  default: ({ heading }: { heading?: string }) => <div data-testid="quick-lead-form">{heading}</div>,
}));

const ldTypes = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
    (n) => JSON.parse(n.textContent || "null")?.["@type"],
  );

function renderAt(path: string, el: React.ReactNode) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>{el}</MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("/cat-score-calculator", () => {
  it("renders without network, with the marking source and schema", async () => {
    const get = vi.spyOn(procounselApi, "get");
    const post = vi.spyOn(procounselApi, "post");
    renderAt("/cat-score-calculator", <CatScoreCalculator />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CAT 2026 Score Calculator");
    expect(screen.getAllByRole("link", { name: new RegExp(CAT_MARKING_SOURCE.title.slice(0, 20)) }).length).toBeGreaterThan(0);
    // Tool first: no lead form before a result except the page-end conversion block.
    expect(screen.getAllByTestId("quick-lead-form")).toHaveLength(1);
    expect(screen.queryByText(/Share on WhatsApp/)).not.toBeInTheDocument();
    await waitFor(() => expect(ldTypes()).toEqual(expect.arrayContaining(["SoftwareApplication", "FAQPage", "BreadcrumbList"])));
    expect(get).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("calculates section and total raw scores, then offers WhatsApp share and the counsellor form", async () => {
    const user = userEvent.setup();
    renderAt("/cat-score-calculator", <CatScoreCalculator />);
    await user.type(screen.getByLabelText("VARC MCQ correct"), "12");
    await user.type(screen.getByLabelText("VARC MCQ wrong"), "4");
    await user.type(screen.getByLabelText("VARC TITA correct"), "5");
    await user.type(screen.getByLabelText("QA MCQ correct"), "10");
    await user.click(screen.getByRole("button", { name: "Calculate my score" }));

    const table = screen.getByRole("table", { name: /raw score by section/i });
    const row = (id: string) => within(table).getByText(id).closest("tr")!;
    expect(row("VARC")).toHaveTextContent(/47$/);
    expect(row("DILR")).toHaveTextContent(/0$/);
    expect(row("QA")).toHaveTextContent(/30$/);
    expect(row("Total")).toHaveTextContent(/77$/);

    const share = screen.getByRole("link", { name: /Share on WhatsApp/ });
    expect(share.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(share.getAttribute("href")!)).toContain("raw score: 77");
    expect(screen.getByText("Get your score reviewed and a college plan from an MBA counsellor")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "CAT college predictor" })[0]).toHaveAttribute("href", "/cat-college-predictor");
  });

  it("blocks more answers than a section can have (30 while 2026 counts are unannounced)", async () => {
    const user = userEvent.setup();
    renderAt("/cat-score-calculator", <CatScoreCalculator />);
    await user.type(screen.getByLabelText("DILR MCQ correct"), "20");
    await user.type(screen.getByLabelText("DILR MCQ wrong"), "11");
    await user.click(screen.getByRole("button", { name: "Calculate my score" }));
    expect(screen.getByText(/at most 30 questions/)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /raw score by section/i })).not.toBeInTheDocument();
  });
});

describe("/free-cat-mock-test", () => {
  it("renders the offer, the pattern table and FAQ + breadcrumb schema without network", async () => {
    const get = vi.spyOn(procounselApi, "get");
    renderAt("/free-cat-mock-test", <FreeCatMockTest />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Free CAT Mock Tests 2026");
    expect(screen.getAllByText(/not past CAT papers/).length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: /sections and timing/ })).toHaveTextContent("120 min");
    expect(screen.getAllByRole("button", { name: /Start a free mock/ }).length).toBeGreaterThan(0);
    await waitFor(() => expect(ldTypes()).toEqual(expect.arrayContaining(["FAQPage", "BreadcrumbList"])));
    expect(ldTypes()).not.toContain("Course");
    expect(get).not.toHaveBeenCalled();
  });

  it("Start a free mock: an MBA student goes to /mba/mocks; a visitor gets the login with MBA intent", async () => {
    const user = userEvent.setup();
    const toggleLogin = vi.fn();
    useAuthStore.setState({ isAuthenticated: false, role: null as never, toggleLogin });
    const { unmount } = renderAt("/free-cat-mock-test", <FreeCatMockTest />);
    await user.click(screen.getAllByRole("button", { name: /Start a free mock/ })[0]);
    expect(toggleLogin).toHaveBeenCalled();
    unmount();

    useAuthStore.setState({ isAuthenticated: true, role: "mbaStudent" as never });
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/free-cat-mock-test"]}>
          <Routes>
            <Route path="/free-cat-mock-test" element={<FreeCatMockTest />} />
            <Route path="/mba/mocks" element={<div>mocks page</div>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );
    await user.click(screen.getAllByRole("button", { name: /Start a free mock/ })[0]);
    expect(screen.getByText("mocks page")).toBeInTheDocument();
  });
});
