import fs from "node:fs/promises";
import path from "node:path";

export const SITE_URL = process.env.SITE_URL || "https://www.procounsel.co.in";

// Keep in sync with COUNSELLING_CITIES in src/lib/counsellingCities.ts.
// (This is a plain .mjs run by Node, which can't import the .ts source directly.)
const COUNSELLING_CITY_SLUGS = [
  "delhi", "mumbai", "bangalore", "pune", "hyderabad", "chennai", "kolkata",
  "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur", "indore", "bhopal",
  "patna", "chandigarh", "surat", "vadodara", "coimbatore", "kochi",
  "thiruvananthapuram", "visakhapatnam", "bhubaneswar", "guwahati", "dehradun",
  "ranchi", "raipur", "ludhiana",
];

export const STATIC_ROUTES = [
  // Core pages — highest priority (target sitelinks)
  "/",
  "/admissions",
  "/courses",
  "/community",
  "/pro-buddies",
  "/about",

  // Admissions sub-pages
  "/admissions/blogs",
  "/admissions/blog-authors",
  "/admissions/blog-authors/aswini-verma",
  "/admissions/blog-authors/ashutosh-kumar",
  "/admissions/blog-authors/kiran-kudke",
  "/admissions/blog-authors/ananya",
  "/admissions/deadlines",

  // Courses sub-pages
  "/courses/course-listing",
  "/courses/test-listing",
  "/courses/session-listing",

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
  "/jee-rank-predictor",
  "/jee-college-predictor",
  "/mhtcet-college-predictor",

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

export async function fetchBlogSlugs() {
  const apiBaseUrl = await getApiBaseUrl();

  if (!apiBaseUrl) {
    console.warn("[sitemap] VITE_API_BASE_URL/API_BASE_URL not set; skipping dynamic blog slugs.");
    return [];
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/blogs/list`;

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      console.warn(`[sitemap] Could not fetch blog list (${response.status}).`);
      return [];
    }

    const json = await response.json();
    const rows = parseListPayload(json);

    const slugs = rows
      .map((item) => {
        const rawSlug = typeof item?.slug === "string" ? item.slug : "";
        if (rawSlug.trim()) return toSlug(rawSlug);
        const title = typeof item?.title === "string" ? item.title : "";
        return toSlug(title);
      })
      .filter(Boolean);

    return Array.from(new Set(slugs));
  } catch (error) {
    console.warn("[sitemap] Failed to fetch dynamic slugs:", error);
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
    const ids = rows.map((item) => item?.id || item?.eventId || "").filter(Boolean);
    console.log(`[sitemap] Fetched ${ids.length} deadline IDs.`);
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

export async function getDynamicRoutes() {
  const [blogSlugs, counsellorIds, collegeIds, deadlineIds, proBuddyIds] = await Promise.all([
    fetchBlogSlugs(),
    fetchCounsellorIds(),
    fetchCollegeIds(),
    fetchDeadlineIds(),
    fetchProBuddyIds(),
  ]);

  return [
    ...blogSlugs.map((slug) => `/admissions/blogs/slug/${slug}`),
    ...counsellorIds.map((id) => `/counsellor-details/${id}`),
    ...collegeIds.map((id) => `/college-details/${id}`),
    ...deadlineIds.map((id) => `/admissions/deadlines/${id}`),
    ...proBuddyIds.map((id) => `/pro-buddies/profile/${id}`),
  ];
}

export async function getPublicRoutes() {
  const dynamicRoutes = await getDynamicRoutes();
  return Array.from(new Set([...STATIC_ROUTES, ...dynamicRoutes]));
}

export function routeToPriority(route) {
  if (route === "/") return "1.0";
  // The 5 sitelink target pages — all get high priority
  if (route === "/admissions") return "1.0";
  if (route === "/courses" || route === "/community" || route === "/pro-buddies") return "0.95";
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
  if (route === "/courses/course-listing" || route === "/courses/test-listing") return "0.75";
  if (route === "/about" || route === "/contact" || route === "/revamp-about") return "0.6";
  return "0.5";
}

export function routeToChangeFreq(route) {
  if (route === "/" || route === "/admissions/blogs" || route === "/admissions/deadlines") return "daily";
  if (route === "/admissions" || route === "/community") return "weekly";
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
