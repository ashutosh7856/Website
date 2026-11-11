import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COLLEGES_SNAPSHOT, DEADLINES_SNAPSHOT } from "@/data/contentSnapshot";

/**
 * Site-wide checklist items, enforced at build time rather than by hand:
 *
 *   • no /college-details/ URL in the sitemap without college data behind it
 *   • no /admissions/deadlines/ URL without deadline data behind it
 *   • no invalid or non-canonical URLs in the sitemap
 *
 * A URL that ships in sitemap.xml with nothing behind it is exactly the soft
 * 404 the review asked us to remove.
 */

const ROOT = process.cwd();
const SITEMAP = resolve(ROOT, "public", "sitemap.xml");

const readSitemapUrls = (): string[] => {
  const xml = readFileSync(SITEMAP, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
};

// Sitemap <loc>s use the trailing-slash form Cloudflare serves; route ids don't.
const pathOf = (url: string) => {
  const path = new URL(url).pathname;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
};

describe("sitemap.xml", () => {
  const urls = readSitemapUrls();

  it("exists and is not empty", () => {
    expect(existsSync(SITEMAP)).toBe(true);
    expect(urls.length).toBeGreaterThan(0);
  });

  it("only lists canonical https://procounsel.co.in URLs", () => {
    for (const url of urls) {
      expect(url, `${url} is not a canonical absolute URL`).toMatch(
        /^https:\/\/procounsel\.co\.in(\/|$)/,
      );
    }
  });

  it("has no duplicate entries", () => {
    const seen = new Set<string>();
    const duplicates = urls.filter((u) => (seen.has(u) ? true : (seen.add(u), false)));
    expect(duplicates).toEqual([]);
  });

  // The slash form of each <loc> is pinned against the generator in
  // src/test/siteUrl.test.ts (every URL now ends in "/", the form Cloudflare
  // Pages serves with a 200). It is not asserted against this file because the
  // checked-in copy is only rewritten by `prebuild`, so it can lag a change to
  // the generator until the next build.

  it("lists no private, auth-only or utility routes", () => {
    // Pages behind a login have no content for a crawler and read as thin.
    const forbidden = [
      "/dashboard",
      "/student-dashboard",
      "/counselor-dashboard",
      "/my-activity",
      "/notifications",
      "/recharge-wallet",
      "/subscription",
      "/profile",
    ];
    const offenders = urls.filter((u) => forbidden.some((f) => pathOf(u).startsWith(f)));
    expect(offenders).toEqual([]);
  });
});

describe("every listed college URL has content behind it", () => {
  const collegeIds = readSitemapUrls()
    .map(pathOf)
    .filter((p) => p.startsWith("/college-details/"))
    .map((p) => decodeURIComponent(p.replace("/college-details/", "")));

  it("lists at least one college", () => {
    expect(collegeIds.length).toBeGreaterThan(0);
  });

  it("has a static snapshot file for each one", () => {
    const missing = collegeIds.filter(
      (id) => !existsSync(resolve(ROOT, "public", "data", "colleges", `${id}.json`)),
    );
    expect(missing, "these college pages would render 'College not found'").toEqual([]);
  });

  it("has a non-empty name and description for each one", () => {
    const broken = collegeIds.filter((id) => {
      const data = JSON.parse(
        readFileSync(resolve(ROOT, "public", "data", "colleges", `${id}.json`), "utf8"),
      );
      const info = (data.collegeInfo ?? "").replace(/<[^>]*>/g, "").trim();
      return !data.collegeName?.trim() || info.length < 40;
    });
    expect(broken, "these college pages would be thin content").toEqual([]);
  });

  it("is covered by the in-bundle snapshot too, so tabs render during prerender", () => {
    const seeded = new Set(COLLEGES_SNAPSHOT.map((c) => c.collegeId));
    const missing = collegeIds.filter((id) => !seeded.has(id));
    expect(missing).toEqual([]);
  });
});

describe("every listed deadline URL has content behind it", () => {
  const deadlineIds = readSitemapUrls()
    .map(pathOf)
    .filter((p) => p.startsWith("/admissions/deadlines/") && p !== "/admissions/deadlines")
    .map((p) => decodeURIComponent(p.replace("/admissions/deadlines/", "")));

  it("lists at least one deadline", () => {
    expect(deadlineIds.length).toBeGreaterThan(0);
  });

  it("has a static snapshot file for each one", () => {
    const missing = deadlineIds.filter(
      (id) => !existsSync(resolve(ROOT, "public", "data", "deadlines", `${id}.json`)),
    );
    expect(missing, "these pages would render 'Could not load this deadline'").toEqual([]);
  });

  it("has a title and description for each one", () => {
    const broken = deadlineIds.filter((id) => {
      const data = JSON.parse(
        readFileSync(resolve(ROOT, "public", "data", "deadlines", `${id}.json`), "utf8"),
      );
      return !data.title?.trim() || !data.description?.trim();
    });
    expect(broken).toEqual([]);
  });

  it("lists no deleted deadlines", () => {
    const deleted = deadlineIds.filter((id) => {
      const snapshot = DEADLINES_SNAPSHOT.find((d) => d.id === id);
      return snapshot?.isDeleted === true;
    });
    expect(deleted).toEqual([]);
  });
});
