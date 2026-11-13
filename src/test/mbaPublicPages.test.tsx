import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import MbaAdmissionGuide from "@/pages/mba-public/MbaAdmissionGuide";
import CatExamPattern from "@/pages/mba-public/CatExamPattern";
import CatEligibilityTool from "@/pages/mba-public/CatEligibilityTool";
import CatScoreCalculator from "@/pages/mba-public/CatScoreCalculator";
import FreeCatMockTest from "@/pages/mba-public/FreeCatMockTest";
import CatPreviousYearPapers from "@/pages/mba-public/CatPreviousYearPapers";
import IimCutoffs from "@/pages/mba-public/IimCutoffs";
import MbaCollegeSlug from "@/pages/mba-public/MbaCollegeSlug";
import MbaCollegesHub from "@/pages/mba-public/MbaCollegesHub";
import MbaCollegesInCity from "@/pages/mba-public/MbaCollegesInCity";
import EntranceExamsHub from "@/pages/mba-public/EntranceExamsHub";
import ExamPage from "@/pages/mba-public/ExamPage";
import SpecialisationsHub from "@/pages/mba-public/SpecialisationsHub";
import SpecialisationPage from "@/pages/mba-public/SpecialisationPage";
import MbaFeesPlacements from "@/pages/mba-public/MbaFeesPlacements";
import MbaGuidePage from "@/pages/mba-public/MbaGuidePage";
import MbaResourcesHub from "@/pages/mba-public/MbaResourcesHub";
import MbaCompare from "@/pages/mba-public/MbaCompare";
import MbaRoiCalculator from "@/pages/mba-public/MbaRoiCalculator";
import MbaDeadlines from "@/pages/mba-public/MbaDeadlines";
import MbaEligibility from "@/pages/mba-public/MbaEligibility";
import MbaCourses from "@/pages/mba-public/MbaCourses";
import SeoFooterLinks from "@/components/layout/SeoFooterLinks";
import { MBA_GUIDES } from "@/content/mbaGuides";
import { MBA_SPECIALISATION_CONTENT } from "@/content/mbaSpecialisations";
import { PUBLISHED_MBA_ROUTES } from "@/lib/mbaPublic";
import { COUNSELLING_CATEGORIES } from "@/lib/counsellingCategories";
import {
  MBA_GUIDE_PATHS,
  MBA_PATHS,
  MBA_SPECIALISATIONS,
  bandCount,
  mbaPublishedRoutes,
  percentilePath,
} from "@/lib/mbaRoutes.mjs";
import { STATIC_ROUTES } from "../../scripts/site-routes.mjs";
import ROUTES_JSON from "../../scripts/mba-routes.json";

/**
 * The public MBA pages (docs/MBA-SEO-BLUEPRINT.md) render entirely from the
 * bundled snapshot — the API is blocked during the prerender — and a URL exists
 * only when the data behind it does. These tests render every published route
 * through the same paths AppRoutes registers, and check the build's route list,
 * the gating, each page's SEO contract and the internal-link graph that makes
 * every page crawlable.
 */

vi.mock("@/components/leads/QuickLeadForm", () => ({ default: () => <div data-testid="quick-lead-form" /> }));

/** The MBA routes exactly as src/routes/AppRoutes.tsx registers them. */
function MbaRoutes() {
  return (
    <Routes>
      <Route path="/mba" element={<Navigate to="/mba-admission-2027" replace />} />
      <Route path="/mba-admission-2027" element={<MbaAdmissionGuide />} />
      <Route path="/cat-college-predictor" element={<CatEligibilityTool />} />
      <Route path="/cat-score-calculator" element={<CatScoreCalculator />} />
      <Route path="/free-cat-mock-test" element={<FreeCatMockTest />} />
      <Route path="/cat-previous-year-papers" element={<CatPreviousYearPapers />} />
      <Route path="/mba-colleges" element={<MbaCollegesHub />} />
      <Route path="/mba-colleges/iim-cutoffs" element={<IimCutoffs />} />
      <Route path="/mba-colleges/compare" element={<MbaCompare />} />
      <Route path="/mba-colleges/:slug" element={<MbaCollegeSlug />} />
      <Route path="/mba-colleges-in/:city" element={<MbaCollegesInCity />} />
      <Route path="/mba-entrance-exams" element={<EntranceExamsHub />} />
      <Route path="/mba-entrance-exams/cat" element={<CatExamPattern />} />
      <Route path="/mba-entrance-exams/:exam" element={<ExamPage />} />
      <Route path="/mba-specialisations" element={<SpecialisationsHub />} />
      <Route path="/mba-specialisations/:spec" element={<SpecialisationPage />} />
      <Route path="/mba-fees" element={<MbaFeesPlacements mode="fees" />} />
      <Route path="/mba-placements" element={<MbaFeesPlacements mode="placements" />} />
      <Route path="/mba-resources" element={<MbaResourcesHub />} />
      <Route path="/mba-resources/:guide" element={<MbaGuidePage />} />
      <Route path="/mba-without-cat" element={<MbaGuidePage />} />
      <Route path="/mba-fees-roi-calculator" element={<MbaRoiCalculator />} />
      <Route path="/mba-admission-deadlines" element={<MbaDeadlines />} />
      <Route path="/mba-eligibility" element={<MbaEligibility />} />
      <Route path="/mba-courses" element={<MbaCourses />} />
      <Route path="*" element={<div data-testid="elsewhere">elsewhere</div>} />
    </Routes>
  );
}

