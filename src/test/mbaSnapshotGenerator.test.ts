import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildCapCutoffs,
  buildCatCutoffSet,
  buildCollege,
  buildExamInfo,
  buildMbaSnapshot,
  buildSpecialisationListings,
  main,
  renderSnapshotModule,
  stripQuotes,
} from "../../scripts/generate-mba-snapshot.mjs";
import { mbaPublishedRoutes } from "@/lib/mbaRoutes.mjs";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";

/**
 * scripts/generate-mba-snapshot.mjs turns procounsel-neet-api/data/mba into the
 * bundled module the public MBA pages render. The source files keep a verbatim
 * `quote` on every source for audit; those must never reach the browser.
 */

const source = (title: string) => ({
  kind: "official",
  title,
  url: `https://example.ac.in/${encodeURIComponent(title)}.pdf`,
  year: 2026,
  retrievedAt: "2026-11-11",
  quote: `VERBATIM ${title}`,
});

const fixture = () => ({
  catExam: {
    id: "cat",
    name: "Common Admission Test (CAT)",
    conductingBody: "IIMs",
    officialUrl: "https://iimcat.ac.in",
    versions: [
      {
        year: 2026,
        sections: [{ id: "VARC", name: "Verbal", questionCount: null, durationMinutes: 40 }],
        marking: [{ type: "MCQ", correct: 3, incorrect: -1, unanswered: 0 }],
        totalDurationMinutes: 120,
        sectionOrderLocked: true,
        source: source("CAT press release"),
      },
    ],
  },
  programs: [
    {
      slug: "iim-test",
      data: {
        slug: "iim-test",
        name: "Indian Institute of Management Test",
        shortName: "IIM Test",
        city: "Test City",
        state: "Test State",
        website: "https://iimtest.ac.in",
        programs: [
          {
            code: "MBA",
            name: "Two-Year MBA",
            durationYears: 2,
            feeTotal: 2000000,
            feeNote: "Fee note",
            feeSource: source("Fee page"),
            intake: 300,
            intakeNote: null,
            intakeSource: source("NIRF"),
            medianSalary: 1800000,
            medianSalaryYear: 2026,
            salaryNote: null,
            salarySource: source("Placement report"),
          },
        ],
        cutoffs: [
          {
            policyBatch: "2026-28",
            stage: "shortlisting",
            programCode: null,
            category: "General",
            pwd: false,
            gender: null,
            overall: 90,
            varc: 80,
            dilr: 80,
            qa: 80,
            notes: "note",
            source: source("Admission policy"),
          },
        ],
        cutoffNotes: null,
      },
    },
  ],
});

describe("stripQuotes", () => {
  it("removes `quote` keys at every depth and leaves everything else", () => {
    const out = stripQuotes({ a: 1, quote: "x", b: [{ quote: "y", c: { quote: "z", d: 2 } }] });
    expect(out).toEqual({ a: 1, b: [{ c: { d: 2 } }] });
  });
});

describe("buildMbaSnapshot", () => {
  it("ships no verbatim quotes, but keeps every official source", () => {
    const snapshot = buildMbaSnapshot(fixture());
    const text = renderSnapshotModule(snapshot);
    expect(text).not.toContain('"quote"');
    expect(text).not.toContain("VERBATIM");

    const inst = snapshot.institutes[0];
    expect(inst.programs[0].feeSource).toEqual({
      kind: "official",
      title: "Fee page",
      url: "https://example.ac.in/Fee%20page.pdf",
      year: 2026,
      retrievedAt: "2026-11-11",
    });
    // Contract shape: programme code resolved, distinct sources, freshness.
    expect(inst.cutoffs[0].programCode).toBe("MBA");
    expect(inst.sources).toHaveLength(4);
    expect(inst.hasCutoffs).toBe(true);
    expect(snapshot.dataFreshness.cutoffPolicyBatches).toEqual(["2026-28"]);
    expect(snapshot.retrievedAt).toBe("2026-11-11");
  });

  it("rejects a source without an official URL", () => {
    const bad = fixture();
    (bad.programs[0].data.cutoffs[0].source as { url?: string }).url = undefined;
    expect(() => buildMbaSnapshot(bad)).toThrow(/url/);
  });
});

