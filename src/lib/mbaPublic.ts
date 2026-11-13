import type {
  Cutoff,
  InstituteDetail,
  MbaCategory,
  OfficialSource,
  ProgramDetail,
  Source,
} from "@/api/mba";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import type { ExamInfo, MbaCollege, NirfRow } from "@/data/mbaSnapshotTypes";
import { absoluteUrl } from "@/lib/siteUrl.mjs";
import {
  MBA_PATHS,
  bandFigure,
  collegePath,
  examPath,
  mbaPublishedRoutes,
  nirfRowFor,
  profileColleges,
} from "@/lib/mbaRoutes.mjs";

/**
 * Everything the public MBA / CAT pages derive from the build-time snapshot
 * (src/data/mbaSnapshot.ts, written by scripts/generate-mba-snapshot.mjs from
 * procounsel-neet-api/data/mba). No figure on those pages is typed in by hand
 * except the CAT 2026 dates below, which are not in cat_exam.json and are copied,
 * with their official sources, from procounsel-neet-api/data/mba/SOURCES.md §3.
 */

/** The IIMs (programs/), which the eligibility tool and the IIM tables cover. */
export const MBA_INSTITUTES: MbaCollege[] = MBA_SNAPSHOT.institutes;
/** Every institute with a profile page: the IIMs, then other verified colleges. */
export const ALL_COLLEGES: MbaCollege[] = profileColleges(MBA_SNAPSHOT);
export const CAT_EXAM = MBA_SNAPSHOT.catExam;
export const CAT_LATEST = CAT_EXAM.versions[0];

// URL architecture: src/lib/mbaRoutes.mjs (shared with the build scripts) and
// docs/MBA-SEO-BLUEPRINT.md.
export const MBA_HUB_PATH = MBA_PATHS.hub;
export const CAT_PATTERN_PATH = examPath("cat");
export const ELIGIBILITY_TOOL_PATH = MBA_PATHS.predictor;
export const SCORE_CALCULATOR_PATH = MBA_PATHS.scoreCalculator;
export const FREE_MOCKS_PATH = MBA_PATHS.freeMocks;
export const PYQ_PAPERS_PATH = MBA_PATHS.pyqPapers;
export const IIM_CUTOFFS_PATH = MBA_PATHS.iimCutoffs;
export const MBA_COUNSELLING_PATH = MBA_PATHS.counselling;
export const institutePath = collegePath;

/** Every public MBA URL the bundled snapshot can render (the same list the build prerenders). */
export const PUBLISHED_MBA_ROUTES: ReadonlySet<string> = new Set(mbaPublishedRoutes(MBA_SNAPSHOT));
export const isPublished = (path: string): boolean => PUBLISHED_MBA_ROUTES.has(path);

export const getInstitute = (slug: string | undefined): MbaCollege | undefined =>
  slug ? ALL_COLLEGES.find((i) => i.slug === slug) : undefined;

export const NIRF = MBA_SNAPSHOT.nirf;
/** An exam's official facts from exams/<id>.json (CAT's supplement the pattern in cat_exam.json). */
export const examInfo = (id: string): ExamInfo | undefined => MBA_SNAPSHOT.exams.find((e) => e.id === id);
/** Schools checked for an official CAT cut-off that publish none (never placed in a band). */
export const MBA_SNAPSHOT_NOT_PUBLISHED = MBA_SNAPSHOT.catCutoffNotPublished;
export const nirfFor = (college: MbaCollege): NirfRow | null => nirfRowFor(MBA_SNAPSHOT, college);

