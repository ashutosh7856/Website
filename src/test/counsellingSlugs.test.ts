import { describe, it, expect } from "vitest";
import {
  COUNSELLING_CATEGORY_SLUGS,
  COUNSELLING_EXAM_SLUGS,
} from "@/lib/counsellingSlugs";
import { COUNSELLING_CATEGORIES } from "@/lib/counsellingCategories";
import { COUNSELLING_EXAMS } from "@/lib/counsellingExams";
import {
  COUNSELLING_CATEGORY_SLUGS as ROUTE_CATEGORY_SLUGS,
  COUNSELLING_EXAM_SLUGS as ROUTE_EXAM_SLUGS,
} from "../../scripts/site-routes.mjs";

/**
 * Three copies of the same thirteen slugs, pinned together.
 *
 * `lib/counsellingSlugs.ts` exists so AppRoutes can register a route per page
 * without importing 166 KB of page copy into the eager entry chunk — deriving
 * the slugs from the data is what dragged the data along. `site-routes.mjs`
 * holds a third copy because a build script cannot import a `.ts` module.
 *
 * Duplication is the deliberate trade; this test is the other half of it.
 * Without it a new exam page 404s in the SPA (no route) or goes unprerendered
 * (no sitemap entry), and both fail silently — the page simply never ranks.
 */
describe("counselling slugs", () => {
  it("matches the category page data", () => {
    expect([...COUNSELLING_CATEGORY_SLUGS]).toEqual(
      COUNSELLING_CATEGORIES.map((c) => c.slug),
    );
  });

  it("matches the exam page data", () => {
    expect([...COUNSELLING_EXAM_SLUGS]).toEqual(COUNSELLING_EXAMS.map((e) => e.slug));
  });

  it("matches what the sitemap and prerender build from", () => {
    expect([...COUNSELLING_CATEGORY_SLUGS]).toEqual(ROUTE_CATEGORY_SLUGS);
    expect([...COUNSELLING_EXAM_SLUGS]).toEqual(ROUTE_EXAM_SLUGS);
  });
});
