import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  COUNSELLING_CATEGORIES,
  type CounsellingCategory,
} from "@/lib/counsellingCategories";
import CounsellingCategoryPage from "@/pages/counselling/CounsellingCategoryPage";

/**
 * The category pages are the site's commercial-intent entry points, and their
 * SEO is entirely data-driven off COUNSELLING_CATEGORIES — canonical, title,
 * description, keywords, H1 and the FAQPage schema all read from the record.
 *
 * That is convenient right up until someone edits the copy and silently breaks
 * the head. These tests pin the contract: every category carries real content
 * (not a draft stub), no two pages share an H1/title/description, and a page
 * actually renders one H1, the right canonical, and its FAQs into the DOM.
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

describe("counselling category pages — content is real, not a stub", () => {
  it.each(COUNSELLING_CATEGORIES.map((c) => [c.slug, c] as const))(
    "/%s carries full-length copy",
    (_slug, c) => {
      expect(c.sections.length).toBeGreaterThanOrEqual(8);
      expect(c.faqs.length).toBeGreaterThanOrEqual(8);
      // ~1,700+ words is the floor the finished pages sit at; a draft stub is
      // an order of magnitude shorter and would trip this.
      expect(bodyText(c).split(/\s+/).filter(Boolean).length).toBeGreaterThan(1200);
    },
  );

  it.each(COUNSELLING_CATEGORIES.map((c) => [c.slug, c] as const))(
    "/%s has a head that fits in a SERP",
    (_slug, c) => {
      expect(c.title.length).toBeLessThanOrEqual(65);
      expect(c.description.length).toBeGreaterThanOrEqual(110);
      expect(c.description.length).toBeLessThanOrEqual(175);
      expect(c.title).toContain("ProCounsel");
    },
  );

  it.each(COUNSELLING_CATEGORIES.map((c) => [c.slug, c] as const))(
    "/%s keeps its keyword list clean",
    (_slug, c) => {
      expect(c.supportKeywords.length).toBeGreaterThan(0);
      // Lowercase and de-duplicated — these go straight into <meta keywords>.
      for (const k of c.supportKeywords) expect(k).toBe(k.toLowerCase());
      expect(new Set(c.supportKeywords).size).toBe(c.supportKeywords.length);
    },
  );

  it.each(COUNSELLING_CATEGORIES.map((c) => [c.slug, c] as const))(
    "/%s never repeats its H1 verbatim as a section heading",
    (_slug, c) => {
      const h1 = c.h1.trim().toLowerCase();
      for (const s of c.sections) {
        expect(s.heading?.trim().toLowerCase()).not.toBe(h1);
      }
    },
  );

  it("gives every category a distinct H1, title and description", () => {
    for (const field of ["h1", "title", "description"] as const) {
      const values = COUNSELLING_CATEGORIES.map((c) => c[field]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("gives every category a distinct slug", () => {
    const slugs = COUNSELLING_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("counselling category pages — rendered head and DOM", () => {
  const renderCategory = (slug: string) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <HelmetProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[`/${slug}`]}>
            <Routes>
              {/* Routed exactly as AppRoutes does it: one route per known slug,
                  with the slug handed in as a prop rather than a catch-all. */}
              <Route path={`/${slug}`} element={<CounsellingCategoryPage slug={slug} />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  const head = (selector: string) =>
    Array.from(document.head.querySelectorAll(selector));

  // The two pages that just took the SEO team's copy.
  const TARGETS = ["mba-counselling", "law-counselling"] as const;

  it.each(TARGETS)("/%s renders exactly one H1, and it is the category H1", async (slug) => {
    const category = COUNSELLING_CATEGORIES.find((c) => c.slug === slug)!;
    renderCategory(slug);
    await waitFor(() => {
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent?.trim()).toBe(category.h1);
    });
  });

  it.each(TARGETS)("/%s self-canonicalises and stays indexable", async (slug) => {
    const category = COUNSELLING_CATEGORIES.find((c) => c.slug === slug)!;
    renderCategory(slug);
    await waitFor(() => {
      const canonical = head('link[rel="canonical"]');
      expect(canonical).toHaveLength(1);
      expect(canonical[0].getAttribute("href")).toBe(`${SITE}/${slug}/`);

      const robots = head('meta[name="robots"]')[0]?.getAttribute("content") ?? "";
      expect(robots).toContain("index,follow");
      expect(robots).not.toContain("noindex");

      expect(head('meta[name="description"]')[0]?.getAttribute("content")).toBe(
        category.description,
      );
      // Every keyword the SEO brief specified must ship, case-insensitively:
      // the head keyword covers its own lowercase twin ("MBA Counselling"
      // covers "mba counselling").
      const keywords = head('meta[name="keywords"]')[0]?.getAttribute("content") ?? "";
      const emitted = keywords.split(",").map((k) => k.trim().toLowerCase());
      for (const k of category.supportKeywords) {
        expect(emitted).toContain(k.toLowerCase());
      }
      // And each exactly once — emitting "Law Counselling, law counselling"
      // reads as stuffing.
      expect(new Set(emitted).size).toBe(emitted.length);
    });
  });

  it.each(TARGETS)("/%s emits FAQPage schema for every FAQ on the page", async (slug) => {
    const category = COUNSELLING_CATEGORIES.find((c) => c.slug === slug)!;
    renderCategory(slug);
    await waitFor(() => {
      // React 19 hoists <title>/<meta>/<link> into <head> but not inline
      // <script>, so the JSON-LD renders in the body. That is valid — Google
      // reads ld+json anywhere in the document — so query the whole document.
      const blocks = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).map((el) => JSON.parse(el.textContent ?? "null"));
      const graph = blocks.flatMap((b) => (Array.isArray(b) ? b : [b]));

      const faqPage = graph.find((n) => n?.["@type"] === "FAQPage");
      expect(faqPage).toBeTruthy();
      // Questions must reach the schema verbatim, or the rich result drops.
      expect(faqPage.mainEntity.map((q: { name: string }) => q.name)).toEqual(
        category.faqs.map((f) => f.question),
      );

      // The other two blocks the page promises search engines.
      expect(graph.find((n) => n?.["@type"] === "Service")).toBeTruthy();
      const crumbs = graph.find((n) => n?.["@type"] === "BreadcrumbList");
      expect(crumbs.itemListElement.at(-1).item).toBe(`${SITE}/${slug}/`);
    });
  });

  it.each(TARGETS)(
    "/%s puts every section heading and FAQ answer in the DOM, collapsed or not",
    async (slug) => {
      const category = COUNSELLING_CATEGORIES.find((c) => c.slug === slug)!;
      renderCategory(slug);
      await waitFor(() => {
        const text = document.body.textContent ?? "";
        for (const section of category.sections) {
          if (section.heading) expect(text).toContain(section.heading);
        }
        for (const faq of category.faqs) expect(text).toContain(faq.question);
      });
    },
  );
});
