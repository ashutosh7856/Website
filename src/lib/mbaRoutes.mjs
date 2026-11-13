/**
 * The public MBA URL architecture, and the one rule that decides which of its
 * pages are published.
 *
 * Plain `.mjs` on purpose: the app (to decide whether a route renders or sends
 * the visitor up a level), scripts/generate-mba-snapshot.mjs (to write the
 * route list) and scripts/site-routes.mjs (prerender + sitemap) all import it,
 * and the build scripts run as bare Node. Types live in mbaRoutes.d.mts.
 *
 * The rule: a URL is published — prerendered, listed in the sitemap, linked —
 * only when the official data or the original content behind it exists. A
 * template with nothing verified to show never becomes a page. See
 * docs/MBA-SEO-BLUEPRINT.md for the keyword map behind every path here.
 */

export const MBA_PATHS = Object.freeze({
  counselling: "/mba-counselling",
  hub: "/mba-admission-2027",
  colleges: "/mba-colleges",
  iimCutoffs: "/mba-colleges/iim-cutoffs",
  exams: "/mba-entrance-exams",
  specialisations: "/mba-specialisations",
  resources: "/mba-resources",
  fees: "/mba-fees",
  placements: "/mba-placements",
  predictor: "/cat-college-predictor",
  scoreCalculator: "/cat-score-calculator",
  freeMocks: "/free-cat-mock-test",
  pyqPapers: "/cat-previous-year-papers",
  compare: "/mba-colleges/compare",
  roiCalculator: "/mba-fees-roi-calculator",
  deadlines: "/mba-admission-deadlines",
  eligibility: "/mba-eligibility",
  courses: "/mba-courses",
});

export const collegePath = (slug) => `/mba-colleges/${slug}`;
export const percentilePath = (p) => `/mba-colleges/mba-colleges-at-${p}-percentile`;
export const cityPath = (slug) => `/mba-colleges-in/${slug}`;
export const examPath = (id) => `/mba-entrance-exams/${id}`;
export const specialisationPath = (slug) => `/mba-specialisations/${slug}`;

/** "mba-colleges-at-95-percentile" → 95; anything else → null. */
export function percentileFromSlug(slug) {
  const m = /^mba-colleges-at-(\d{2})-percentile$/.exec(String(slug ?? ""));
  return m ? Number(m[1]) : null;
}

// ── Percentile pages ─────────────────────────────────────────────────────────

/** Every percentile page the architecture allows, highest first. */
export const MBA_PERCENTILES = [99, 95, 90, 85, 80, 70, 60];
/**
 * A band publishes when at least MIN_INSTITUTES_PER_BAND institutes — IIMs and
 * others — have a published General overall CAT figure at or below it. With
 * the data of Nov 2026 that is 99, 95, 90, 85 and 80; 70 and 60 stay
 * templates until enough institutes publish figures that low.
 */
export const PHASE1_PERCENTILES = [99, 95, 90, 80];
export const MIN_INSTITUTES_PER_BAND = 5;

// ── Entrance exams ───────────────────────────────────────────────────────────

/** Exam pages: CAT renders from cat_exam.json; the rest need exams/<id>.json. */
export const MBA_EXAMS = [
  { id: "cat", short: "CAT", name: "Common Admission Test" },
  { id: "xat", short: "XAT", name: "Xavier Aptitude Test" },
  { id: "snap", short: "SNAP", name: "Symbiosis National Aptitude Test" },
  { id: "nmat", short: "NMAT", name: "NMAT by GMAC" },
  { id: "cmat", short: "CMAT", name: "Common Management Admission Test" },
  { id: "mah-mba-cet", short: "MAH-MBA/MMS CET", name: "Maharashtra MBA/MMS Common Entrance Test" },
  { id: "mat", short: "MAT", name: "Management Aptitude Test" },
  { id: "gmat", short: "GMAT", name: "Graduate Management Admission Test" },
];

// ── Cities ───────────────────────────────────────────────────────────────────

/**
 * City pages. `aliases` are the spellings official sources use (NIRF prints
 * "Bengaluru" and "New Delhi"). Priority cities publish at
 * MIN_INSTITUTES_PRIORITY_CITY verified institutes, any other at
 * MIN_INSTITUTES_CITY.
 */