/** "11 Nov 2026" from "2026-11-11". */
export function formatDay(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${d} ${month} ${y}`;
}

/** The date every figure on the public pages was last checked against its source. */
export const LAST_VERIFIED = formatDay(MBA_SNAPSHOT.retrievedAt);
export const LAST_VERIFIED_ISO = MBA_SNAPSHOT.retrievedAt ?? undefined;

/** ₹27,50,000 — Indian digit grouping, no decimals. */
export function formatInr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not published";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** 27.5 lakh — for prose. */
export function formatLakh(value: number): string {
  const lakh = value / 100000;
  return `₹${Number(lakh.toFixed(2)).toString()} lakh`;
}

export const pct = (value: number | null | undefined): string =>
  value === null || value === undefined ? "—" : String(value);

// ── CAT 2026 dates (SOURCES.md §3) ────────────────────────────────────────────

const CAT_2026_BULLETIN: Source = {
  kind: "official",
  title: "CAT 2026 Information Bulletin (26 Jul 2026)",
  url: "https://cdn.digialm.com/per/g06/pub/32842/EForms/image/CAT2026/CAT_2026_Information_Bulletin_26-07-26.pdf",
  year: 2026,
  retrievedAt: "2026-11-11",
};
const CAT_2026_PRESS: Source = {
  kind: "official",
  title: "CAT 2026 Press Release, IIM Indore (26 Jul 2026)",
  url: "https://cdn.digialm.com/per/g06/pub/32842/EForms/image/CAT2026/CAT_2026_Press_Release_26-07-2026.pdf",
  year: 2026,
  retrievedAt: "2026-11-11",
};
const CAT_2026_DEADLINE_RELEASE: Source = {
  kind: "official",
  title: "CAT 2026 Media Release (22 Sep 2026)",
  url: "https://cdn.digialm.com/per/g06/pub/32842/EForms/image/CAT2026/CAT_2026_Media_Release_22-09-2026.pdf",
  year: 2026,
  retrievedAt: "2026-11-11",
};
/** The most recent official document that states the marking scheme. */
export const CAT_MARKING_SOURCE: Source = {
  kind: "official",
  title: "CAT 2023 Result Media Release, IIM Lucknow (21 Dec 2023)",
  url: "https://cdn.digialm.com/per/g01/pub/756/ASM/WebPortal/12/PDF/Media_Release_CAT_2023_21st_Dec_2023.pdf",
  year: 2023,
  retrievedAt: "2026-11-11",
};
/** States the PwD timing (160 minutes) and the CAT 2025 question counts. */
export const CAT_2025_MEDIA_RELEASE: Source = {
  kind: "official",
  title: "CAT 2025 Media Release (1 Dec 2025)",
  url: "https://cdn.digialm.com/per/g06/pub/32842/EForms/image/CAT2025/CAT_2025_Media_Release_01_Dec_2025.pdf",
  year: 2025,
  retrievedAt: "2026-11-11",
};

export interface CatKeyDate {
  label: string;
  value: string;
  tentative?: boolean;
  source: Source;
}

export const CAT_2026_EXAM_DATE_ISO = "2026-11-29";

export const CAT_2026_KEY_DATES: CatKeyDate[] = [
  { label: "Registration closed", value: "22 Sep 2026, 5 PM (extended from 15 Sep 2026)", source: CAT_2026_DEADLINE_RELEASE },
  { label: "Admit card download", value: "4 Nov to 29 Nov 2026", source: CAT_2026_BULLETIN },
  { label: "Exam date", value: "Sunday, 29 Nov 2026, in three sessions", source: CAT_2026_PRESS },
  {
    label: "Result",
    value: "“likely to be declared by the First week of January, 2027” (no exact date published)",
    tentative: true,
    source: CAT_2026_BULLETIN,
  },
  { label: "Score valid until", value: "31 Dec 2027", source: CAT_2026_BULLETIN },
];

// ── Eligibility copy ──────────────────────────────────────────────────────────

/*
 * The API returns `methodology` and `limitations` with every POST /eligibility
 * response, and those are what the tool shows next to results. These are the
 * same texts (procounsel-neet-api api/mba/programs.py) so the prerendered page —
 * which cannot call the API — carries them too.
 */
export const ELIGIBILITY_METHODOLOGY =
  "For each institute we take the most recent official admission policy we hold and look up the " +
  "minimum CAT percentiles it publishes for your category (and PwD status) for the first, " +
  "CAT-based shortlisting stage. Your overall percentile and each sectional percentile you entered " +
  "(VARC, DILR, QA) are compared with those minimums: a value equal to or above the minimum passes. " +
  "'meets_minimum' means you are at or above every published minimum; 'below_minimum' lists the " +
  "parts you are below; 'unknown' means the institute has not published a minimum for your " +
  "category, we do not hold its policy, or you left out a sectional percentile it sets a minimum for.";

export const ELIGIBILITY_LIMITATIONS =
  "These are MINIMUM ELIGIBILITY THRESHOLDS for being considered, not closing percentiles or " +
  "final cut-offs. Institutes state that the percentiles actually needed for an interview call are " +
  "usually much higher, and they depend on the applicant pool. Meeting the minimum does not mean " +
  "you will be shortlisted or admitted: each IIM then ranks eligible candidates on a composite score " +
  "that also uses Class X/XII and graduation marks, work experience, gender/academic diversity, and " +
  "later the written ability test (WAT/AWT) and personal interview, as set out in its own admission " +
  "policy. Some policies also set non-CAT minimums (for example Class X/XII or graduation " +
  "percentages) and require a positive or non-negative raw score in every CAT section; those are " +
  "mentioned in the notes but not checked here. Thresholds may come from the previous year's policy " +
  "where the current one is not yet published (see policyBatch) and can change. This tool makes no " +
  "admission-probability claims; always check the official policy linked in each result.";

// ── Thresholds ────────────────────────────────────────────────────────────────

export interface ThresholdRow {
  institute: InstituteDetail;
  program: ProgramDetail | undefined;
  programCode: string;
  policyBatch: string;
  /** One record, or one per gender where the policy splits by gender. */
  records: Cutoff[];
  source: OfficialSource;
}

/** Latest policy batch's records for one programme of an institute. */
function latestRecords(inst: InstituteDetail, programCode: string): Cutoff[] {
  const forProgram = inst.cutoffs.filter((c) => c.programCode === programCode);
  if (forProgram.length === 0) return [];
  const batch = forProgram.map((c) => c.policyBatch).sort().pop()!;
  return forProgram.filter((c) => c.policyBatch === batch);
}

/** Programme codes that have thresholds, in the institute's programme order. */
export function programsWithCutoffs(inst: InstituteDetail): string[] {
  const codes = new Set(inst.cutoffs.map((c) => c.programCode));
  const ordered = inst.programs.map((p) => p.code).filter((c) => codes.has(c));
  return [...ordered, ...[...codes].filter((c) => !ordered.includes(c))];
}

const GENDER_ORDER = { Male: 0, Female: 1, Transgender: 2 } as const;

/**
 * The record(s) a (category, pwd) applicant is held to for each programme with
 * thresholds. Rows with no record for the category are still returned (empty
 * `records`) so a table can say "not published" rather than drop the institute.
 */
export function thresholdRows(
  inst: InstituteDetail,
  category: MbaCategory,
  pwd: boolean,
): ThresholdRow[] {
  return programsWithCutoffs(inst).map((code) => {
    const latest = latestRecords(inst, code);
    const records = latest
      .filter((c) => c.category === category && c.pwd === pwd)
      .sort((a, b) => (a.gender ? GENDER_ORDER[a.gender] : -1) - (b.gender ? GENDER_ORDER[b.gender] : -1));
    return {
      institute: inst,
      program: inst.programs.find((p) => p.code === code),
      programCode: code,
      policyBatch: latest[0].policyBatch,
      records,
      source: (records[0] ?? latest[0]).source,
    };
  });
}

export function allThresholdRows(category: MbaCategory, pwd: boolean): ThresholdRow[] {
  return MBA_INSTITUTES.flatMap((inst) => thresholdRows(inst, category, pwd));
}

/** "IIM Lucknow" or "IIM Lucknow — MBA-ABM" when the institute has several tables. */
export function rowLabel(row: ThresholdRow): string {
  return programsWithCutoffs(row.institute).length > 1
    ? `${row.institute.shortName} (${row.programCode})`
    : row.institute.shortName;
}

/** All official sources cited by the cutoff tables, de-duplicated. */
export function cutoffSources(): OfficialSource[] {
  const seen = new Map<string, OfficialSource>();
  for (const inst of MBA_INSTITUTES) {
    for (const c of inst.cutoffs) if (!seen.has(c.source.url)) seen.set(c.source.url, c.source);
  }
  return [...seen.values()];
}

export const POLICY_BATCHES = MBA_SNAPSHOT.dataFreshness.cutoffPolicyBatches;

/** Institutes whose latest thresholds are already for the 2027-29 batch (CAT 2026). */
export const INSTITUTES_ON_LATEST_BATCH = (() => {
  const latest = [...POLICY_BATCHES].sort().pop();
  return MBA_INSTITUTES.filter((i) => i.cutoffs.some((c) => c.policyBatch === latest));
})();

/** The flagship (first) programme. */
export const flagship = (inst: InstituteDetail): ProgramDetail | undefined => inst.programs[0];

// ── Structured data ───────────────────────────────────────────────────────────

export interface Crumb {
  name: string;
  /** Omitted for the current page. */
  to?: string;
}

/** Home › MBA › … — every MBA page's breadcrumb starts here. */
export const mbaCrumbs = (...rest: Crumb[]): Crumb[] => [{ name: "Home", to: "/" }, { name: "MBA", to: MBA_HUB_PATH }, ...rest];

export function breadcrumbJsonLd(crumbs: Crumb[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.to ?? currentPath),
    })),
  };
}

export interface Faq {
  q: string;
  a: string;
}

/** Shown in every byline; ProCounsel is the publisher, never the institute. */
export const EDITORIAL_AUTHOR = "ProCounsel Editorial Team";
export const REVIEWER = "ProCounsel counselling team";

const ORG = { "@type": "Organization", name: "ProCounsel", url: absoluteUrl("/") };

/** Article schema for an editorial page; author is the organisation unless a real person is named. */
export function articleJsonLd({
  headline,
  description,
  path,
  dateModified,
  datePublished,
}: {
  headline: string;
  description: string;
  path: string;
  dateModified?: string | null;
  datePublished?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    author: { ...ORG, name: EDITORIAL_AUTHOR },
    publisher: ORG,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

/** ItemList for a list that is rendered on the page; `url` only where we link the item. */
export function itemListJsonLd(name: string, items: { name: string; path?: string | null }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.path ? { url: absoluteUrl(it.path) } : {}),
    })),
  };
}

/**
 * Describes the institute on its own profile page — the institute, not
 * ProCounsel. `url`/`sameAs` are the institute's official website.
 */
export function educationalOrganizationJsonLd(c: MbaCollege) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: c.name,
    alternateName: c.shortName !== c.name ? c.shortName : undefined,
    ...(c.website ? { url: c.website, sameAs: [c.website] } : {}),
    ...(c.city || c.state
      ? {
          address: {
            "@type": "PostalAddress",
            ...(c.city ? { addressLocality: c.city } : {}),
            ...(c.state ? { addressRegion: c.state } : {}),
            addressCountry: "IN",
          },
        }
      : {}),
  };
}

/** Only for FAQs that are rendered visibly on the same page. */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

/** HowTo for a tool's "how to use it" steps — only steps rendered visibly on the same page (<HowToSteps />). */
export function howToJsonLd(name: string, path: string, steps: HowToStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    url: absoluteUrl(path),
    totalTime: "PT2M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${absoluteUrl(path)}#how-to-use`,
    })),
  };
}