function renderAt(path: string) {
  const client = new QueryClient();
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <MbaRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");
const hrefs = () => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") ?? "");
const ldTypes = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((n) => JSON.parse(n.textContent || "null")?.["@type"]);

const PUBLISHED = mbaPublishedRoutes(MBA_SNAPSHOT);

describe("MBA route list", () => {
  it("the build's route list is exactly what the bundled snapshot can render", () => {
    expect(ROUTES_JSON).toEqual(PUBLISHED);
    expect([...PUBLISHED_MBA_ROUTES]).toEqual(PUBLISHED);
  });

  it("every published MBA route is prerendered (STATIC_ROUTES), and none of the retired URLs are", () => {
    for (const r of PUBLISHED) expect(STATIC_ROUTES).toContain(r);
    for (const old of ["/mba", "/cat-exam-pattern", "/cat-percentile-iim-eligibility", "/iim-cutoffs"]) {
      expect(STATIC_ROUTES).not.toContain(old);
    }
    expect(STATIC_ROUTES.some((r) => r.startsWith("/mba-colleges/iim/"))).toBe(false);
  });

  it("Phase 1 pages are live with today's data", () => {
    for (const r of [
      "/mba-admission-2027",
      "/mba-colleges",
      "/mba-colleges/iim-cutoffs",
      "/mba-entrance-exams/cat",
      "/mba-without-cat",
      "/mba-fees",
      "/mba-resources/mba-vs-pgdm",
      "/mba-resources/how-to-choose-mba-college",
      "/cat-college-predictor",
      ...[99, 95, 90, 80].map(percentilePath),
      ...MBA_SNAPSHOT.institutes.map((i) => `/mba-colleges/${i.slug}`),
    ]) {
      expect(PUBLISHED).toContain(r);
    }
  });

  it("the MBA tools and planning pages are live: compare, ROI calculator, deadlines, eligibility, courses", () => {
    for (const r of [
      MBA_PATHS.compare,
      MBA_PATHS.roiCalculator,
      MBA_PATHS.deadlines,
      MBA_PATHS.eligibility,
      MBA_PATHS.courses,
    ]) {
      expect(PUBLISHED).toContain(r);
      expect(STATIC_ROUTES).toContain(r);
    }
  });

  it("Tezpur University's unit-less 'cut-off marks' never reach a CAT band", () => {
    expect(MBA_SNAPSHOT.catCutoffs.map((c) => c.slug)).not.toContain("tezpur-university");
  });

  it("a percentile band is published only with at least five institutes in it", () => {
    for (const p of [99, 95, 90, 85, 80, 70, 60]) {
      expect(PUBLISHED.includes(percentilePath(p))).toBe(bandCount(MBA_SNAPSHOT, p) >= 5);
    }
  });

  it("guides and specialisations are pinned to the copy that exists", () => {
    expect(MBA_GUIDES.map((g) => g.path)).toEqual(MBA_GUIDE_PATHS);
    for (const s of MBA_SPECIALISATIONS) expect(MBA_SPECIALISATION_CONTENT.map((c) => c.slug)).toContain(s.slug);
  });
});

describe("gating: no page without data", () => {
  it.each([
    ["/mba-colleges/not-a-college"],
    ["/mba-colleges/mba-colleges-at-60-percentile"],
    ["/mba-colleges-in/atlantis"],
    ["/mba-entrance-exams/not-an-exam"],
    ["/mba-specialisations/basket-weaving"],
    ["/mba-resources/not-a-guide"],
  ])("%s does not render a template — it sends the visitor up to a published page", async (path) => {
    renderAt(path);
    await waitFor(() => expect(canonical()).toBeTruthy());
    const landed = new URL(canonical()!).pathname.replace(/\/$/, "");
    expect(landed).not.toBe(path);
    expect(PUBLISHED).toContain(landed);
    cleanup();
  });

  it("a non-IIM institute left out of the snapshot (BIMM Pune: no verified figures) has no page", () => {
    expect(PUBLISHED).not.toContain("/mba-colleges/bimm-pune");
  });

  it("the bare /mba goes to the MBA Admission Guide", () => {
    renderAt("/mba");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("MBA Admission 2027");
  });
});

describe.each(PUBLISHED.map((r) => [r] as const))("%s", (route) => {
  it("renders from the snapshot with one H1, a byline, a self-canonical, breadcrumbs and the conversion block", async () => {
    const get = vi.spyOn(procounselApi, "get");
    renderAt(route);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(/Reviewed by ProCounsel counselling team/)).toBeInTheDocument();
    expect(screen.getAllByTestId("quick-lead-form").length).toBeGreaterThan(0);
    const links = hrefs();
    expect(links).toContain(MBA_PATHS.counselling);
    if (route !== MBA_PATHS.predictor) expect(links).toContain(MBA_PATHS.predictor);
    await waitFor(() => expect(canonical()).toBe(`https://procounsel.co.in${route}/`));
    // A head that fits a SERP: title ≤ 60 characters with the brand, description ≤ 155.
    expect(document.title.length, document.title).toBeLessThanOrEqual(60);
    const description = document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    expect(description.length, description).toBeLessThanOrEqual(155);
    expect(ldTypes()).toContain("BreadcrumbList");
    // FAQPage only where FAQs are visible.
    if (ldTypes().includes("FAQPage")) expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
    cleanup();
  });
});