export const MBA_CITIES = [
  { slug: "pune", name: "Pune", aliases: ["pune"], priority: true },
  { slug: "mumbai", name: "Mumbai", aliases: ["mumbai", "navi mumbai"], priority: true },
  { slug: "bangalore", name: "Bangalore", aliases: ["bangalore", "bengaluru"], priority: true },
  { slug: "delhi", name: "Delhi", aliases: ["delhi", "new delhi"], priority: false },
  { slug: "chennai", name: "Chennai", aliases: ["chennai"], priority: false },
  { slug: "hyderabad", name: "Hyderabad", aliases: ["hyderabad"], priority: false },
  { slug: "kolkata", name: "Kolkata", aliases: ["kolkata"], priority: false },
  { slug: "ahmedabad", name: "Ahmedabad", aliases: ["ahmedabad"], priority: false },
  { slug: "lucknow", name: "Lucknow", aliases: ["lucknow"], priority: false },
  { slug: "bhubaneswar", name: "Bhubaneswar", aliases: ["bhubaneswar"], priority: false },
  { slug: "jaipur", name: "Jaipur", aliases: ["jaipur"], priority: false },
  { slug: "gurugram", name: "Gurugram", aliases: ["gurugram", "gurgaon"], priority: false },
  { slug: "noida", name: "Noida", aliases: ["noida", "greater noida"], priority: false },
  { slug: "indore", name: "Indore", aliases: ["indore"], priority: false },
  { slug: "nagpur", name: "Nagpur", aliases: ["nagpur"], priority: false },
];
export const MIN_INSTITUTES_PRIORITY_CITY = 3;
export const MIN_INSTITUTES_CITY = 5;

// ── Specialisations ──────────────────────────────────────────────────────────

/**
 * Specialisation pages. `match` is tested (lower-case substring) against the
 * specialisations an institute's official data lists and its programme names.
 * A page publishes once MIN_COLLEGES_PER_SPECIALISATION verified institutes
 * offer it — the page's job is to list them.
 */
export const MBA_SPECIALISATIONS = [
  { slug: "finance", name: "Finance", match: ["finance", "financial", "banking"] },
  { slug: "marketing", name: "Marketing", match: ["marketing"] },
  { slug: "human-resource-management", name: "Human Resource Management", short: "HR", match: ["human resource", "hrm", "people management"] },
  { slug: "business-analytics", name: "Business Analytics", short: "Analytics", match: ["analytics", "data science"] },
  { slug: "operations-management", name: "Operations Management", short: "Operations", match: ["operations"] },
  { slug: "supply-chain-management", name: "Supply Chain Management", short: "Supply Chain", match: ["supply chain", "logistics"] },
  { slug: "international-business", name: "International Business", short: "Intl Business", match: ["international business", "global business"] },
  { slug: "information-technology", name: "IT and Systems Management", short: "IT & Systems", match: ["information technology", "information systems", "it and systems", "systems management"] },
  { slug: "entrepreneurship", name: "Entrepreneurship", match: ["entrepreneurship", "family business"] },
  { slug: "agribusiness-management", name: "Agribusiness Management", short: "Agribusiness", match: ["agri-business", "agribusiness", "agri business"] },
];
export const MIN_COLLEGES_PER_SPECIALISATION = 3;

// ── Guides ───────────────────────────────────────────────────────────────────

/**
 * Original guides whose copy is written (src/content/mbaGuides.ts). A guide is
 * listed here in the same change that adds its copy; src/test/mbaRoutes.test.ts
 * pins the two lists together. Paths are final URLs.
 */
export const MBA_GUIDE_PATHS = [
  "/mba-without-cat",
  "/mba-resources/mba-vs-pgdm",
  "/mba-resources/how-to-choose-mba-college",
  "/mba-resources/what-is-mba",
  "/mba-resources/cat-vs-xat-vs-snap-vs-nmat",
  "/mba-resources/mba-without-work-experience",
  "/mba-resources/government-vs-private-mba-colleges",
  "/mba-resources/mba-admission-process",
  "/mba-resources/is-mba-worth-it",
  "/mba-resources/mba-after-bcom",
  "/mba-resources/mba-after-engineering",
  "/mba-resources/mba-after-bba",
  "/mba-resources/how-to-get-into-iim",
  "/mba-resources/good-cat-percentile",
  "/mba-resources/mba-scholarships",
  "/mba-resources/mba-interview-preparation",
];