/**
 * Lowest and highest published overall minimum for a (category, non-PwD)
 * applicant across every programme table — used in the pages' opening answers
 * so the prose can never drift from the data.
 */
export function overallRange(category: MbaCategory = "General") {
  const entries = allThresholdRows(category, false).flatMap((row) =>
    row.records
      .filter((r) => r.overall !== null)
      .map((r) => ({ value: r.overall as number, name: row.institute.shortName })),
  );
  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const namesAt = (v: number) => [...new Set(entries.filter((e) => e.value === v).map((e) => e.name))];
  return { min, max, minNames: namesAt(min), maxNames: namesAt(max) };
}

/** "IIM A and IIM B" / "IIM A, IIM B and IIM C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "85 in each section" / "VARC 80, DILR 75 and QA 80" / "" when none. */
function sectionalPhrase(r: Cutoff): string {
  const parts = [r.varc, r.dilr, r.qa];
  if (parts.every((v) => v === null)) return "";
  if (parts.every((v) => v !== null && v === parts[0])) return `${parts[0]} in each section`;
  return `VARC ${pct(r.varc)}, DILR ${pct(r.dilr)} and QA ${pct(r.qa)}`;
}

/**
 * Plain-English minimum for one group's record(s), e.g.
 * "95 overall and 85 in each section" or "91 overall (Male), 89 overall (Female)".
 * Returns null when there is no record.
 */
