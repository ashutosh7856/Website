/**
 * Types for `generate-mba-snapshot.mjs`, so the generator's tests can import it
 * (same reason as site-routes.d.mts). Only what a TypeScript caller uses.
 */
import type { MbaSnapshot } from "../src/data/mbaSnapshot";
import type { CapCutoffs, CapMeta, CatCutoffSet, ExamInfo, MbaCollege, PyqPaper, SpecialisationListing } from "../src/data/mbaSnapshotTypes";

export declare const FRESHNESS_NOTE: string;
export declare function stripQuotes<T>(value: T): T;
export declare function buildCollege(raw: unknown, expectedSlug?: string): MbaCollege;
export declare function buildExamInfo(raw: unknown, expectedId?: string): ExamInfo;
export declare function buildCatCutoffSet(raw: unknown, expectedSlug?: string): Omit<CatCutoffSet, "profileSlug">;
export declare const EXCLUDED_CUTOFF_SETS: Map<string, string>;
export declare function buildSpecialisationListings(
  raw: unknown,
  profiles?: { slug: string; name: string; shortName: string }[],
): SpecialisationListing[];
export declare function buildPyqPaper(raw: unknown, expectedId?: string): PyqPaper;
export declare function buildCapCutoffs(raw: unknown): { meta: CapMeta; rows: CapCutoffs["rows"] };
export declare function buildMbaSnapshot(raw: {
  catExam: unknown;
  programs: { slug: string; data: unknown }[];
  colleges?: { slug: string; data: unknown }[];
  exams?: { slug: string; data: unknown }[];
  catCutoffs?: { slug: string; data: unknown }[];
  catCutoffIndex?: unknown;
  capCutoffs?: unknown;
  nirf?: unknown;
  specialisations?: unknown;
  pyqPapers?: { slug: string; data: unknown }[];
}): MbaSnapshot;
export declare function renderSnapshotModule(snapshot: MbaSnapshot): string;
export declare function main(options?: {
  dataDir?: string;
  tsPath?: string;
  routesPath?: string;
  capPath?: string;
}): Promise<{ written: boolean; snapshot?: MbaSnapshot; routes?: string[] }>;