describe("main()", () => {
  it("keeps the committed snapshot when the data directory is missing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mba-snap-"));
    const tsPath = join(dir, "mbaSnapshot.ts");
    writeFileSync(tsPath, "// previous snapshot\n");
    const result = await main({ dataDir: join(dir, "nope"), tsPath, routesPath: join(dir, "routes.json"), capPath: join(dir, "cap.ts") });
    expect(result.written).toBe(false);
    expect(readFileSync(tsPath, "utf8")).toBe("// previous snapshot\n");
    expect(existsSync(join(dir, "routes.json"))).toBe(false);
  });

  it("keeps the committed snapshot when the data fails validation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mba-snap-"));
    mkdirSync(join(dir, "data", "programs"), { recursive: true });
    const data = fixture();
    writeFileSync(join(dir, "data", "cat_exam.json"), JSON.stringify(data.catExam));
    writeFileSync(join(dir, "data", "programs", "iim-test.json"), JSON.stringify({ ...data.programs[0].data, slug: "other" }));
    const tsPath = join(dir, "mbaSnapshot.ts");
    writeFileSync(tsPath, "// previous snapshot\n");
    const result = await main({ dataDir: join(dir, "data"), tsPath, routesPath: join(dir, "routes.json"), capPath: join(dir, "cap.ts") });
    expect(result.written).toBe(false);
    expect(readFileSync(tsPath, "utf8")).toBe("// previous snapshot\n");
  });

  it("writes a quote-free module, the CAP module and the route list from a valid data directory", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mba-snap-"));
    mkdirSync(join(dir, "data", "programs"), { recursive: true });
    const data = fixture();
    writeFileSync(join(dir, "data", "cat_exam.json"), JSON.stringify(data.catExam));
    writeFileSync(join(dir, "data", "programs", "iim-test.json"), JSON.stringify(data.programs[0].data));
    const tsPath = join(dir, "mbaSnapshot.ts");
    const routesPath = join(dir, "routes.json");
    const capPath = join(dir, "cap.ts");
    const result = await main({ dataDir: join(dir, "data"), tsPath, routesPath, capPath });
    expect(result.written).toBe(true);
    expect(readFileSync(tsPath, "utf8")).not.toContain("VERBATIM");
    const routes = JSON.parse(readFileSync(routesPath, "utf8"));
    expect(routes).toContain("/mba-colleges/iim-test");
    expect(routes).toContain("/mba-entrance-exams/cat");
    // One IIM is not enough to fill a percentile band (needs five institutes).
    expect(routes.some((r: string) => r.startsWith("/mba-colleges/mba-colleges-at-"))).toBe(false);
    // No optional folder → no exam, city or specialisation pages beyond CAT.
    expect(routes.some((r: string) => r.startsWith("/mba-colleges-in/"))).toBe(false);
    expect(routes).not.toContain("/mba-entrance-exams/xat");
    expect(readFileSync(capPath, "utf8")).toContain("MAH_CAP_CUTOFFS");
  });
});

