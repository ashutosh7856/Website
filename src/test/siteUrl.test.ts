import { describe, expect, it } from "vitest";
import { SITE_ORIGIN, absoluteUrl, canonicalPath, stripTrailingSlash } from "@/lib/siteUrl.mjs";
import { STATIC_ROUTES, buildSitemapXml } from "../../scripts/site-routes.mjs";

/**
 * Cloudflare Pages serves prerendered routes from dist/<route>/index.html and
 * answers the bare form (/cat-counselling) with a 308 to /cat-counselling/.
 * Every absolute URL we publish — canonical, og:url, JSON-LD, sitemap — must be
 * the trailing-slash form, or each one points Google at a redirect.
 */
describe("siteUrl", () => {
  it("keeps the root as https://procounsel.co.in/", () => {
    expect(SITE_ORIGIN).toBe("https://procounsel.co.in");
    expect(absoluteUrl("/")).toBe("https://procounsel.co.in/");
    expect(absoluteUrl("")).toBe("https://procounsel.co.in/");
    expect(absoluteUrl()).toBe("https://procounsel.co.in/");
  });

  it("adds exactly one trailing slash to page paths", () => {
    expect(absoluteUrl("/cat-counselling")).toBe("https://procounsel.co.in/cat-counselling/");
    expect(absoluteUrl("/cat-counselling/")).toBe("https://procounsel.co.in/cat-counselling/");
    expect(absoluteUrl("cat-counselling")).toBe("https://procounsel.co.in/cat-counselling/");
    expect(absoluteUrl("/admissions/blogs/slug/some-post")).toBe(
      "https://procounsel.co.in/admissions/blogs/slug/some-post/",
    );
  });

  it("drops query strings and fragments", () => {
    expect(canonicalPath("/jee-counselling?utm_source=google#faq")).toBe("/jee-counselling/");
    expect(canonicalPath("/?q=1")).toBe("/");
  });

  it("collapses duplicate slashes", () => {
    expect(canonicalPath("//admissions///blogs")).toBe("/admissions/blogs/");
  });

  it("normalises absolute same-site URLs, including www", () => {
    expect(absoluteUrl("https://procounsel.co.in/colleges")).toBe("https://procounsel.co.in/colleges/");
    expect(absoluteUrl("https://www.procounsel.co.in/colleges/")).toBe("https://procounsel.co.in/colleges/");
    expect(absoluteUrl("https://procounsel.co.in")).toBe("https://procounsel.co.in/");
  });

  it("leaves file paths alone", () => {
    expect(absoluteUrl("/sitemap.xml")).toBe("https://procounsel.co.in/sitemap.xml");
    expect(absoluteUrl("/og-image.png")).toBe("https://procounsel.co.in/og-image.png");
    expect(absoluteUrl("/favicon.png")).toBe("https://procounsel.co.in/favicon.png");
  });

  it("does not mistake dotted slugs for files", () => {
    expect(canonicalPath("/college-details/ST.XAVIERS")).toBe("/college-details/ST.XAVIERS/");
  });

  it("accepts an origin override (SITE_URL for staging sitemaps)", () => {
    expect(absoluteUrl("/about", "https://preview.example.dev/")).toBe("https://preview.example.dev/about/");
  });

  it("strips trailing slashes for slash-insensitive comparison", () => {
    expect(stripTrailingSlash("/cat-counselling/")).toBe("/cat-counselling");
    expect(stripTrailingSlash("/cat-counselling")).toBe("/cat-counselling");
    expect(stripTrailingSlash("/")).toBe("/");
  });
});

describe("sitemap generation", () => {
  const locs = [...buildSitemapXml(STATIC_ROUTES).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("emits every route in its trailing-slash form", () => {
    expect(locs.length).toBe(STATIC_ROUTES.length);
    for (const loc of locs) {
      expect(new URL(loc).pathname.endsWith("/"), `${loc} would 308`).toBe(true);
      expect(loc).toBe(absoluteUrl(loc));
    }
  });

  it("emits the root exactly once as https://procounsel.co.in/", () => {
    expect(locs.filter((l) => l === "https://procounsel.co.in/")).toHaveLength(1);
  });
});