export function describeMinimum(records: Cutoff[]): string | null {
  if (records.length === 0) return null;
  const one = (r: Cutoff) => {
    const sectional = sectionalPhrase(r);
    if (r.overall === null) return sectional ? `no overall minimum but ${sectional}` : "no CAT percentile minimum";
    return sectional ? `${r.overall} overall and ${sectional}` : `${r.overall} overall`;
  };
  if (records.length === 1 && !records[0].gender) return one(records[0]);
  return records.map((r) => `${one(r)} (${r.gender ?? "all genders"})`).join("; ");
}

// ── Percentile bands ──────────────────────────────────────────────────────────

/** One programme's published CAT figure(s) for one category, from any source. */
export interface PercentileRow {
  key: string;
  name: string;
  /** Profile slug, when the institute has a page. */
  slug: string | null;
  isIim: boolean;
  programme: string;
  batch: string;
  kind: "minimum" | "shortlisting" | "closing" | "final";
  records: Pick<Cutoff, "overall" | "varc" | "dilr" | "qa" | "gender">[];
  /** The figure the institute is placed in a band by (see bandFigure in mbaRoutes.mjs). */
  figure: number | null;
  notes: string | null;
  source: OfficialSource;
}

/** What each stage of a published CAT figure means, in the words every page uses. */
export const CUTOFF_KIND_LABEL: Record<PercentileRow["kind"], string> = {
  minimum: "Minimum to apply / be considered",
  shortlisting: "Shortlisting cut-off",
  closing: "Closing percentile",
  final: "Previous-year final cut-off",
};

