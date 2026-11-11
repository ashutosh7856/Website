import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaApi, type EligibilityResponse } from "@/api/mba";
import CatEligibilityTool from "@/pages/mba-public/CatEligibilityTool";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { ELIGIBILITY_LIMITATIONS, ELIGIBILITY_METHODOLOGY, LAST_VERIFIED } from "@/lib/mbaPublic";

/**
 * /cat-college-predictor is prerendered by react-snap, which blocks
 * every API call. The page must therefore carry its content — intro,
 * methodology, limitations, FAQ and the General-category minimums table — from
 * the bundled snapshot alone, and call POST /eligibility only when asked.
 */

vi.mock("@/components/leads/QuickLeadForm", () => ({
  default: ({ heading }: { heading?: string }) => <div data-testid="quick-lead-form">{heading}</div>,
}));

const ahmedabad = MBA_SNAPSHOT.institutes.find((i) => i.slug === "iim-ahmedabad")!;
const ahmedabadGeneral = ahmedabad.cutoffs.find((c) => c.category === "General" && !c.pwd && !c.gender)!;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/cat-college-predictor"]}>
          <CatEligibilityTool />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("CAT percentile eligibility tool — static content", () => {
  it("renders intro, methodology, limitations and the thresholds table without any network call", () => {
    const get = vi.spyOn(procounselApi, "get");
    const post = vi.spyOn(procounselApi, "post");
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CAT College Predictor");
    expect(screen.getByText(ELIGIBILITY_METHODOLOGY)).toBeInTheDocument();
    expect(screen.getByText(ELIGIBILITY_LIMITATIONS)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`last verified ${LAST_VERIFIED}`, "i")).length).toBeGreaterThan(0);
    expect(screen.getByText(/Reviewed by ProCounsel counselling team/)).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /General category, non-PwD/i });
    // One link per institute in the snapshot, each to its prerendered page.
    for (const inst of MBA_SNAPSHOT.institutes) {
      const link = within(table).getAllByRole("link", { name: new RegExp(`^${inst.shortName}`) })[0];
      expect(link).toHaveAttribute("href", `/mba-colleges/${inst.slug}`);
    }
    const row = within(table).getByRole("link", { name: "IIM Ahmedabad" }).closest("tr")!;
    expect(row).toHaveTextContent(ahmedabadGeneral.policyBatch);
    expect(row).toHaveTextContent(String(ahmedabadGeneral.overall));
    expect(within(row).getByRole("link", { name: /admission policy/i })).toHaveAttribute("href", ahmedabadGeneral.source.url);

    expect(get).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("is self-canonical with FAQPage, SoftwareApplication and BreadcrumbList schema", async () => {
    renderPage();
    await waitFor(() => {
      expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
        "https://procounsel.co.in/cat-college-predictor/",
      );
    });
    const types = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (n) => JSON.parse(n.textContent || "null")?.["@type"],
    );
    expect(types).toEqual(expect.arrayContaining(["FAQPage", "SoftwareApplication", "BreadcrumbList"]));
    // FAQPage only because the FAQ is visible on the page.
    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
  });
});

describe("CAT percentile eligibility tool — checking", () => {
  it("posts the input, shows the API's results and only then offers the result callback form", async () => {
    const response: EligibilityResponse = {
      input: { category: "General", pwd: false, overall: 96 },
      results: [
        {
          slug: "iim-ahmedabad",
          name: ahmedabad.name,
          shortName: ahmedabad.shortName,
          programCode: "MBA-PGP",
          programName: ahmedabad.programs[0].name,
          policyBatch: "2027-29",
          status: "unknown",
          failedOn: [],
          notChecked: ["VARC", "DILR", "QA"],
          thresholds: { overall: 95, varc: 85, dilr: 85, qa: 85 },
          notes: null,
          source: ahmedabadGeneral.source,
        },
      ],
      counts: { meets_minimum: 0, unknown: 1, below_minimum: 0 },
      methodology: "API methodology text",
      limitations: "API limitations text",
      dataFreshness: { retrievedAt: "2026-11-11", cutoffPolicyBatches: ["2026-28", "2027-29"], note: "Freshness note." },
    };
    const check = vi.spyOn(mbaApi, "checkEligibility").mockResolvedValue(response);
    const user = userEvent.setup();
    renderPage();

    // The page always ends with the general MBA callback form; the result-specific one appears only after a check.
    expect(screen.getAllByTestId("quick-lead-form")).toHaveLength(1);
    expect(screen.queryByText("Want help deciding where to apply?")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check against IIM minimums" }));
    expect(await screen.findByText("Enter your Overall percentile.")).toBeInTheDocument();
    expect(check).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Overall percentile *"), "96");
    await user.click(screen.getByRole("button", { name: "Check against IIM minimums" }));

    await waitFor(() => expect(check).toHaveBeenCalled());
    expect(check.mock.calls[0][0]).toEqual({ category: "General", pwd: false, overall: 96 });
    expect(await screen.findByText("API limitations text")).toBeInTheDocument();
    expect(screen.getByText("API methodology text")).toBeInTheDocument();
    expect(screen.getByText(/Not checked \(add your percentile\): VARC, DILR, QA/)).toBeInTheDocument();
    expect(screen.getByText("Want help deciding where to apply?")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pc:mbaEligibilityInput") || "null")).toMatchObject({ overall: 96 });
  });
});
