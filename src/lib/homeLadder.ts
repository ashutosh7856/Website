import type { MbaSnapshot } from "@/data/mbaSnapshotTypes";

/**
 * The home hero's CAT ladder: schools grouped into rungs by the minimum
 * overall CAT percentile they publish for General, non-PwD candidates of all
 * genders. Derived from the MBA snapshot, but the hero imports the small
 * pre-computed copy in src/data/homeCatLadder.ts so the 600 KB snapshot never
 * reaches the home page bundle. src/test/homeFocus.test.tsx re-derives it
 * from the snapshot and fails if the two drift.
 *
 * Every figure is a published minimum (a shortlisting floor), never a closing
 * cut-off. Schools whose minimum is gender-specific, sectional only, or a
 * different kind of figure (an interview-call cut-off, a stale disclosure)
 * are left out rather than approximated.
 */

export interface LadderSchool {
  name: string;
  /** Batch the minimum applies to, e.g. "2026-28". */
  batch: string;
  /** Profile path, when we publish one. */
  to: string | null;
}

export interface LadderRung {
  /** Published minimum overall CAT percentile. */
  cutoff: number;
  schools: LadderSchool[];
}

export interface CatLadder {
  retrievedAt: string | null;
  batches: string[];
  rungs: LadderRung[];
}

/** Non-IIMs whose catCutoffs entry is a published overall minimum for everyone. */
export const LADDER_OTHER_SCHOOLS: Record<string, string> = {
  spjimr: "SPJIMR Mumbai",
  "vgsom-iit-kharagpur": "VGSoM IIT Kharagpur",
  "ime-iit-kanpur": "DoMS IIT Kanpur",
  "ifmr-gsb-krea": "IFMR GSB Krea",
  "imt-nagpur": "IMT Nagpur",
};

export function deriveCatLadder(snapshot: MbaSnapshot): CatLadder {
  const entries: { cutoff: number; school: LadderSchool }[] = [];

  for (const iim of snapshot.institutes) {
    const c = iim.cutoffs.find((x) => x.category === "General" && !x.pwd && x.gender === null && x.overall !== null);
    if (!c || c.overall === null) continue;
    entries.push({
      cutoff: c.overall,
      school: { name: iim.shortName, batch: c.policyBatch, to: `/mba-colleges/${iim.slug}` },
    });
  }

  for (const set of snapshot.catCutoffs) {
    const name = LADDER_OTHER_SCHOOLS[set.slug];
    if (!name) continue;
    const general = set.records.filter((r) => r.category === "General" && !r.pwd && r.gender === null);
    if (general.length !== 1 || general[0].overall === null) continue;
    entries.push({
      cutoff: general[0].overall,
      school: { name, batch: general[0].label, to: set.profileSlug ? `/mba-colleges/${set.profileSlug}` : null },
    });
  }

  const byCutoff = new Map<number, LadderSchool[]>();
  for (const e of entries) byCutoff.set(e.cutoff, [...(byCutoff.get(e.cutoff) ?? []), e.school]);

  const rungs = [...byCutoff.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([cutoff, schools]) => ({
      cutoff,
      // IIMs first, then the rest, each alphabetical: reads like a printed list.
      schools: [...schools].sort((a, b) => {
        const ai = a.name.startsWith("IIM ") ? 0 : 1;
        const bi = b.name.startsWith("IIM ") ? 0 : 1;
        return ai - bi || a.name.localeCompare(b.name);
      }),
    }));

  const batches = [...new Set(entries.map((e) => e.school.batch))].sort();
  return { retrievedAt: snapshot.retrievedAt, batches, rungs };
}

/** Rungs whose published minimum the percentile meets ("at least" = equal counts). */
export function schoolsWithinReach(ladder: CatLadder, percentile: number): number {
  return ladder.rungs.filter((r) => percentile >= r.cutoff).reduce((n, r) => n + r.schools.length, 0);
}
