import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RevampBannerSection from "@/components/Revamp/banners/RevampBannerSection";
import { homeFaqs } from "@/components/SEO/homeSeoContent";

function hrefs() {
  return Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
}

describe("home page", () => {
  it("no longer promotes the option-form service in the partner carousel", () => {
    render(
      <MemoryRouter>
        <RevampBannerSection />
      </MemoryRouter>,
    );
    expect(hrefs()).not.toContain("/mhtcet-option-form-filling");
    expect(screen.queryByText(/option form/i)).not.toBeInTheDocument();
    expect(hrefs()).toContain("/mettle");
  });

  it("puts MBA admissions in the hero card the option-form card used to hold", () => {
    // The hero is the original design; only that one card changed.
    const source = readFileSync(resolve(__dirname, "../pages/Revamp/Admissions.tsx"), "utf8");
    expect(source).toContain("navigate('/mba-admission-2027')");
    expect(source).toContain("MBA Admissions");
    expect(source).not.toContain("/mhtcet-option-form-filling");
  });

  it("leads the partner carousel with the CAT college predictor", () => {
    render(
      <MemoryRouter>
        <RevampBannerSection />
      </MemoryRouter>,
    );
    expect(hrefs()[0]).toBe("/cat-college-predictor");
    expect(hrefs()).toContain("/free-cat-mock-test");
    // NEET predictors are demoted, not removed.
    expect(hrefs().indexOf("/neet-college-predictor")).toBeGreaterThan(hrefs().indexOf("/mettle"));
  });

  it("puts the CAT predictor in the hero card the NEET predictor used to hold", () => {
    const source = readFileSync(resolve(__dirname, "../pages/Revamp/Admissions.tsx"), "utf8");
    expect(source).toContain("navigate('/cat-college-predictor')");
    expect(source).toContain("CAT Predictor");
    expect(source).toContain('to="/free-cat-mock-test"');
    expect(source).toContain('to="/cat-previous-year-papers"');
    expect(source).not.toContain("/neet-college-predictor");
  });

  it("states the no-login predictor policy in the FAQ", () => {
    const faq = homeFaqs.find((f) => /log in/i.test(f.question));
    expect(faq?.answer).toMatch(/without logging in/i);
  });
});