describe("MBA tools", () => {
  it("the compare page prerenders a real example comparison with sourced cells", () => {
    renderAt(MBA_PATHS.compare);
    expect(screen.getByRole("heading", { level: 2, name: /How do IIM Ahmedabad, IIM Bangalore, IIM Calcutta compare\?/ })).toBeInTheDocument();
    expect(screen.getAllByText(/a year \(\d{4}\)/).length).toBeGreaterThan(0);
    expect(hrefs().some((h) => h.startsWith("https://wa.me/"))).toBe(true);
  });

  it("a college profile links to the comparison", () => {
    renderAt("/mba-colleges/fms-delhi");
    expect(hrefs().some((h) => h.startsWith("/mba-colleges/compare?c=fms-delhi"))).toBe(true);
  });

  it("the deadline tracker shows only sourced rows, each with an official/tentative flag", () => {
    renderAt(MBA_PATHS.deadlines);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.textContent).toMatch(/Official/);
      expect(row.querySelector('a[href^="http"]')).not.toBeNull();
    }
  });
});

describe("structured data", () => {
  it("an institute page describes the institute (EducationalOrganization with its own site), never ProCounsel", async () => {
    const inst = MBA_SNAPSHOT.institutes.find((i) => i.slug === "iim-ahmedabad")!;
    renderAt(`/mba-colleges/${inst.slug}`);
    await waitFor(() => expect(ldTypes()).toContain("EducationalOrganization"));
    const org = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((n) => JSON.parse(n.textContent || "null"))
      .find((n) => n?.["@type"] === "EducationalOrganization");
    expect(org.name).toBe(inst.name);
    expect(org.sameAs).toEqual([inst.website]);
    expect(JSON.stringify(org)).not.toMatch(/procounsel/i);
    // Every source used on the page is linked.
    const links = hrefs();
    for (const s of inst.sources) expect(links).toContain(s.url);
  });

  it("guides carry Article schema with the organisation as author", async () => {
    renderAt("/mba-resources/mba-vs-pgdm");
    await waitFor(() => expect(ldTypes()).toContain("Article"));
    const article = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((n) => JSON.parse(n.textContent || "null"))
      .find((n) => n?.["@type"] === "Article");
    expect(article.author["@type"]).toBe("Organization");
  });

  it("percentile pages state the stage of every figure and that a minimum is not admission", () => {
    renderAt(percentilePath(90));
    expect(screen.getAllByText(/Minimum to apply|Shortlisting cut-off|Previous-year final cut-off/).length).toBeGreaterThan(0);
    expect(screen.getByText(/A published minimum or shortlisting figure is not admission/)).toBeInTheDocument();
    expect(screen.getByText(/Sectional minimums apply/)).toBeInTheDocument();
  });

  it("MAH-CET closing figures are always labelled as MAH-CET, not CAT", () => {
    renderAt("/mba-entrance-exams/mah-mba-cet");
    expect(screen.getAllByText(/MAH-MBA\/MMS CET percentiles, not CAT/).length).toBeGreaterThan(0);
  });
});

describe("crawlability: every published MBA URL has an inbound <a href> from another page", () => {
  it("is linked from some other MBA page, the site footer or the counselling pages", () => {
    const inbound = new Map<string, Set<string>>();
    const record = (from: string) => {
      for (const h of hrefs()) {
        const to = h.replace(/\/$/, "");
        if (to === from) continue;
        if (!inbound.has(to)) inbound.set(to, new Set());
        inbound.get(to)!.add(from);
      }
    };
    for (const route of PUBLISHED) {
      renderAt(route);
      record(route);
      cleanup();
    }
    render(
      <MemoryRouter>
        <SeoFooterLinks />
      </MemoryRouter>,
    );
    record("footer");
    cleanup();
    const counsellingLinks = COUNSELLING_CATEGORIES.flatMap((c) => c.tools.map((t) => t.to));
    const orphans = PUBLISHED.filter((r) => !inbound.has(r) && !counsellingLinks.includes(r));
    expect(orphans).toEqual([]);
  }, 120_000);
});