// ── Helpers over the snapshot ────────────────────────────────────────────────

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[`'’.,()]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Every institute with a published profile: IIMs first, then other colleges. */
export function profileColleges(snapshot) {
  return [...(snapshot.institutes ?? []), ...(snapshot.colleges ?? [])];
}

/** The city slug an official city name belongs to, or null. */
export function citySlugFor(cityName) {
  const n = norm(cityName);
  if (!n) return null;
  const hit = MBA_CITIES.find((c) => c.aliases.some((a) => n === a || n.startsWith(`${a} `)));
  return hit ? hit.slug : null;
}

/**
 * The NIRF row for a profiled institute: explicit `slug` or NIRF id first,
 * then an exact normalised name match, then same city + one name containing
 * the other (NIRF prints "Indian Institute of Management" for IIM Nagpur).
 */
export function nirfRowFor(snapshot, college) {
  const rows = snapshot.nirf?.rankings ?? [];
  const bySlug = rows.find(
    (r) =>
      (r.slug && r.slug === college.slug) ||
      (r.nirfInstituteId && college.nirfInstituteId && r.nirfInstituteId === college.nirfInstituteId),
  );
  if (bySlug) return bySlug;
  const name = norm(college.name);
  const exact = rows.find((r) => norm(r.name) === name);
  if (exact) return exact;
  const city = citySlugFor(college.city) ?? norm(college.city);
  return (
    rows.find((r) => {
      const rCity = citySlugFor(r.city) ?? norm(r.city);
      if (!city || rCity !== city) return false;
      const rn = norm(r.name);
      return rn.length > 10 && (name.includes(rn) || rn.includes(name));
    }) ?? null
  );
}

/**
 * Institutes in a city: every profiled institute there plus every NIRF-ranked
 * one not already profiled. Each entry is { name, slug|null, nirf|null }.
 */
export function institutesInCity(snapshot, citySlug) {
  const out = [];
  const usedNirf = new Set();
  for (const c of profileColleges(snapshot)) {
    if (citySlugFor(c.city) !== citySlug) continue;
    const nirf = nirfRowFor(snapshot, c);
    if (nirf) usedNirf.add(nirf);
    out.push({ name: c.name, slug: c.slug, nirf });
  }
  for (const r of snapshot.nirf?.rankings ?? []) {
    if (usedNirf.has(r) || citySlugFor(r.city) !== citySlug) continue;
    out.push({ name: r.name, slug: null, nirf: r });
  }
  return out;
}

/**
 * A city publishes when enough verified institutes are there: profiles + NIRF
 * rows, or — for Maharashtra — institutes in the official MBA/MMS CAP cut-off
 * list (snapshot.capMeta.cityCounts).
 */
export function publishedCities(snapshot) {
  return MBA_CITIES.filter((c) => {
    const min = c.priority ? MIN_INSTITUTES_PRIORITY_CITY : MIN_INSTITUTES_CITY;
    const cap = snapshot.capMeta?.cityCounts?.[c.slug] ?? 0;
    return institutesInCity(snapshot, c.slug).length >= min || cap >= MIN_INSTITUTES_CITY;
  }).map((c) => c.slug);
}

/**
 * The specialisation page a name belongs to ("Finance", "HR", "Business
 * Analytics" → slug): exact slug/name/short first, then the `match` terms.
 * Used for the specialisations.json sidecar (scripts/generate-mba-snapshot.mjs).
 */
export function specialisationSlugFor(name) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return null;
  const exact = MBA_SPECIALISATIONS.find(
    (s) => s.slug === n.replace(/[^a-z0-9]+/g, "-") || s.name.toLowerCase() === n || (s.short ?? "").toLowerCase() === n,
  );
  if (exact) return exact.slug;
  return MBA_SPECIALISATIONS.find((s) => s.match.some((m) => n.includes(m)))?.slug ?? null;
}

/**
 * Institutes whose official data lists the specialisation: the profile's own
 * specialisations / programme names, or a sourced entry in the
 * specialisations.json sidecar (snapshot.specialisationListings) that links
 * to the profile.
 */
export function collegesOffering(snapshot, specSlug) {
  const spec = MBA_SPECIALISATIONS.find((s) => s.slug === specSlug);
  if (!spec) return [];
  const viaSidecar = new Set(
    (snapshot.specialisationListings ?? []).filter((l) => l.spec === specSlug && l.profileSlug).map((l) => l.profileSlug),
  );
  return profileColleges(snapshot).filter((c) => {
    if (viaSidecar.has(c.slug)) return true;
    const listed = [...(c.specialisations ?? []), ...(c.programs ?? []).map((p) => p.name)].map((s) =>
      String(s).toLowerCase(),
    );
    return listed.some((s) => spec.match.some((m) => s.includes(m)));
  });
}

/** Sidecar entries for institutes without a profile page (listed, not linked). */
export function unprofiledOffering(snapshot, specSlug) {
  return (snapshot.specialisationListings ?? []).filter((l) => l.spec === specSlug && !l.profileSlug);
}

export function publishedSpecialisations(snapshot) {
  return MBA_SPECIALISATIONS.filter(
    (s) =>
      collegesOffering(snapshot, s.slug).length + unprofiledOffering(snapshot, s.slug).length >=
      MIN_COLLEGES_PER_SPECIALISATION,
  ).map((s) => s.slug);
}

// ── Admission deadlines ──────────────────────────────────────────────────────

/**
 * The 2027-intake admissions cycle: from the first CAT/XAT 2026 registrations
 * (July 2026) to the latest programme start (August 2027). Dates outside it,
 * and events an exam body labels for the 2026-27 academic year, belong to
 * another intake and are not listed.
 */
export const INTAKE_2027_WINDOW = Object.freeze({ from: "2026-07-01", to: "2027-08-31" });
export const MIN_DEADLINE_ROWS = 5;

const COLLEGE_DATE_FIELDS = [
  ["applicationOpens", "Applications open"],
  ["applicationDeadline", "Application deadline"],
  ["examDate", "Entrance exam date"],
];

const inIntakeWindow = (date) => {
  const day = date.length === 7 ? `${date}-01` : date;
  return day >= INTAKE_2027_WINDOW.from && day <= INTAKE_2027_WINDOW.to;
};

/**
 * Every dated, sourced 2027-intake admission event: institutes' application
 * windows (colleges/ keyDates) and the exam bodies' own dates (exams/ keyDates).
 * Rows without an exact day or month, or without an official source, never
 * appear. Sorted by date.
 */
export function deadlineRows(snapshot) {
  const rows = [];
  for (const c of profileColleges(snapshot)) {
    const kd = c.keyDates;
    if (!kd?.source?.url) continue;
    for (const [field, event] of COLLEGE_DATE_FIELDS) {
      const date = kd[field];
      if (!/^\d{4}-\d{2}(-\d{2})?$/.test(String(date ?? "")) || !inIntakeWindow(date)) continue;
      rows.push({
        id: `${c.slug}-${field}`,
        kind: "college",
        name: c.shortName,
        slug: c.slug,
        event,
        date,
        precision: date.length === 10 ? "day" : "month",
        exams: c.acceptedExams ?? [],
        tentative: kd.tentative === true,
        note: kd.notes ?? null,
        source: kd.source,
      });
    }
  }
  for (const exam of snapshot.exams ?? []) {
    (exam.dates ?? []).forEach((d, i) => {
      if (!d?.iso || !d.source?.url || !inIntakeWindow(d.iso) || /2026-27/.test(d.label)) return;
      rows.push({
        id: `${exam.id}-${i}`,
        kind: "exam",
        name: exam.shortName,
        slug: exam.id,
        event: d.label,
        date: d.iso,
        precision: "day",
        exams: [exam.id],
        tentative: d.tentative === true,
        note: d.note ?? null,
        source: d.source,
      });
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** Exams whose official data states an eligibility rule (for /mba-eligibility). */
export function examsWithEligibility(snapshot) {
  return (snapshot.exams ?? []).filter((e) => (e.facts ?? []).some((f) => f.label === "Eligibility"));
}

/** Exam pages with data: CAT from cat_exam.json, others from exams/<id>.json. */
export function publishedExams(snapshot) {
  const have = new Set((snapshot.exams ?? []).map((e) => e.id));
  return MBA_EXAMS.filter((e) => (e.id === "cat" ? Boolean(snapshot.catExam) : have.has(e.id))).map((e) => e.id);
}

/**
 * The one General, non-PwD overall figure an institute is placed in a band by:
 * its latest batch (from 2025-27 on), the all-gender (or male/default) row,
 * the lowest stage figure published for that batch. Null when it publishes no
 * current overall figure.
 */
/** Figures for batches starting before this year are too old to place anyone in a band. */
export const OLDEST_BAND_BATCH_YEAR = 2025;

export function bandFigure(records, category = "General") {
  const startYear = (r) => Number(/(\d{4})/.exec(String(r.policyBatch ?? r.label ?? ""))?.[1] ?? 0);
  const general = (records ?? []).filter(
    (r) =>
      r.category === category &&
      !r.pwd &&
      r.overall !== null &&
      r.overall !== undefined &&
      startYear(r) >= OLDEST_BAND_BATCH_YEAR,
  );
  if (general.length === 0) return null;
  const batchOf = (r) => String(r.policyBatch ?? r.label ?? "");
  const latest = general.map(batchOf).sort().pop();
  const rows = general.filter((r) => batchOf(r) === latest);
  const plain = rows.filter((r) => !r.gender || r.gender === "Male");
  return Math.min(...(plain.length ? plain : rows).map((r) => r.overall));
}

/**
 * Every institute with a band figure: profiles (IIM policies, colleges/) and
 * cat-cutoffs/ sets, one entry per institute (a set that belongs to a profile
 * with its own figures is not counted twice).
 */
export function bandInstitutes(snapshot) {
  const out = new Map();
  for (const c of profileColleges(snapshot)) {
    const f = bandFigure(c.cutoffs);
    if (f !== null) out.set(c.slug, { slug: c.slug, overall: f, isIim: (snapshot.institutes ?? []).includes(c) });
  }
  for (const set of snapshot.catCutoffs ?? []) {
    const key = set.profileSlug ?? set.slug;
    if (out.has(key)) continue;
    const f = bandFigure(set.records);
    if (f !== null) out.set(key, { slug: key, overall: f, isIim: false });
  }
  return [...out.values()];
}

export function bandCount(snapshot, p) {
  return bandInstitutes(snapshot).filter((x) => x.overall <= p).length;
}

export function publishedPercentiles(snapshot) {
  return MBA_PERCENTILES.filter((p) => bandCount(snapshot, p) >= MIN_INSTITUTES_PER_BAND);
}

/** Profiles: every IIM in programs/ and every validated college in colleges/. */
export function publishedCollegeSlugs(snapshot) {
  return profileColleges(snapshot).map((c) => c.slug);
}

const MIN_FIGURES_FOR_TABLE = 5;

/**
 * Every public MBA URL to prerender and list, in a stable order. /mba-counselling
 * is not here: it is a counselling category page and is listed with those.
 */
export function mbaPublishedRoutes(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.institutes) || snapshot.institutes.length === 0) return [];
  const colleges = profileColleges(snapshot);
  const exams = publishedExams(snapshot);
  const specs = publishedSpecialisations(snapshot);
  const withFee = colleges.filter((c) => c.programs?.some((p) => p.feeTotal !== null)).length;
  const withSalary = colleges.filter((c) => c.programs?.some((p) => p.medianSalary !== null)).length;

  return [
    MBA_PATHS.hub,
    MBA_PATHS.predictor,
    // Both render from cat_exam.json (marking scheme, pattern), which every snapshot has.
    ...(snapshot.catExam ? [MBA_PATHS.scoreCalculator, MBA_PATHS.freeMocks] : []),
    // Lists the actual CAT papers in content/ (identity and pattern only, never questions).
    ...((snapshot.pyqPapers ?? []).length > 0 ? [MBA_PATHS.pyqPapers] : []),
    // The ROI calculator prefills from official fees and medians.
    ...(withFee >= MIN_FIGURES_FOR_TABLE && withSalary >= 1 ? [MBA_PATHS.roiCalculator] : []),
    ...(deadlineRows(snapshot).length >= MIN_DEADLINE_ROWS ? [MBA_PATHS.deadlines] : []),
    ...(examsWithEligibility(snapshot).length >= 3 ? [MBA_PATHS.eligibility] : []),
    ...(colleges.length >= MIN_FIGURES_FOR_TABLE ? [MBA_PATHS.courses] : []),
    MBA_PATHS.colleges,
    ...(colleges.length >= 2 ? [MBA_PATHS.compare] : []),
    MBA_PATHS.iimCutoffs,
    ...publishedPercentiles(snapshot).map(percentilePath),
    ...publishedCollegeSlugs(snapshot).map(collegePath),
    ...publishedCities(snapshot).map(cityPath),
    MBA_PATHS.exams,
    ...exams.map(examPath),
    ...(specs.length > 0 ? [MBA_PATHS.specialisations, ...specs.map(specialisationPath)] : []),
    ...(withFee >= MIN_FIGURES_FOR_TABLE ? [MBA_PATHS.fees] : []),
    ...(withSalary >= MIN_FIGURES_FOR_TABLE ? [MBA_PATHS.placements] : []),
    MBA_PATHS.resources,
    ...MBA_GUIDE_PATHS,
  ];
}