describe("committed src/data/mbaSnapshot.ts", () => {
  it("carries no quotes and an official source URL on every cutoff and figure", () => {
    expect(JSON.stringify(MBA_SNAPSHOT)).not.toContain('"quote"');
    expect(MBA_SNAPSHOT.institutes.length).toBeGreaterThan(0);
    for (const inst of MBA_SNAPSHOT.institutes) {
      for (const c of inst.cutoffs) expect(c.source.url).toMatch(/^https?:\/\//);
      for (const p of inst.programs) {
        if (p.feeTotal !== null) expect(p.feeSource?.url).toMatch(/^https?:\/\//);
        if (p.medianSalary !== null) expect(p.salarySource?.url).toMatch(/^https?:\/\//);
        if (p.intake !== null) expect(p.intakeSource?.url).toMatch(/^https?:\/\//);
      }
    }
  });
});

// ── Optional folders (colleges/, exams/, cat-cutoffs/, CAP list) ─────────────

const researchCollege = (over: Record<string, unknown> = {}) => ({
  slug: "test-school",
  name: "Test School of Management",
  shortName: "TSM",
  city: "Pune",
  state: "Maharashtra",
  type: "private",
  website: "https://tsm.example.ac.in",
  programs: [
    {
      name: "Post Graduate Diploma in Management (PGDM)",
      durationYears: 2,
      examsAccepted: ["CAT", "XAT"],
      specialisations: ["Finance", "Marketing"],
      feeTotal: 2000000,
      feeYear: "2027-29",
      feeNote: "Tuition and hostel.",
      intake: 120,
      medianSalary: 1500000,
      averageSalary: 1700000,
      salaryYear: "2024-26 batch final placements",
      placementNote: "Official report.",
      sources: { fee: "https://tsm.example.ac.in/fee.pdf", intake: null, salary: "https://tsm.example.ac.in/placements.pdf", admission: "https://tsm.example.ac.in/admission.pdf" },
    },
  ],
  selectionProcess: [{ stage: 1, name: "Shortlist on CAT", weightage: "CAT 60%", detail: null }],
  officialCutoffs: [
    { exam: "CAT", batch: "2027-29", category: "GN/EWS", overall: 85, sectional: { VARC: 70, DILR: 70, QA: 70 }, stage: "shortlisting", source: "https://tsm.example.ac.in/admission.pdf" },
    { exam: "CAT", batch: "2027-29", category: "GEN", overall: 45, metric: "Composite score (CAT 70% + academics), not CAT percentile", stage: "shortlisting", source: "https://tsm.example.ac.in/admission.pdf" },
    { exam: "MAH-MBA/MMS CET", batch: "2026-28", category: "General", overall: 99.1, stage: "final", source: "https://cetcell.example.gov.in/cap.pdf" },
  ],
  keyDates: { applicationOpens: "2026-09-01", applicationDeadline: "2026-11-30", notes: null, source: "https://tsm.example.ac.in/admission.pdf" },
  sources: [
    { title: "TSM fee notice", url: "https://tsm.example.ac.in/fee.pdf", retrievedAt: "2026-11-11", quote: "VERBATIM fee" },
    { title: "TSM admission policy", url: "https://tsm.example.ac.in/admission.pdf", retrievedAt: "2026-11-11" },
  ],
  ...over,
});

describe("colleges/ (research shape)", () => {
  it("maps fees, salary, exams, specialisations and CAT cut-offs with their sources", () => {
    const c = buildCollege(researchCollege(), "test-school");
    expect(c.group).toBe("Other");
    expect(c.programs[0]).toMatchObject({ code: "PGDM", feeTotal: 2000000, medianSalary: 1500000, medianSalaryYear: 2026 });
    expect(c.programs[0].feeSource?.title).toBe("TSM fee notice");
    expect(c.acceptedExams).toEqual(["cat", "xat"]);
    expect(c.specialisations).toEqual(["Finance", "Marketing"]);
    // "GN/EWS" applies to both groups; sectional map becomes varc/dilr/qa.
    expect(c.cutoffs.map((x) => x.category).sort()).toEqual(["EWS", "General"]);
    expect(c.cutoffs[0]).toMatchObject({ overall: 85, varc: 70, dilr: 70, qa: 70 });
    expect(JSON.stringify(c)).not.toContain("VERBATIM");
  });

  it("never turns a composite score or another exam's closing figure into a CAT percentile", () => {
    const c = buildCollege(researchCollege(), "test-school");
    expect(c.cutoffs.some((x) => x.overall === 45 || x.overall === 99.1)).toBe(false);
    const composite = c.facts.find((f) => f.value.startsWith("45"));
    expect(composite?.note).toMatch(/not a CAT percentile/);
    const cap = c.facts.find((f) => f.value === "99.1");
    expect(cap?.note).toMatch(/MAH-CET basis; not a CAT percentile/);
  });

  it("is not published without a sourced fee or salary, or without sourced admission information", () => {
    const noMoney = researchCollege();
    (noMoney.programs as Record<string, unknown>[])[0] = { ...(noMoney.programs as Record<string, unknown>[])[0], feeTotal: null, medianSalary: null };
    expect(() => buildCollege(noMoney, "test-school")).toThrow(/fee or salary/);
    const noAdmission = researchCollege({ selectionProcess: [], officialCutoffs: [] });
    (noAdmission.programs as Record<string, unknown>[])[0] = {
      ...(noAdmission.programs as Record<string, unknown>[])[0],
      examsAccepted: [],
      sources: { fee: "https://tsm.example.ac.in/fee.pdf", salary: null, intake: null, admission: null },
    };
    expect(() => buildCollege(noAdmission, "test-school")).toThrow(/admission or selection/);
  });
});

describe("exams/ (research shape)", () => {
  const exam = {
    id: "xat",
    name: "XAT",
    fullName: "Xavier Aptitude Test",
    conductingBody: "XLRI",
    officialUrl: "https://xatonline.in/",
    cycle: "XAT 2027",
    eligibility: "A bachelor's degree.",
    mode: "Computer-based",
    pattern: { sections: [{ name: "Decision Making", questions: 21, minutes: null }], totalMinutes: 180, marking: "+1 / -0.25", notes: null },
    registrationFee: [{ category: "Indian candidates", amount: 2300, currency: "INR" }],
    keyDates: [{ event: "XAT 2027 exam", date: "2027-01-03", tentative: false }, { event: "Result", dateText: "Last week of January 2027", tentative: true }],
    acceptingInstitutes: { officialListUrl: "https://xatonline.in/associate", notable: ["XLRI Jamshedpur"] },
    sources: [
      { title: "XAT 2027 Bulletin", url: "https://xatonline.in/bulletin.pdf", supports: "dates, fees, eligibility", quote: "VERBATIM" },
      { title: "XAT overview", url: "https://xatonline.in/overview.pdf", supports: "sections, marking scheme" },
    ],
  };

  it("ties every fact to an official source and keeps the pattern", () => {
    const e = buildExamInfo(exam, "xat");
    expect(e.shortName).toBe("XAT");
    expect(e.sections[0]).toMatchObject({ name: "Decision Making", questionCount: 21 });
    expect(e.patternSource?.title).toBe("XAT overview");
    expect(e.facts.find((f) => f.label === "Fee: Indian candidates")).toMatchObject({ value: "₹2,300" });
    expect(e.facts.find((f) => f.label === "Eligibility")?.source.title).toBe("XAT 2027 Bulletin");
    expect(e.dates.map((d) => d.value)).toEqual(["3 Jan 2027", "Last week of January 2027"]);
    expect(e.acceptedByUrl).toBe("https://xatonline.in/associate");
    expect(JSON.stringify(e)).not.toContain("VERBATIM");
  });

  it("rejects an exam file without sources", () => {
    expect(() => buildExamInfo({ ...exam, sources: [] }, "xat")).toThrow();
  });
});

describe("cat-cutoffs/", () => {
  const set = {
    slug: "school-x",
    name: "School X",
    program: "PGDM",
    cutoffs: [
      { batch: "2027-29", stage: "minimum_to_apply", category: "All", overall: 80, varc: 70, dilr: null, qa: null, source: { title: "X eligibility", url: "https://x.example.ac.in/e.pdf" }, quote: "VERBATIM" },
      { batch: "2025-27", stage: "final", category: "All India (AI)", overall: 99.9, source: { title: "CAP list", url: "https://cet.example.gov.in/ai.pdf" } },
      { batch: "2026-28", stage: "shortlisting", category: "General", overall: 90, source: { title: "Coaching site", url: "https://coaching.example.com", kind: "secondary" } },
    ],
  };

  it("expands all-category minimums, keeps the stage, and drops non-CAT or unofficial rows", () => {
    const out = buildCatCutoffSet(set, "school-x");
    expect(out.records).toHaveLength(5);
    expect(new Set(out.records.map((r) => r.kind))).toEqual(new Set(["minimum"]));
    expect(out.records.every((r) => r.overall === 80 && r.programme === "PGDM")).toBe(true);
    expect(JSON.stringify(out)).not.toContain("VERBATIM");
  });
});

describe("MAH-MBA/MMS CAP cut-offs", () => {
  it("keeps only the OPEN columns, one row per course, and links the official listing page", () => {
    const cap = buildCapCutoffs({
      title: "CAP Round I",
      round: "CAP Round I",
      academicYear: "2026-27",
      publisher: "State CET Cell",
      sourceListingUrl: "https://mba2026.mahacet.org.in/mba_26/home",
      sourceUrl: "https://api.example/needs-headers.pdf",
      rows: [
        { instituteCode: "1", instituteName: "College A, Pune", city: null, courseCode: "c1", courseName: "MBA", categoryCode: "GOPENS", closingPercentile: 95.123 },
        { instituteCode: "1", instituteName: "College A, Pune", city: null, courseCode: "c1", courseName: "MBA", categoryCode: "GOPENH", closingPercentile: 90.5 },
        { instituteCode: "1", instituteName: "College A, Pune", city: null, courseCode: "c1", courseName: "MBA", categoryCode: "GSCH", closingPercentile: 60 },
      ],
    });
    expect(cap.rows).toEqual([
      { code: "1", institute: "College A, Pune", city: "Pune", course: "MBA", status: null, GOPENS: 95.12, GOPENH: 90.5, GOPENO: null },
    ]);
    expect(cap.meta.source.url).toBe("https://mba2026.mahacet.org.in/mba_26/home");
  });
});

describe("route gating", () => {
  it("publishes a percentile band only with five institutes in it, and colleges/ profiles only when they validate", () => {
    const base = fixture();
    const iims = [90, 92, 94, 96, 98].map((overall, i) => {
      const d = JSON.parse(JSON.stringify(base.programs[0].data));
      d.slug = `iim-t${i}`;
      d.shortName = `IIM T${i}`;
      d.cutoffs[0].overall = overall;
      return { slug: d.slug, data: d };
    });
    const snapshot = buildMbaSnapshot({ catExam: base.catExam, programs: iims, colleges: [{ slug: "test-school", data: researchCollege() }] });
    const routes = mbaPublishedRoutes(snapshot);
    expect(routes).toContain("/mba-colleges/mba-colleges-at-99-percentile");
    // Only one institute (90) plus the college (85) at or below 90 → not five.
    expect(routes).not.toContain("/mba-colleges/mba-colleges-at-90-percentile");
    expect(routes).toContain("/mba-colleges/test-school");
    expect(routes).not.toContain("/mba-colleges-in/pune");
  });
});

describe("specialisations.json sidecar", () => {
  const profiles = [{ slug: "iim-test", name: "Indian Institute of Management Test", shortName: "IIM Test" }];
  it("keeps sourced entries mapped to a page, links profiles and drops the rest", () => {
    const out = buildSpecialisationListings(
      {
        specialisations: {
          Agribusiness: [
            { slug: "iim-test", institute: "IIM Test", programme: "PGP-ABM", basis: "dedicated programme", evidence: "x", source: { title: "Prog", url: "https://iimtest.ac.in/abm", quote: "Q" } },
            { slug: "manage", institute: "MANAGE", basis: "dedicated programme", source: "https://manage.gov.in/pgdm" },
            { slug: "nosource", institute: "No Source" },
            { slug: "aggregator", institute: "Agg", source: { kind: "aggregator", title: "x", url: "https://x.com" } },
          ],
          "Basket weaving": [{ slug: "x", institute: "X", source: "https://x.ac.in" }],
        },
      },
      profiles,
    );
    expect(out.map((l) => [l.spec, l.slug, l.profileSlug, l.basis])).toEqual([
      ["agribusiness-management", "iim-test", "iim-test", "dedicated programme"],
      ["agribusiness-management", "manage", null, "dedicated programme"],
    ]);
    expect(JSON.stringify(out)).not.toContain("quote");
  });
});
