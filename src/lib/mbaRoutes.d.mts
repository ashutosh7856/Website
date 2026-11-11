/** Types for mbaRoutes.mjs (plain JS so the Node build scripts can import it too). */

/** The subset of the MBA snapshot the publishing rule reads. */
export interface RoutableCollege {
  slug: string;
  name: string;
  city: string | null;
  shortName?: string;
  specialisations?: string[];
  acceptedExams?: string[];
  keyDates?: RoutableKeyDates | null;
  programs?: { name: string; feeTotal: number | null; medianSalary: number | null }[];
  cutoffs?: BandRecord[];
  nirfInstituteId?: string | null;
}
export interface RoutableSource {
  kind: "official";
  title: string;
  url: string;
  year: number | null;
  retrievedAt: string;
}
/** An institute's admission dates (colleges/ keyDates): "YYYY-MM-DD" or "YYYY-MM". */
export interface RoutableKeyDates {
  applicationOpens: string | null;
  applicationDeadline: string | null;
  examDate: string | null;
  notes: string | null;
  tentative: boolean;
  source: RoutableSource;
}
/** One sourced specialisations.json entry. */
export interface SpecialisationListing {
  /** MBA_SPECIALISATIONS slug. */
  spec: string;
  slug: string;
  /** The published profile it belongs to, when there is one. */
  profileSlug: string | null;
  institute: string;
  programme: string | null;
  basis?: string | null;
  evidence: string | null;
  source: RoutableSource;
}
export interface BandRecord {
  category: string;
  pwd: boolean;
  overall: number | null;
  gender?: string | null;
  policyBatch?: string;
  label?: string;
}
export interface RoutableNirfRow {
  rank: number;
  name: string;
  city: string;
  slug?: string | null;
  nirfInstituteId?: string | null;
}
export interface RoutableSnapshot {
  catExam?: unknown;
  institutes: RoutableCollege[];
  colleges?: RoutableCollege[];
  exams?: {
    id: string;
    shortName?: string;
    facts?: { label: string }[];
    dates?: { label: string; iso?: string | null; tentative: boolean; note: string | null; source: RoutableSource }[];
  }[];
  specialisationListings?: SpecialisationListing[];
  catCutoffs?: {
    slug: string;
    profileSlug?: string | null;
    records: BandRecord[];
  }[];
  capMeta?: { cityCounts: Record<string, number> } | null;
  nirf?: { rankings: RoutableNirfRow[] } | null;
}

export declare const MBA_PATHS: Readonly<{
  counselling: string;
  hub: string;
  colleges: string;
  iimCutoffs: string;
  exams: string;
  specialisations: string;
  resources: string;
  fees: string;
  placements: string;
  predictor: string;
  scoreCalculator: string;
  freeMocks: string;
  compare: string;
  roiCalculator: string;
  deadlines: string;
  eligibility: string;
  courses: string;
}>;

export declare function collegePath(slug: string): string;
export declare function percentilePath(p: number): string;
export declare function cityPath(slug: string): string;
export declare function examPath(id: string): string;
export declare function specialisationPath(slug: string): string;
export declare function percentileFromSlug(slug: string | undefined): number | null;

export declare const MBA_PERCENTILES: number[];
export declare const PHASE1_PERCENTILES: number[];
export declare const MIN_INSTITUTES_PER_BAND: number;

export interface MbaExamEntry {
  id: string;
  short: string;
  name: string;
}
export declare const MBA_EXAMS: MbaExamEntry[];

export interface MbaCityEntry {
  slug: string;
  name: string;
  aliases: string[];
  priority: boolean;
}
export declare const MBA_CITIES: MbaCityEntry[];
export declare const MIN_INSTITUTES_PRIORITY_CITY: number;
export declare const MIN_INSTITUTES_CITY: number;

export interface MbaSpecialisationEntry {
  slug: string;
  name: string;
  /** For titles, where the full name does not fit. */
  short?: string;
  match: string[];
}
export declare const MBA_SPECIALISATIONS: MbaSpecialisationEntry[];
export declare const MIN_COLLEGES_PER_SPECIALISATION: number;

export declare const MBA_GUIDE_PATHS: string[];

export declare function profileColleges<C extends RoutableCollege>(snapshot: {
  institutes: C[];
  colleges?: C[];
}): C[];
export declare function citySlugFor(cityName: string | null | undefined): string | null;
export declare function nirfRowFor<R extends RoutableNirfRow>(
  snapshot: { nirf?: { rankings: R[] } | null },
  college: RoutableCollege,
): R | null;
export declare function institutesInCity<C extends RoutableCollege, R extends RoutableNirfRow>(
  snapshot: { institutes: C[]; colleges?: C[]; nirf?: { rankings: R[] } | null },
  citySlug: string,
): { name: string; slug: string | null; nirf: R | null }[];
export declare function publishedCities(snapshot: RoutableSnapshot): string[];
export declare function specialisationSlugFor(name: string | null | undefined): string | null;
export declare function collegesOffering<C extends RoutableCollege>(
  snapshot: { institutes: C[]; colleges?: C[]; specialisationListings?: SpecialisationListing[] },
  specSlug: string,
): C[];
export declare function unprofiledOffering(
  snapshot: { specialisationListings?: SpecialisationListing[] },
  specSlug: string,
): SpecialisationListing[];

export interface DeadlineRow {
  id: string;
  kind: "college" | "exam";
  name: string;
  /** Profile slug (college) or MBA_EXAMS id (exam). */
  slug: string;
  event: string;
  /** "YYYY-MM-DD", or "YYYY-MM" when the source gives only the month. */
  date: string;
  precision: "day" | "month";
  /** MBA_EXAMS ids the row applies to. */
  exams: string[];
  tentative: boolean;
  note: string | null;
  source: RoutableSource;
}
export declare const INTAKE_2027_WINDOW: Readonly<{ from: string; to: string }>;
export declare const MIN_DEADLINE_ROWS: number;
export declare function deadlineRows(snapshot: RoutableSnapshot): DeadlineRow[];
export declare function examsWithEligibility<E extends { id: string; facts?: { label: string }[] }>(snapshot: {
  exams?: E[];
}): E[];
export declare function publishedSpecialisations(snapshot: RoutableSnapshot): string[];
export declare function publishedExams(snapshot: RoutableSnapshot): string[];
export declare const OLDEST_BAND_BATCH_YEAR: number;
export declare function bandFigure(records: BandRecord[] | undefined, category?: string): number | null;
export declare function bandInstitutes(snapshot: RoutableSnapshot): { slug: string; overall: number; isIim: boolean }[];
export declare function bandCount(snapshot: RoutableSnapshot, p: number): number;
export declare function publishedPercentiles(snapshot: RoutableSnapshot): number[];
export declare function publishedCollegeSlugs(snapshot: RoutableSnapshot): string[];
export declare function mbaPublishedRoutes(snapshot: RoutableSnapshot | null | undefined): string[];
