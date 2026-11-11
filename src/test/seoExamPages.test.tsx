import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { COUNSELLING_CATEGORIES, type CounsellingCategory } from "@/lib/counsellingCategories";
import {
  COUNSELLING_EXAMS,
  COUNSELLING_EXAM_SLUGS,
  CATEGORY_FOR_EXAM,
  EXAMS_BY_CATEGORY,
  relatedPages,
} from "@/lib/counsellingExams";
import CounsellingCategoryPage from "@/pages/counselling/CounsellingCategoryPage";

/**
 * The exam counselling pages (`/jee-counselling`, `/cat-counselling`, …).
 *
 * They reuse the category page's component and data shape, so they inherit its
 * whole SEO contract: canonical, title, description, H1 and FAQPage schema all
 * read from the record. These pin the same guarantees, plus the two that are
 * specific to this tier — every exam page must be reachable from a real anchor
 * on its parent category page (the build's crawlability gate depends on it),
 * and no exam page may duplicate a category page's slug or H1.
 */

const SITE = "https://procounsel.co.in";

const bodyText = (c: CounsellingCategory) =>
  [
    c.intro,
    ...c.sections.flatMap((s) => [
      s.heading,
      s.subheading,
      ...(s.paragraphs ?? []),
      ...(s.bullets ?? []),
    ]),
    ...c.faqs.flatMap((f) => [f.question, f.answer]),
  ]
    .filter(Boolean)
    .join(" ");

describe("exam counselling pages — content is real, not a stub", () => {
  it("covers every exam the brief asked for", () => {
    expect(COUNSELLING_EXAM_SLUGS).toEqual([
      "mht-cet-counselling",
      "comedk-counselling",
      "jee-counselling",
      "wbjee-counselling",
      "srmjeee-counselling",
      "met-counselling",
      "cat-counselling",
      "xat-counselling",
    ]);
  });

  it.each(COUNSELLING_EXAMS.map((c) => [c.slug, c] as const))(
    "/%s carries full-length copy",
    (_slug, c) => {
      expect(c.sections.length).toBeGreaterThanOrEqual(8);
      expect(c.faqs.length).toBeGreaterThanOrEqual(7);
      // These pages exist precisely because a paragraph inside a category page
      // would be thin. The prerendered HTML sits at 1,600-2,000 words; a stub
      // is an order of magnitude shorter and trips this.
      expect(bodyText(c).split(/\s+/).filter(Boolean).length).toBeGreaterThan(1000);
    },
  );

  it.each(COUNSELLING_EXAMS.map((c) => [c.slug, c] as const))(
    "/%s has a usable head",
    (_slug, c) => {
      /*
       * 80, not the 65 the category pages hold to.
       *
       * These titles are the SEO team's own, supplied verbatim, and every one
       * of them runs past 65 characters. Google truncates the visible title at
       * roughly 55-60 anyway, so the front of the string is what matters and
       * each of these leads with its exam name and "Counselling 2026". The cap
       * is here to catch a runaway title, not to relitigate the copy.
       */
      expect(c.title.length).toBeLessThanOrEqual(80);
      expect(c.title).toContain("ProCounsel");
      expect(c.description.length).toBeGreaterThanOrEqual(110);
      expect(c.description.length).toBeLessThanOrEqual(185);
    },
  );

  it.each(COUNSELLING_EXAMS.map((c) => [c.slug, c] as const))(
    "/%s keeps a clean, non-empty keyword list",
    (_slug, c) => {
      expect(c.supportKeywords.length).toBeGreaterThan(0);
      expect(new Set(c.supportKeywords).size).toBe(c.supportKeywords.length);
    },
  );

  it.each(COUNSELLING_EXAMS.map((c) => [c.slug, c] as const))(
    "/%s covers its own head keyword in the body copy",
    (_slug, c) => {
      // A page about MHT CET that never says "MHT CET" outside the title is a
      // template, not an answer.
      const head = c.name.replace(/ Counselling$/, "").toLowerCase();
      expect(bodyText(c).toLowerCase()).toContain(head);
    },
  );

  it.each(COUNSELLING_EXAMS.map((c) => [c.slug, c] as const))(
    "/%s never repeats its H1 verbatim as a section heading",
    (_slug, c) => {
      const h1 = c.h1.trim().toLowerCase();
      for (const s of c.sections) expect(s.heading?.trim().toLowerCase()).not.toBe(h1);
    },
  );

  it("keeps every H1, title, description and slug distinct across both tiers", () => {
    const all = [...COUNSELLING_CATEGORIES, ...COUNSELLING_EXAMS];
    for (const field of ["h1", "title", "description", "slug"] as const) {
      const values = all.map((c) => c[field]);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe("exam pages are reachable and correctly parented", () => {
  it("puts every exam page under exactly one category", () => {
    for (const slug of COUNSELLING_EXAM_SLUGS) {
      expect(CATEGORY_FOR_EXAM[slug], `${slug} has no parent`).toBeTruthy();
    }
  });

  it("only parents exams to categories that exist", () => {
    const known = new Set(COUNSELLING_CATEGORIES.map((c) => c.slug));
    for (const parent of Object.keys(EXAMS_BY_CATEGORY)) expect(known.has(parent)).toBe(true);
  });

  it("links every exam page from its category page", () => {
    // The build gate requires a real <a href> for every sitemap URL, and these
    // links are the only ones the exam pages get.
    const linked = new Set(
      Object.keys(EXAMS_BY_CATEGORY).flatMap((c) => relatedPages(c).map((r) => r.to)),
    );
    for (const slug of COUNSELLING_EXAM_SLUGS) {
      expect(linked.has(`/${slug}`), `${slug} is orphaned`).toBe(true);
    }
  });

  it("links an exam page to its siblings but never to itself", () => {
    for (const slug of COUNSELLING_EXAM_SLUGS) {
      const tos = relatedPages(slug).map((r) => r.to);
      expect(tos).not.toContain(`/${slug}`);
    }
  });
});

describe("exam counselling pages — rendered head and DOM", () => {
  const renderExam = (slug: string) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <HelmetProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[`/${slug}`]}>
            <Routes>
              <Route path={`/${slug}`} element={<CounsellingCategoryPage slug={slug} />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  const head = (selector: string) => Array.from(document.head.querySelectorAll(selector));

  // One from each tier of complexity: a state CAP process and an MBA page.
  const TARGETS = ["mht-cet-counselling", "cat-counselling"] as const;

  it.each(TARGETS)("/%s renders exactly one H1, and it is the page H1", async (slug) => {
    const page = COUNSELLING_EXAMS.find((c) => c.slug === slug)!;
    renderExam(slug);
    await waitFor(() => {
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent?.trim()).toBe(page.h1);
    });
  });

  it.each(TARGETS)("/%s self-canonicalises and stays indexable", async (slug) => {
    renderExam(slug);
    await waitFor(() => {
      const canonical = head('link[rel="canonical"]');
      expect(canonical).toHaveLength(1);
      expect(canonical[0].getAttribute("href")).toBe(`${SITE}/${slug}/`);

      const robots = head('meta[name="robots"]')[0]?.getAttribute("content") ?? "";
      expect(robots).toContain("index,follow");
    });
  });

  it("renders the parent-category link, so the page is never a dead end", async () => {
    renderExam("jee-counselling");
    await waitFor(() => {
      const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
      expect(hrefs).toContain("/engineering-counselling");
    });
  });
});
