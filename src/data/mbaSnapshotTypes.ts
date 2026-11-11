import type { DataFreshness, Exam, InstituteDetail, MbaCategory, MbaGender, OfficialSource } from "@/api/mba";

/**
 * Shapes of the build-time MBA snapshot (src/data/mbaSnapshot.ts, written by
 * scripts/generate-mba-snapshot.mjs). The institute records keep the API
 * contract's InstituteDetail shape; everything else here exists only in the
 * snapshot, so it lives here rather than in src/api/mba.ts (the API contract).
 */

/** A labelled, sourced statement: "Established: 1961", "Mode: Computer-based". */
export interface SourcedFact {
  label: string;
  value: string;
  note: string | null;
  tentative: boolean;
  source: OfficialSource;
  /** Exam dates only: the exact day as YYYY-MM-DD, when the source gives one. */
  iso?: string | null;
}

/** An institute's 2027-intake admission dates from its own admission page. */
export interface CollegeKeyDates {
  /** "YYYY-MM-DD", or "YYYY-MM" when only the month is published. */
  applicationOpens: string | null;
  applicationDeadline: string | null;
  examDate: string | null;
  /** The institute's other stated steps (interviews, results), as recorded from the source. */
  notes: string | null;
  tentative: boolean;
  source: OfficialSource;
}

/** One specialisations.json entry: an institute that offers a specialisation, with evidence. */
export interface SpecialisationListing {
  spec: string;
  slug: string;
  profileSlug: string | null;
  institute: string;
  programme: string | null;
  /** How it is offered: "dedicated programme", "named specialisation", "area of specialisation (electives)". */
  basis: string | null;
  evidence: string | null;
  source: OfficialSource;
}

/** Profile fields every institute carries, IIM or not. */
export interface CollegeExtras {
  group: "IIM" | "Other";
  /** As the institute's own documents describe it; null when not in our data. */
  ownership: string | null;
  /** MBA_EXAMS ids (src/lib/mbaRoutes.mjs) the institute's official data says it accepts. */
  acceptedExams: string[];
  /** The official document that lists the accepted exams. */
  acceptedExamsSource: OfficialSource | null;
  specialisations: string[];
  facts: SourcedFact[];
  establishedYear: number | null;
  /** Selection stages as the institute publishes them (empty when not in our data). */
  selectionProcess: { stage: number; name: string; weightage: string | null; detail: string | null }[];
  selectionSource: OfficialSource | null;
  nirfInstituteId: string | null;
  keyDates: CollegeKeyDates | null;
}

export type MbaCollege = InstituteDetail & CollegeExtras;

/** An entrance exam other than CAT, from exams/<id>.json. */
export interface ExamInfo {
  id: string;
  name: string;
  shortName: string;
  conductingBody: string | null;
  officialUrl: string;
  year: number | null;
  sections: { id: string; name: string; questionCount: number | null; durationMinutes: number | null }[];
  totalDurationMinutes: number | null;
  marking: { type: string; correct: number; incorrect: number; unanswered: number }[];
  patternSource: OfficialSource | null;
  facts: SourcedFact[];
  dates: SourcedFact[];
  acceptedBy: string[];
  /** The exam body's own list of accepting institutes. */
  acceptedByUrl: string | null;
  acceptedByNote: string | null;
  /** Marking scheme as the official document words it. */
  markingText: string | null;
  patternNotes: string | null;
  syllabusAreas: string[];
  resultAndCounselling: string | null;
  notes: string | null;
  sources: OfficialSource[];
}

/** One published CAT cut-off figure for a non-IIM (or IIM) programme. */
export interface CatCutoffRecord {
  /** Batch or year label as the source prints it. */
  label: string;
  /** "minimum" = eligibility floor; "shortlisting"/"closing"/"final" = what the source calls it. */
  kind: "minimum" | "shortlisting" | "closing" | "final";
  programme: string | null;
  category: MbaCategory;
  pwd: boolean;
  gender: MbaGender | null;
  overall: number | null;
  varc: number | null;
  dilr: number | null;
  qa: number | null;
  notes: string | null;
  source: OfficialSource;
}

export interface CatCutoffSet {
  slug: string;
  name: string | null;
  shortName: string | null;
  city: string | null;
  /** The profile page this set belongs to, when we have one. */
  profileSlug: string | null;
  records: CatCutoffRecord[];
  notes: string | null;
}

/** One MBA/MMS course in the State CET Cell's CAP round cut-off list (OPEN columns). */
export interface CapRow {
  code: string;
  institute: string;
  city: string | null;
  course: string;
  status: string | null;
  /** Closing MAH-CET percentile, OPEN — state-level seats. */
  GOPENS: number | null;
  /** OPEN — home-university seats. */
  GOPENH: number | null;
  /** OPEN — other-than-home-university seats. */
  GOPENO: number | null;
}

export interface CapMeta {
  title: string;
  round: string;
  academicYear: string;
  seatPool: string | null;
  publisher: string;
  source: OfficialSource;
}

export interface CapCutoffs {
  meta: CapMeta | null;
  rows: CapRow[];
}

export interface NirfRow {
  rank: number;
  name: string;
  city: string;
  state: string;
  score: number | null;
  /** Our profile slug when the research pass linked it explicitly. */
  slug: string | null;
  nirfInstituteId: string | null;
}

export interface NirfRanking {
  year: number | null;
  edition: string | null;
  releasedOn: string | null;
  source: OfficialSource;
  releaseSource: OfficialSource | null;
  rankings: NirfRow[];
}

export interface MbaSnapshot {
  /** Latest source retrieval date across all data, YYYY-MM-DD. */
  retrievedAt: string | null;
  dataFreshness: DataFreshness;
  catExam: Exam;
  /** The IIMs, sorted by shortName; same shape as GET /mba/programs/{slug} plus profile extras. */
  institutes: MbaCollege[];
  /** Other institutes with verified data (colleges/), sorted by shortName. */
  colleges: MbaCollege[];
  exams: ExamInfo[];
  catCutoffs: CatCutoffSet[];
  /** Schools checked for an official CAT cut-off that publish none. */
  catCutoffNotPublished: { slug: string; name: string; profileSlug: string | null }[];
  /** Sourced specialisation listings from specialisations.json (may be empty). */
  specialisationListings: SpecialisationListing[];
  nirf: NirfRanking | null;
  /** The CAP list's metadata; its rows live in src/data/mahCapCutoffs.ts. */
  capMeta: (CapMeta & { cityCounts: Record<string, number>; rows: number }) | null;
}
