import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

export const SITE_URL = process.env.SITE_URL || "https://procounsel.co.in";

// Shared with the app (src/hooks/useCounselors.ts reads the same file) so the
// sitemap and each page's robots tag can never disagree about whether
// counsellor profiles are indexed. See src/config/seo.json for the reasoning.
const SEO_CONFIG = (() => {
  try {
    return JSON.parse(readFileSync(path.resolve(process.cwd(), "src/config/seo.json"), "utf8"));
  } catch {
    return { counsellorProfilesIndexable: true };
  }
})();

// Blog slug routes to PRERENDER — read from the build-time snapshot written by
// scripts/generate-blog-snapshot.mjs (which runs first in `prebuild`). This is
// what makes blog article pages prerender with real content; the sitemap fetches
// its own blog slugs dynamically. Empty/missing snapshot degrades gracefully.
const BLOG_SLUG_ROUTES = (() => {
  try {
    const slugs = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "scripts/blog-slugs.json"), "utf8"),
    );
    return Array.isArray(slugs) ? slugs.map((s) => `/admissions/blogs/slug/${s}`) : [];
  } catch {
    return [];
  }
})();

// Keep in sync with COUNSELLING_CITIES in src/lib/counsellingCities.ts.
// (This is a plain .mjs run by Node, which can't import the .ts source directly.)
const COUNSELLING_CITY_SLUGS = [
  "delhi", "mumbai", "bangalore", "pune", "hyderabad", "chennai", "kolkata",
  "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur", "indore", "bhopal",
  "patna", "chandigarh", "surat", "vadodara", "coimbatore", "kochi",
  "thiruvananthapuram", "visakhapatnam", "bhubaneswar", "guwahati", "dehradun",
  "ranchi", "raipur", "ludhiana",
];

// Exam counselling landing pages. Keep in sync with COUNSELLING_EXAMS in
// src/lib/counsellingExams.ts (plain .mjs, cannot import the .ts).
export const COUNSELLING_EXAM_SLUGS = [
  "mht-cet-counselling",
  "comedk-counselling",
  "jee-counselling",
  "wbjee-counselling",
  "srmjeee-counselling",
  "met-counselling",
  "cat-counselling",
  "xat-counselling",
];

// Category counselling landing pages. Keep in sync with COUNSELLING_CATEGORIES
// in src/lib/counsellingCategories.ts (plain .mjs, cannot import the .ts).
export const COUNSELLING_CATEGORY_SLUGS = [
  "engineering-counselling",
  "medical-counselling",
  "mba-counselling",
  "law-counselling",
  "career-counselling",
];

export const STATIC_ROUTES = [
  // Core pages — highest priority (target sitelinks)
  "/",
  ...COUNSELLING_CATEGORY_SLUGS.map((s) => `/${s}`),
  ...COUNSELLING_EXAM_SLUGS.map((s) => `/${s}`),
  "/admissions",
  "/colleges",
  "/pro-buddies",
  "/study-abroad",
  "/about",

  // Admissions sub-pages
  "/admissions/blogs",
  "/admissions/blog-authors",
  "/admissions/blog-authors/aswini-verma",
  "/admissions/blog-authors/ashutosh-kumar",
  "/admissions/blog-authors/kiran-kudke",
  "/admissions/blog-authors/ananya",
  ...BLOG_SLUG_ROUTES,
  "/admissions/deadlines",

  // ProBuddies sub-pages
  "/pro-buddies/listing",
  "/pro-buddies/college-listing",

  // Counsellors
  "/counsellor-listing",

  // Programmatic city counselling pages
  "/counselling",
  ...COUNSELLING_CITY_SLUGS.map((slug) => `/counselling/${slug}`),

  // Tools
  "/predictors",
  "/neet-rank-predictor",
  "/neet-college-predictor",
  "/neet-cutoffs",
  "/neet-counselling",
  "/mbbs-colleges",
  "/jee-rank-predictor",
  "/jee-college-predictor",
  "/mhtcet-college-predictor",

  // Paid services
  "/mhtcet-option-form-filling",
  "/mettle",

  // Legal / info pages
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cancellation-refund",
  "/shipping-exchange",
];

async function readApiBaseUrlFromEnvFiles() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env.example"),
  ];

  for (const filePath of candidates) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (!key || rest.length === 0) continue;
        const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
        if (key === "VITE_API_BASE_URL" && value) {
          return value;
        }
      }
    } catch {
      // Ignore missing env files.
    }
  }

  return "";
}

