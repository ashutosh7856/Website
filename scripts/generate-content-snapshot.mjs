// Build-time content snapshot generator.
//
// Why this exists
// ---------------
// The home page, /courses and the deadline/college detail pages are 100%
// client-rendered off the Cloud Run API. That API is NOT reachable during the
// react-snap prerender (skipThirdPartyRequests) and it cold-starts / 503s in
// production. The result was that the HTML Google + AdSense actually crawl
// contained the *empty states* ("No colleges found", "No courses found",
// "No tests found", "College not found") instead of content.
//
// This script fetches everything those pages need at build time and writes:
//   1. src/data/contentSnapshot.ts  — small, bundled lists used as react-query
//      initialData, so the first paint (and therefore the prerendered HTML)
//      always has real content.
//   2. public/data/colleges/<id>.json + public/data/deadlines/<id>.json —
//      full detail payloads served from our own CDN. Detail pages fall back to
//      these when the API is slow or down, so a page never collapses to a bare
//      "not found" string.
//   3. scripts/content-snapshot.json — the last-known-good copy.
//
// Resilience mirrors generate-blog-snapshot.mjs: never fail the build, and
// never overwrite a good snapshot with an empty one.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CACHE_PATH = path.resolve(ROOT, "scripts/content-snapshot.json");
const TS_PATH = path.resolve(ROOT, "src/data/contentSnapshot.ts");
// Counsellors live in their own two modules, not in contentSnapshot.ts, and the
// split is a bundle decision rather than a tidiness one. The home page seeds its
// counsellor carousel from this data, so whatever module holds it is pulled into
// the EAGER entry chunk — and while all five snapshots shared one file, every
// visitor downloaded the college, course, test and deadline lists too, for pages
// they had not asked for. Bios are split off again for the same reason: only the
// (lazy) counsellor detail page renders one, and they are half the payload.
const COUNSELLORS_TS_PATH = path.resolve(ROOT, "src/data/counsellorsSnapshot.ts");
const BIOS_TS_PATH = path.resolve(ROOT, "src/data/counsellorBios.ts");
const PUBLIC_DATA_DIR = path.resolve(ROOT, "public/data");

const REQUEST_TIMEOUT_MS = 30000;
const DETAIL_CONCURRENCY = 6;

async function readApiBaseUrl() {
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;

  for (const file of [".env", ".env.local", ".env.example"]) {
    try {
      const content = await fs.readFile(path.resolve(ROOT, file), "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (key.trim() === "VITE_API_BASE_URL" && rest.length) {
          const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
          if (value && !value.includes("your-backend-url")) return value;
        }
      }
    } catch {
      /* ignore missing env files */
    }
  }
  return "";
}

// The backend is a Spring app with XML on the classpath: without an explicit
// Accept header it answers `<HashMap>...</HashMap>` instead of JSON.
async function getJson(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Cloud Run scales to zero — the first request after an idle period can 503 or
// time out. Retry a couple of times before giving up on a build-time fetch.
async function getJsonWithRetry(url, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await getJson(url);
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)));
      }
    }
  }
  throw lastError;
}

function parseListPayload(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [];
  for (const key of ["data", "items", "content", "result", "payload", "testGroups"]) {
    if (Array.isArray(json[key])) return json[key];
  }
  return [];
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch {
        results[index] = null;
      }
    }
  });
  await Promise.all(runners);
  return results;
}

/* ------------------------------------------------------------------ */
/* Normalizers — keep only what the cards/SEO need, so the bundled     */
/* snapshot stays small (the raw payloads are ~250KB combined).        */
/* ------------------------------------------------------------------ */