export type BandStatus = "meets" | "below" | "no-overall";

export function bandStatus(row: PercentileRow, p: number): BandStatus {
  if (row.figure === null) return "no-overall";
  return row.figure <= p ? "meets" : "below";
}

/**
 * Every published CAT figure for a category: the official minimums in each
 * profile (IIM policies, colleges/) plus cat-cutoffs/ sets for institutes whose
 * profile has none. One row per programme; rows with no record for the
 * category are left out.
 */
export function percentileRows(category: MbaCategory, pwd = false): PercentileRow[] {
  const rows: PercentileRow[] = [];
  const covered = new Set<string>();
  for (const inst of ALL_COLLEGES) {
    const codes = programsWithCutoffs(inst);
    for (const row of thresholdRows(inst, category, pwd)) {
      if (row.records.length === 0) continue;
      covered.add(inst.slug);
      rows.push({
        key: `${inst.slug}:${row.programCode}`,
        name: codes.length > 1 ? `${inst.shortName} (${row.programCode})` : inst.shortName,
        slug: inst.slug,
        isIim: inst.group === "IIM",
        programme: row.program?.name ?? row.programCode,
        batch: row.policyBatch,
        kind: "minimum",
        records: row.records,
        figure: pwd ? null : bandFigure(row.records, category),
        notes: row.records.find((r) => r.notes)?.notes ?? null,
        source: row.source,
      });
    }
  }
  for (const set of MBA_SNAPSHOT.catCutoffs) {
    if (set.profileSlug && covered.has(set.profileSlug)) continue;
    const profile = set.profileSlug ? getInstitute(set.profileSlug) : undefined;
    const mine = set.records.filter((r) => r.category === category && r.pwd === pwd);
    if (mine.length === 0) continue;
    const latest = mine.map((r) => r.label).sort().pop()!;
    const recs = mine.filter((r) => r.label === latest);
    // One row per stage for the latest batch, lowest-stage first.
    for (const kind of [...new Set(recs.map((r) => r.kind))]) {
      const group = recs.filter((r) => r.kind === kind);
      const name = profile?.shortName ?? set.shortName ?? set.name ?? set.slug;
      rows.push({
        key: `${set.slug}:${kind}`,
        name,
        slug: profile?.slug ?? null,
        isIim: false,
        programme: group[0].programme ?? "",
        batch: latest,
        kind,
        records: group,
        figure: pwd ? null : bandFigure(group, category),
        notes: group.find((r) => r.notes)?.notes ?? null,
        source: group[0].source,
      });
    }
  }
  return rows.sort((a, b) => (b.figure ?? -1) - (a.figure ?? -1) || a.name.localeCompare(b.name));
}