function parseListPayload(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (typeof json !== "object") return [];

  const candidateKeys = ["data", "blogs", "items", "content", "result", "payload"];
  for (const key of candidateKeys) {
    const value = json[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

export function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function encodeCounselorId(id) {
  if (!id) return "";
  const encoded = Buffer.from(id).toString("base64");
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function getApiBaseUrl() {
  return (
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    (await readApiBaseUrlFromEnvFiles())
  );
}

/**
 * Blog slugs for the SITEMAP — the exact same list the prerender uses.
 *
 * This used to re-derive slugs from /api/blogs/list, and that list carries no
 * `slug` field, so it fell back to slugifying the headline: "How to Start a
 * Career in Data Analytics" → how-to-start-a-career-in-data-analytics. The
 * snapshot meanwhile reads each blog's DETAIL endpoint, which does have a slug:
 * career-in-data-analytics.
 *
 * The sitemap therefore listed both — the real prerendered article AND a URL
 * the app cannot resolve, which served the homepage shell and rendered "not
 * found". Nine articles, eighteen submitted URLs, half of them soft 404s
 * carrying the homepage's title, description and canonical. That is the
 * duplicate/thin content an AdSense review sees.
 *
 * One source now: scripts/blog-slugs.json, written by generate-blog-snapshot
 * during prebuild. If a slug is not in there it was not prerendered, so it has
 * no business being in the sitemap either.
 */
export async function fetchBlogSlugs() {
  try {
    const slugs = JSON.parse(
      await fs.readFile(path.resolve(process.cwd(), "scripts/blog-slugs.json"), "utf8"),
    );
    if (!Array.isArray(slugs) || slugs.length === 0) {
      console.warn("[sitemap] blog-slugs.json is empty; no blog URLs will be listed.");
      return [];
    }
    return Array.from(new Set(slugs.filter((s) => typeof s === "string" && s.trim()).map(toSlug)));
  } catch (error) {
    console.warn("[sitemap] Could not read scripts/blog-slugs.json:", error.message);
    return [];
  }
}

export async function fetchCounsellorIds() {
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}/api/shared/getAllCounsellors`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      console.warn(`[sitemap] Could not fetch counsellors (${response.status}).`);
      return [];
    }
    const json = await response.json();
    const rows = parseListPayload(json);
    const ids = rows
      .map((item) => item?.counsellorId || item?.id || "")
      .filter(Boolean)
      .map(encodeCounselorId)
      .filter(Boolean);
    console.log(`[sitemap] Fetched ${ids.length} counsellor IDs.`);
    return Array.from(new Set(ids));
  } catch (error) {
    console.warn("[sitemap] Failed to fetch counsellors:", error);
    return [];
  }
}

export async function fetchCollegeIds() {
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}/api/featured_colleges/all`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      console.warn(`[sitemap] Could not fetch colleges (${response.status}).`);
      return [];
    }
    const json = await response.json();
    const rows = parseListPayload(json);
    const ids = rows
      .map((item) => item?.collegeId || item?.id || "")
      .filter(Boolean);
    console.log(`[sitemap] Fetched ${ids.length} college IDs.`);
    return Array.from(new Set(ids));
  } catch (error) {
    console.warn("[sitemap] Failed to fetch colleges:", error);
    return [];
  }
}

export async function fetchDeadlineIds() {
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}/api/shared/getAllEventDeadlines`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      console.warn(`[sitemap] Could not fetch deadlines (${response.status}).`);
      return [];
    }
    const json = await response.json();
    const rows = parseListPayload(json);
    // Most rows come back soft-deleted. Publishing those produced sitemap URLs
    // that rendered "Could not load this deadline" — soft 404s to a crawler.
    const ids = rows
      .filter((item) => !item?.isDeleted)
      .map((item) => item?.id || item?.eventId || "")
      .filter(Boolean);
    console.log(`[sitemap] Fetched ${ids.length} live deadline IDs (of ${rows.length} rows).`);
    return Array.from(new Set(ids));
  } catch (error) {
    console.warn("[sitemap] Failed to fetch deadlines:", error);
    return [];
  }
}

export async function fetchProBuddyIds() {
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    const url = new URL(`${apiBaseUrl.replace(/\/$/, "")}/api/shared/getAllProBuddies`);
    url.searchParams.set("sortBy", "rating");
    url.searchParams.set("sortOrder", "desc");
    url.searchParams.set("page", "0");
    url.searchParams.set("pageSize", "500");

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      console.warn(`[sitemap] Could not fetch pro buddies (${response.status}).`);
      return [];
    }
    const json = await response.json();
    const rows = parseListPayload(json);
    const ids = rows
      .map((item) => item?.proBuddyId || item?.id || "")
      .filter(Boolean);
    console.log(`[sitemap] Fetched ${ids.length} pro buddy IDs.`);
    return Array.from(new Set(ids));
  } catch (error) {
    console.warn("[sitemap] Failed to fetch pro buddies:", error);
    return [];
  }
}

// Written by scripts/generate-content-snapshot.mjs, which runs first in
// `prebuild`. It only ever lists colleges and *live* (non-deleted) deadlines,
// so it doubles as the fallback when the API is unreachable at build time.
function readContentIndex() {
  try {
    return JSON.parse(
      readFileSync(path.resolve(process.cwd(), "public/data/content-index.json"), "utf8"),
    );
  } catch {
    return { colleges: [], deadlines: [], counsellors: [] };
  }
}

export async function getDynamicRoutes() {
  const [blogSlugs, counsellorIds, collegeIds, deadlineIds, proBuddyIds] = await Promise.all([
    fetchBlogSlugs(),
    fetchCounsellorIds(),
    fetchCollegeIds(),
    fetchDeadlineIds(),
    fetchProBuddyIds(),
  ]);

  const snapshot = readContentIndex();
  // The SNAPSHOT wins, not the live API.
  //
  // The snapshot is what react-snap prerenders from, and it was written minutes
  // earlier in this same prebuild. Taking ids from the live API instead means
  // anything added since — or anything whose detail fetch failed — lands in the
  // sitemap without a prerendered page behind it, which is how 120 counsellor
  // URLs came to serve the home page shell. The API is only a fallback for when
  // the snapshot is missing entirely.
  const colleges = snapshot.colleges?.length ? snapshot.colleges : collegeIds;
  const deadlines = snapshot.deadlines?.length ? snapshot.deadlines : deadlineIds;
  // Profiles are still PRERENDERED (see getPrerenderRoutes) so the URLs serve
  // real HTML and stay useful to anyone who follows a link — they are simply not
  // submitted to Google while counsellorProfilesIndexable is off.
  const thinCounsellors = new Set(snapshot.counsellorsThin || []);
  const counsellors = !SEO_CONFIG.counsellorProfilesIndexable
    ? []
    : (snapshot.counsellors?.length ? snapshot.counsellors : counsellorIds).filter(
        (id) => !thinCounsellors.has(id),
      );

  return [
    ...blogSlugs.map((slug) => `/admissions/blogs/slug/${slug}`),
    ...counsellors.map((id) => `/counsellor-details/${id}`),
    ...colleges.map((id) => `/college-details/${id}`),
    ...deadlines.map((id) => `/admissions/deadlines/${id}`),
    ...proBuddyIds.map((id) => `/pro-buddies/profile/${id}`),
  ];
}

// Routes react-snap prerenders. Detail pages are included so college and
// deadline URLs ship real HTML instead of an empty SPA shell that only fills in
// if the crawler runs JS and the backend answers in time.
export function getPrerenderRoutes() {
  const snapshot = readContentIndex();
  return Array.from(
    new Set([
      ...STATIC_ROUTES,
      ...(snapshot.colleges || []).map((id) => `/college-details/${id}`),
      ...(snapshot.deadlines || []).map((id) => `/admissions/deadlines/${id}`),
      // Counsellor profiles. These sat in the sitemap for months while serving
      // the home page shell — same title, same description, canonical pointing
      // at "/" — i.e. 120 URLs that told Google they were duplicates of the
      // home page. They are prerendered from the snapshot now.
      ...(snapshot.counsellors || []).map((id) => `/counsellor-details/${id}`),
    ]),
  );
}

/**
 * Routes that are PRERENDERED and crawlable but deliberately kept OUT of the
 * sitemap. Two reasons qualify a route for this list:
 *
 *  1. the page carries <meta name="robots" content="noindex"> — thin by nature
 *     (author cards, an empty-by-default community feed, two listing pages that
 *     are just filters over other pages). Submitting a noindex URL in a sitemap
 *     is a contradiction Search Console flags, and thin pages in a sitemap are
 *     exactly what an AdSense "thin content" review counts;
 *  2. the page's canonical points somewhere else, so the URL is an alias rather
 *     than a document. Listing it asks Google to index a URL the page itself
 *     disclaims — Search Console files those under "Alternative page with
 *     proper canonical tag" and the entry is simply wasted crawl budget.
 *
 * Prerendering is unaffected: getPrerenderRoutes() reads STATIC_ROUTES directly,
 * so these routes still ship real HTML and still work when linked or typed in.
 *
 * Keep this in sync with the `noIndex`/`canonical` props in the page components.
 */
export const SITEMAP_EXCLUDED_ROUTES = new Set([
  // Renders the home page component; PageSEO sets canonical to "/".
  "/admissions",
  "/pro-buddies/listing",
  "/pro-buddies/college-listing",
  "/admissions/blog-authors",
  "/admissions/blog-authors/aswini-verma",
  "/admissions/blog-authors/ashutosh-kumar",
  "/admissions/blog-authors/kiran-kudke",
  "/admissions/blog-authors/ananya",
]);

export async function getPublicRoutes() {
  const dynamicRoutes = await getDynamicRoutes();
  const all = Array.from(new Set([...STATIC_ROUTES, ...dynamicRoutes]));
  const routes = all.filter((r) => !SITEMAP_EXCLUDED_ROUTES.has(r));

  // A sitemap must only ever contain URLs that ship real prerendered HTML.
  // Listing a route that is not prerendered submits the SPA shell — the home
  // page's title, description and canonical — which is how nine broken blog
  // URLs and 120 counsellor URLs ended up looking like duplicates of the home
  // page. Fail loudly at build time rather than shipping that again.
  const prerendered = new Set(getPrerenderRoutes());
  const unprerendered = routes.filter((r) => !prerendered.has(r));
  if (unprerendered.length) {
    console.warn(
      `[sitemap] ${unprerendered.length} route(s) are in the sitemap but NOT prerendered — ` +
        `they will serve the home page shell:\n  ${unprerendered.slice(0, 10).join("\n  ")}` +
        (unprerendered.length > 10 ? `\n  …and ${unprerendered.length - 10} more` : ""),
    );
  }

  return routes;
}

export function routeToPriority(route) {
  if (route === "/") return "1.0";
  // The 5 sitelink target pages — all get high priority
  if (route === "/admissions") return "1.0";
  if (route === "/colleges" || route === "/pro-buddies" || route === "/study-abroad") return "0.95";
  if (route === "/about") return "0.9";
  if (route === "/counsellor-listing") return "0.85";
  if (route === "/counselling") return "0.9";
  if (route.startsWith("/counselling/")) return "0.8";
  if (
    route === "/neet-rank-predictor" ||
    route === "/neet-college-predictor" ||
    route === "/neet-cutoffs" ||
    route === "/jee-rank-predictor" ||
    route === "/jee-college-predictor" ||
    route === "/mhtcet-college-predictor" ||
    route === "/predictors"
  ) return "0.85";
  if (
    route === "/admissions/blogs" ||
    route === "/admissions/blog-authors"
  ) return "0.8";
  if (route === "/admissions/deadlines") return "0.82";
  if (
    route.startsWith("/counsellor-details/") ||
    route.startsWith("/counsellor/") ||
    route.startsWith("/pro-buddies/profile/")
  ) return "0.75";
  if (route.startsWith("/college-details/")) return "0.75";
  if (route.startsWith("/admissions/deadlines/")) return "0.7";
  if (route.startsWith("/admissions/blogs/slug/")) return "0.7";
  if (route === "/pro-buddies/listing" || route === "/pro-buddies/college-listing") return "0.75";
  if (route === "/about" || route === "/contact" || route === "/revamp-about") return "0.6";
  return "0.5";
}

export function routeToChangeFreq(route) {
  if (route === "/" || route === "/admissions/blogs" || route === "/admissions/deadlines") return "daily";
  if (route === "/admissions" || route === "/colleges" || route === "/study-abroad") return "weekly";
  if (route.startsWith("/admissions/blogs/slug/")) return "weekly";
  if (route.startsWith("/admissions/blog-authors")) return "weekly";
  if (route.startsWith("/admissions/deadlines/")) return "monthly";
  if (route === "/counsellor-listing" || route === "/pro-buddies" || route === "/pro-buddies/listing") return "weekly";
  if (route.startsWith("/counsellor-details/") || route.startsWith("/counsellor/")) return "monthly";
  if (route.startsWith("/pro-buddies/profile/")) return "monthly";
  if (route.startsWith("/college-details/")) return "monthly";
  return "monthly";
}

export function buildSitemapXml(routes) {
  const today = new Date().toISOString().slice(0, 10);

  const urls = routes
    .map((route) => {
      const cleanRoute = route.startsWith("/") ? route : `/${route}`;
      const loc = `${SITE_URL.replace(/\/$/, "")}${cleanRoute}`;
      const changefreq = routeToChangeFreq(cleanRoute);
      const priority = routeToPriority(cleanRoute);

      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}