const str = (v, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function normalizeCollege(raw) {
  const collegeId = str(raw?.collegeId ?? raw?.id);
  if (!collegeId) return null;
  return {
    collegeId,
    collegeName: str(raw?.collegeName, collegeId),
    collegesLocationCity: str(raw?.collegesLocationCity),
    collegesLocationState: str(raw?.collegesLocationState),
    logoUrl: str(raw?.logoUrl),
    establishedYear: str(raw?.establishedYear),
    accreditation: str(raw?.accreditation),
    collegeType: str(raw?.collegeType),
    popularityCount: num(raw?.popularityCount),
    // Only the length and course names are ever read off the *list* endpoint,
    // and the full branch/fee/placement trees are ~70KB. Trim them here so the
    // bundled snapshot stays small; the detail JSON keeps the complete data.
    coursesOffered: (Array.isArray(raw?.coursesOffered) ? raw.coursesOffered : []).map(
      (course) => ({
        courseId: str(course?.courseId),
        courseName: str(course?.courseName),
        courseLevel: str(course?.courseLevel),
        duration: str(course?.duration),
        examsAccepted: (Array.isArray(course?.examsAccepted) ? course.examsAccepted : []).map(
          (exam) => ({ examId: str(exam?.examId), examName: str(exam?.examName) }),
        ),
      }),
    ),
  };
}

function normalizeCourse(raw) {
  const courseId = str(raw?.courseId ?? raw?.id);
  if (!courseId) return null;
  return {
    courseId,
    courseName: str(raw?.courseName, "Course"),
    counsellorName: str(raw?.counsellorName ?? raw?.counselorName),
    courseThumbnailUrl: str(raw?.courseThumbnailUrl),
    category: str(raw?.category, "General"),
    rating: num(raw?.rating),
    coursePrice: num(raw?.coursePrice),
    coursePriceAfterDiscount: num(raw?.coursePriceAfterDiscount, num(raw?.coursePrice)),
    courseTimeHours: num(raw?.courseTimeHours),
    courseTimeMinutes: num(raw?.courseTimeMinutes),
    soldCount: num(raw?.soldCount),
    isTrending: Boolean(raw?.isTrending),
  };
}

function normalizeTestGroup(item) {
  const group = item?.testGroup ?? item;
  const testGroupId = str(group?.testGroupId ?? group?.id);
  if (!testGroupId) return null;
  const attachedTestIds = Array.isArray(group?.attachedTestIds)
    ? group.attachedTestIds.map((id) => str(id)).filter(Boolean)
    : Array.isArray(item?.attachedTests)
      ? item.attachedTests.map((t) => str(t?.testId ?? t?.id)).filter(Boolean)
      : [];
  return {
    testGroupId,
    attachedTestIds,
    testGroupName: str(group?.testGroupName, "Test Series"),
    testGroupDescription: str(group?.testGroupDescription),
    bannerImagUrl: str(group?.bannerImagUrl),
    testType: str(group?.testType),
    priceType: str(group?.priceType),
    price: num(group?.price),
    rating: num(group?.rating),
    soldCount: num(group?.soldCount),
    // Provisional: attachedTestIds is a stale pointer list that still names
    // deleted tests (138 ids resolved to only 109 real tests). fetchAll()
    // overwrites this with the resolved count from getTestGroupById.
    attachedTestCount: attachedTestIds.length,
  };
}

/**
 * Base64url of the counsellor id — the same encoding the app uses in
 * /counsellor-details/<id> URLs, so a snapshot file can be looked up by the
 * exact path segment the router receives.
 */
function encodeCounsellorId(id) {
  if (!id) return "";
  return Buffer.from(String(id)).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * PUBLIC fields only.
 *
 * The counsellor detail endpoint also returns `email`, `phoneNumber`,
 * `fcmToken`, `voipToken` and client/appointment ids. These files are written
 * into public/ and served to anyone, so the shape here is a strict allow-list —
 * never spread the raw payload.
 */
function normalizeCounsellor(raw, detail) {
  const counsellorId = str(raw?.counsellorId ?? raw?.id);
  if (!counsellorId) return null;
  const src = detail && typeof detail === "object" ? detail : {};
  const arr = (v) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
  const firstName = str(src.firstName ?? raw?.firstName);
  const lastName = str(src.lastName ?? raw?.lastName);
  if (!firstName && !lastName) return null;
  return {
    counsellorId,
    encodedId: encodeCounsellorId(counsellorId),
    firstName,
    lastName,
    city: str(src.city ?? raw?.city),
    states: arr(src.stateOfCounsellor ?? raw?.states),
    expertise: arr(src.expertise),
    languagesKnow: arr(src.languagesKnow ?? raw?.languagesKnow),
    experience: num(src.experience ?? raw?.experience),
    rating: num(src.rating ?? raw?.rating),
    numberOfRatings: num(raw?.numberOfRatings),
    photoUrl: str(src.photoUrl ?? raw?.photoUrlSmall),
    organisationName: str(src.organisationName),
    description: str(src.description),
    ratePerYear: num(src.ratePerYear ?? raw?.ratePerYear),
    // Shown on the profile card. Snapshotting them keeps the prerendered HTML
    // identical to what a visitor sees after hydration, instead of "N/A".
    plusAmount: num(src.plusAmount ?? raw?.plusAmount),
    proAmount: num(src.proAmount ?? raw?.proAmount),
    eliteAmount: num(src.eliteAmount ?? raw?.eliteAmount),
  };
}

function normalizeDeadline(raw) {
  const id = str(raw?.id ?? raw?.eventId);
  if (!id) return null;
  return {
    id,
    title: str(raw?.title, "Deadline"),
    startDate: str(raw?.startDate),
    startTime: str(raw?.startTime),
    endDate: str(raw?.endDate),
    endTime: str(raw?.endTime),
    description: str(raw?.description),
    photoUrl: str(raw?.photoUrl),
    applicationUrl: str(raw?.applicationUrl),
    typeOfEvent: str(raw?.typeOfEvent),
    priority: num(raw?.priority),
    associatedCourseId: Array.isArray(raw?.associatedCourseId) ? raw.associatedCourseId : [],
    associatedExamsIds: Array.isArray(raw?.associatedExamsIds) ? raw.associatedExamsIds : [],
    isDeleted: false,
  };
}

/* ------------------------------------------------------------------ */

async function fetchAll(baseUrl) {
  const api = baseUrl.replace(/\/$/, "");

  const [collegesRaw, coursesRaw, testGroupsRaw, deadlinesRaw, counsellorsRaw] = await Promise.all([
    getJsonWithRetry(`${api}/api/featured_colleges/all`).catch((e) => {
      console.warn("[content-snapshot] colleges list failed:", e.message);
      return null;
    }),
    getJsonWithRetry(`${api}/api/shared/getAllCounsellorCourses`).catch((e) => {
      console.warn("[content-snapshot] courses failed:", e.message);
      return null;
    }),
    getJsonWithRetry(`${api}/api/shared/getAllTestGroups`).catch((e) => {
      console.warn("[content-snapshot] test groups failed:", e.message);
      return null;
    }),
    getJsonWithRetry(`${api}/api/shared/getAllEventDeadlines`).catch((e) => {
      console.warn("[content-snapshot] deadlines failed:", e.message);
      return null;
    }),
    getJsonWithRetry(`${api}/api/shared/getAllCounsellors`).catch((e) => {
      console.warn("[content-snapshot] counsellors failed:", e.message);
      return null;
    }),
  ]);

  const colleges = parseListPayload(collegesRaw).map(normalizeCollege).filter(Boolean);
  const courses = parseListPayload(coursesRaw).map(normalizeCourse).filter(Boolean);
  const testGroups = parseListPayload(testGroupsRaw).map(normalizeTestGroup).filter(Boolean);

  // Soft-deleted deadlines still come back from the API. They are the reason
  // /admissions/deadlines/<id> URLs sat in the sitemap and rendered "Could not
  // load this deadline" — drop them here so they never reach the sitemap.
  const liveDeadlineRows = parseListPayload(deadlinesRaw).filter((row) => !row?.isDeleted);
  const deadlines = liveDeadlineRows.map(normalizeDeadline).filter(Boolean);

  // Resolve each group's real test count. The list endpoint only exposes
  // attachedTestIds, which still references deleted tests, so every "N tests"
  // label was overstated. getTestGroupById returns the resolved rows.
  if (testGroups.length) {
    const details = await mapWithConcurrency(testGroups, DETAIL_CONCURRENCY, (group) =>
      getJsonWithRetry(
        `${api}/api/shared/getTestGroupById?testGroupId=${encodeURIComponent(group.testGroupId)}`,
        2,
      ),
    );
    details.forEach((detail, index) => {
      const attached = detail?.data?.attachedTests;
      if (!Array.isArray(attached)) return;
      testGroups[index].attachedTestCount = attached.filter(
        (test) => test && !test.deleted && test.published !== false,
      ).length;
    });
  }

  // Full college detail payloads — too big to bundle, written as static JSON.
  const collegeDetails = {};
  if (colleges.length) {
    const details = await mapWithConcurrency(colleges, DETAIL_CONCURRENCY, (college) =>
      getJsonWithRetry(
        `${api}/api/featured_colleges/getCollegeById?collegeId=${encodeURIComponent(college.collegeId)}`,
        2,
      ),
    );
    details.forEach((detail, index) => {
      if (detail && typeof detail === "object" && str(detail.collegeName)) {
        collegeDetails[colleges[index].collegeId] = detail;
      }
    });
  }

  // Counsellor profiles. The list endpoint has no bio or expertise, and those
  // are the only things that make the page worth indexing — so each profile is
  // resolved from its detail endpoint, then stripped to public fields.
  const counsellorRows = parseListPayload(counsellorsRaw);
  let counsellors = [];
  if (counsellorRows.length) {
    const details = await mapWithConcurrency(counsellorRows, DETAIL_CONCURRENCY, (row) =>
      getJsonWithRetry(
        `${api}/api/shared/getCounsellorById?counsellorId=${encodeURIComponent(
          str(row?.counsellorId ?? row?.id),
        )}`,
        2,
      ).catch(() => null),
    );
    counsellors = counsellorRows
      .map((row, i) => normalizeCounsellor(row, details[i]?.data ?? details[i]))
      .filter(Boolean);
    const withBio = counsellors.filter((c) => c.description.length >= 120).length;
    console.log(
      `[content-snapshot] counsellors: ${counsellors.length} (${withBio} with a real bio)`,
    );
  }

  return { colleges, courses, testGroups, deadlines, collegeDetails, counsellors };
}

/* ------------------------------------------------------------------ */

function tsLiteral(value) {
  return JSON.stringify(value, null, 2);
}

async function writeOutputs(snapshot) {
  const { colleges, courses, testGroups, deadlines, collegeDetails, counsellors = [] } = snapshot;

  const banner =
    "// AUTO-GENERATED by scripts/generate-content-snapshot.mjs — do not edit by hand.\n" +
    "// Build-time snapshot of the API-backed content the public pages render, so\n" +
    "// prerendered HTML ships real colleges/courses/tests/deadlines instead of\n" +
    "// empty states. The live API refreshes all of this client-side on mount.\n\n";

  const types = `export interface CollegeSnapshotItem {
  collegeId: string;
  collegeName: string;
  collegesLocationCity: string;
  collegesLocationState: string;
  logoUrl: string;
  establishedYear: string;
  accreditation: string;
  collegeType: string;
  popularityCount: number;
  coursesOffered: {
    courseId: string;
    courseName: string;
    courseLevel: string;
    duration: string;
    examsAccepted: { examId: string; examName: string }[];
  }[];
}

export interface CourseSnapshotItem {
  courseId: string;
  courseName: string;
  counsellorName: string;
  courseThumbnailUrl: string;
  category: string;
  rating: number;
  coursePrice: number;
  coursePriceAfterDiscount: number;
  courseTimeHours: number;
  courseTimeMinutes: number;
  soldCount: number;
  isTrending: boolean;
}

export interface TestGroupSnapshotItem {
  testGroupId: string;
  attachedTestIds: string[];
  testGroupName: string;
  testGroupDescription: string;
  bannerImagUrl: string;
  testType: string;
  priceType: string;
  price: number;
  rating: number;
  soldCount: number;
  attachedTestCount: number;
}

export interface DeadlineSnapshotItem {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  photoUrl: string;
  applicationUrl: string;
  typeOfEvent: string;
  priority: number;
  associatedCourseId: string[];
  associatedExamsIds: string[];
  isDeleted: boolean;
}

`;

  const body =
    `export const COLLEGES_SNAPSHOT: CollegeSnapshotItem[] = ${tsLiteral(colleges)};\n\n` +
    `export const COURSES_SNAPSHOT: CourseSnapshotItem[] = ${tsLiteral(courses)};\n\n` +
    `export const TEST_GROUPS_SNAPSHOT: TestGroupSnapshotItem[] = ${tsLiteral(testGroups)};\n\n` +
    `export const DEADLINES_SNAPSHOT: DeadlineSnapshotItem[] = ${tsLiteral(deadlines)};\n\n` +
    "// Accurate test counts, resolved per group. The list endpoint's\n" +
    "// attachedTestIds still names deleted tests, so cards must prefer this.\n" +
    `export const TEST_COUNT_BY_GROUP: Record<string, number> = ${tsLiteral(
      Object.fromEntries(testGroups.map((g) => [g.testGroupId, g.attachedTestCount])),
    )};\n\n` +
    "// Real counts for the /courses hero — these replaced hard-coded placeholders.\n" +
    `export const CONTENT_COUNTS = {\n` +
    `  colleges: ${colleges.length},\n` +
    `  courses: ${courses.length},\n` +
    `  testGroups: ${testGroups.length},\n` +
    `  tests: ${testGroups.reduce((sum, g) => sum + g.attachedTestCount, 0)},\n` +
    `  courseEnrolments: ${courses.reduce((sum, c) => sum + c.soldCount, 0)},\n` +
    `  testEnrolments: ${testGroups.reduce((sum, g) => sum + g.soldCount, 0)},\n` +
    `  deadlines: ${deadlines.length},\n` +
    `} as const;\n`;

  await fs.mkdir(path.dirname(TS_PATH), { recursive: true });
  await fs.writeFile(TS_PATH, banner + types + body, "utf8");

  // `bioLength` rather than the bio itself: the only thing the lists do with a
  // description is measure it (THIN_PROFILE_BIO_CHARS decides which profiles are
  // worth linking), and shipping 68 KB of prose to compare against a number is
  // the sort of cost nothing in the code makes visible.
  const counsellorRows = counsellors.map(({ description, ...rest }) => ({
    ...rest,
    bioLength: (description || "").trim().length,
  }));

  await fs.writeFile(
    COUNSELLORS_TS_PATH,
    banner +
      `export interface CounsellorSnapshotItem {
  counsellorId: string;
  encodedId: string;
  firstName: string;
  lastName: string;
  city: string;
  states: string[];
  expertise: string[];
  languagesKnow: string[];
  experience: number;
  rating: number;
  numberOfRatings: number;
  photoUrl: string;
  organisationName: string;
  /** Length of the bio in counsellorBios.ts. The bio itself is not here. */
  bioLength: number;
  ratePerYear: number;
  plusAmount: number;
  proAmount: number;
  eliteAmount: number;
}\n\n` +
      `export const COUNSELLORS_SNAPSHOT: CounsellorSnapshotItem[] = ${tsLiteral(
        counsellorRows,
      )};\n`,
    "utf8",
  );

  await fs.writeFile(
    BIOS_TS_PATH,
    "// AUTO-GENERATED by scripts/generate-content-snapshot.mjs — do not edit by hand.\n" +
      "// Counsellor bios, keyed by counsellorId, split out of counsellorsSnapshot.ts.\n" +
      "// Only the counsellor detail page renders one, and that route is lazy, so\n" +
      "// keeping them here is what stops every home-page visitor downloading them.\n\n" +
      `export const COUNSELLOR_BIOS: Record<string, string> = ${tsLiteral(
        Object.fromEntries(
          counsellors
            .filter((c) => (c.description || "").trim())
            .map((c) => [c.counsellorId, c.description]),
        ),
      )};\n`,
    "utf8",
  );

  await fs.writeFile(CACHE_PATH, JSON.stringify(snapshot, null, 2), "utf8");

  // Static per-item detail payloads, served same-origin from our CDN. These are
  // what keep a detail page from ever rendering a bare "not found".
  const collegesDir = path.join(PUBLIC_DATA_DIR, "colleges");
  const deadlinesDir = path.join(PUBLIC_DATA_DIR, "deadlines");
  await fs.rm(collegesDir, { recursive: true, force: true });
  await fs.rm(deadlinesDir, { recursive: true, force: true });
  await fs.mkdir(collegesDir, { recursive: true });
  await fs.mkdir(deadlinesDir, { recursive: true });

  for (const [id, detail] of Object.entries(collegeDetails)) {
    await fs.writeFile(path.join(collegesDir, `${id}.json`), JSON.stringify(detail), "utf8");
  }
  for (const deadline of deadlines) {
    await fs.writeFile(
      path.join(deadlinesDir, `${deadline.id}.json`),
      JSON.stringify(deadline),
      "utf8",
    );
  }

  // Counsellor profiles, keyed by the SAME base64url id that appears in the
  // URL, so the page can read /data/counsellors/<:id>.json straight from the
  // route param with no decoding round-trip.
  const counsellorsDir = path.join(PUBLIC_DATA_DIR, "counsellors");
  await fs.rm(counsellorsDir, { recursive: true, force: true });
  await fs.mkdir(counsellorsDir, { recursive: true });
  for (const counsellor of counsellors) {
    if (!counsellor.encodedId) continue;
    await fs.writeFile(
      path.join(counsellorsDir, `${counsellor.encodedId}.json`),
      JSON.stringify(counsellor),
      "utf8",
    );
  }

  // Route manifests consumed by the sitemap + prerender steps.
  await fs.writeFile(
    path.join(PUBLIC_DATA_DIR, "content-index.json"),
    JSON.stringify(
      {
        colleges: colleges.map((c) => c.collegeId),
        deadlines: deadlines.map((d) => d.id),
        counsellors: counsellors.map((c) => c.encodedId).filter(Boolean),
        // Profiles with no real bio. Still PRERENDERED (so the page is never a
        // bare shell), but kept out of the sitemap and marked noindex: a
        // name-and-photo page is exactly the "thin content" an AdSense review
        // counts against the whole site. They rejoin automatically as soon as
        // the counsellor writes a bio and the next build picks it up.
        counsellorsThin: counsellors
          .filter((c) => c.description.trim().length < 120)
          .map((c) => c.encodedId)
          .filter(Boolean),
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function readCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function isUsable(snapshot) {
  return Boolean(
    snapshot &&
      (snapshot.colleges?.length ||
        snapshot.courses?.length ||
        snapshot.testGroups?.length ||
        snapshot.deadlines?.length),
  );
}

// Merge fresh results over the cache per-section, so one failing endpoint does
// not blank out sections that fetched fine.
function mergeWithCache(fresh, cached) {
  if (!cached) return fresh;
  const pick = (key) => (fresh[key]?.length ? fresh[key] : cached[key] || []);
  return {
    colleges: pick("colleges"),
    courses: pick("courses"),
    testGroups: pick("testGroups"),
    deadlines: pick("deadlines"),
    counsellors: pick("counsellors"),
    collegeDetails: Object.keys(fresh.collegeDetails || {}).length
      ? { ...(cached.collegeDetails || {}), ...fresh.collegeDetails }
      : cached.collegeDetails || {},
  };
}

async function main() {
  const cached = await readCache();
  const baseUrl = await readApiBaseUrl();

  if (!baseUrl) {
    console.warn("[content-snapshot] No VITE_API_BASE_URL — reusing cached snapshot.");
    await writeOutputs(
      cached || { colleges: [], courses: [], testGroups: [], deadlines: [], collegeDetails: {} },
    );
    return;
  }

  let fresh;
  try {
    fresh = await fetchAll(baseUrl);
  } catch (error) {
    console.warn("[content-snapshot] Fetch failed:", error?.message || error);
    fresh = { colleges: [], courses: [], testGroups: [], deadlines: [], collegeDetails: {} };
  }

  const merged = mergeWithCache(fresh, cached);

  if (!isUsable(merged)) {
    console.warn("[content-snapshot] Nothing usable fetched and no cache — writing empty snapshot.");
  }

  await writeOutputs(merged);
  console.log(
    `[content-snapshot] colleges=${merged.colleges.length} ` +
      `(details=${Object.keys(merged.collegeDetails).length}) ` +
      `courses=${merged.courses.length} testGroups=${merged.testGroups.length} ` +
      `deadlines=${merged.deadlines.length}`,
  );
}

main().catch((error) => {
  // Never fail the build over a snapshot.
  console.error("[content-snapshot] Unexpected failure:", error);
});
