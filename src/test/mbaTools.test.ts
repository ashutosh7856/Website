import { describe, expect, it } from "vitest";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import { cleanAmount, computeRoi, emi, roiShareSummary, validateRoi, type RoiDraft } from "@/lib/mbaRoi";
import {
  DEFAULT_COMPARE,
  MAX_COMPARE,
  addToSelection,
  comparePath,
  compareSearch,
  compareShareUrl,
  parseCompareParam,
  removeFromSelection,
  selectionFromSearch,
} from "@/lib/mbaCompare";
import { buildIcs, deadlineLabel, filterByExam, isPast, sortByDate } from "@/lib/mbaDeadlines";
import {
  INTAKE_2027_WINDOW,
  collegesOffering,
  deadlineRows,
  profileColleges,
  publishedSpecialisations,
  specialisationSlugFor,
  unprofiledOffering,
  type DeadlineRow,
} from "@/lib/mbaRoutes.mjs";

describe("MBA ROI maths (src/lib/mbaRoi.ts)", () => {
  it("computes the standard reducing-balance EMI", () => {
    // ₹10 lakh at 10% for 5 years: the textbook figure is ₹21,247.04.
    expect(emi(1_000_000, 10, 60)).toBeCloseTo(21247.04, 1);
    // ₹20 lakh at 9.5% for 7 years.
    expect(emi(2_000_000, 9.5, 84)).toBeCloseTo(32687.98, 0);
  });

  it("splits the principal evenly at 0% and returns 0 without a loan", () => {
    expect(emi(1_200_000, 0, 120)).toBe(10_000);
    expect(emi(0, 10, 60)).toBe(0);
    expect(emi(100_000, 10, 0)).toBe(0);
  });

  it("totals repayment, interest, cost and a simple payback on gross salary", () => {
    const r = computeRoi({ fee: 2_500_000, living: 500_000, loanAmount: 2_000_000, annualRatePct: 10, tenureYears: 5, salary: 2_400_000 });
    expect(r.months).toBe(60);
    expect(r.totalRepayment).toBeCloseTo(r.emi * 60, 6);
    expect(r.totalInterest).toBeCloseTo(r.totalRepayment - 2_000_000, 6);
    expect(r.totalCost).toBeCloseTo(3_000_000 + r.totalInterest, 6);
    expect(r.ownFunds).toBe(1_000_000);
    // ₹2,00,000 gross a month → ceil(totalCost / 200000)
    expect(r.paybackMonths).toBe(Math.ceil(r.totalCost / 200_000));
    expect(r.emiShareOfSalaryPct).toBeCloseTo((r.emi / 200_000) * 100, 6);
  });

  it("with no loan, cost is fee + living costs and there is no EMI", () => {
    const r = computeRoi({ fee: 1_200_000, living: 0, loanAmount: 0, annualRatePct: 0, tenureYears: 0, salary: 1_200_000 });
    expect(r.emi).toBe(0);
    expect(r.totalInterest).toBe(0);
    expect(r.totalCost).toBe(1_200_000);
    expect(r.paybackMonths).toBe(12);
    expect(r.emiShareOfSalaryPct).toBeNull();
  });

  const draft = (over: Partial<RoiDraft> = {}): RoiDraft => ({
    fee: "2500000",
    living: "",
    loanAmount: "",
    annualRatePct: "",
    tenureYears: "",
    salary: "2400000",
    ...over,
  });

  it("validates: fee and salary required; rate and tenure only with a loan; ranges enforced", () => {
    expect(validateRoi(draft()).input).toMatchObject({ living: 0, loanAmount: 0 });
    expect(validateRoi(draft({ fee: "" })).errors.fee).toBeTruthy();
    expect(validateRoi(draft({ salary: "0" })).errors.salary).toBeTruthy();
    const loan = validateRoi(draft({ loanAmount: "1000000" }));
    expect(loan.input).toBeNull();
    expect(loan.errors.annualRatePct).toBeTruthy();
    expect(loan.errors.tenureYears).toBeTruthy();
    expect(validateRoi(draft({ loanAmount: "1000000", annualRatePct: "45", tenureYears: "5" })).errors.annualRatePct).toBeTruthy();
    expect(validateRoi(draft({ loanAmount: "1000000", annualRatePct: "10", tenureYears: "5" })).input).not.toBeNull();
  });

  it("cleans typed amounts and shares no personal details", () => {
    expect(cleanAmount("₹ 12,50,000")).toBe("1250000");
    expect(cleanAmount("10.5.2")).toBe("10.52");
    const r = computeRoi({ fee: 2_000_000, living: 0, loanAmount: 1_000_000, annualRatePct: 10, tenureYears: 5, salary: 1_800_000 });
    const text = roiShareSummary(r, "IIM Test");
    expect(text).toMatch(/EMI ₹21,247\/month for 60 months/);
    expect(text).not.toMatch(/\d{10}/);
  });
});

describe("compare URL state (src/lib/mbaCompare.ts)", () => {
  const valid = new Set(profileColleges(MBA_SNAPSHOT).map((c) => c.slug));

  it("the default example comparison is three published IIM profiles", () => {
    expect(DEFAULT_COMPARE).toHaveLength(3);
    for (const s of DEFAULT_COMPARE) expect(valid.has(s)).toBe(true);
  });

  it("parses ?c= into valid, unique slugs, at most four", () => {
    expect(parseCompareParam(" IIM-Ahmedabad,iim-ahmedabad,,not-a-college,fms-delhi", valid)).toEqual(["iim-ahmedabad", "fms-delhi"]);
    const five = [...valid].slice(0, 5).join(",");
    expect(parseCompareParam(five, valid)).toHaveLength(MAX_COMPARE);
    expect(parseCompareParam(null, valid)).toEqual([]);
  });

  it("falls back to the default when the URL names nothing valid", () => {
    expect(selectionFromSearch("", valid)).toEqual(DEFAULT_COMPARE);
    expect(selectionFromSearch("?c=nope", valid)).toEqual(DEFAULT_COMPARE);
    expect(selectionFromSearch("?c=fms-delhi,iim-lucknow", valid)).toEqual(["fms-delhi", "iim-lucknow"]);
  });

  it("round-trips through the URL and builds share links", () => {
    const picked = ["iim-ahmedabad", "fms-delhi"];
    expect(compareSearch(picked)).toBe("?c=iim-ahmedabad,fms-delhi");
    expect(selectionFromSearch(compareSearch(picked), valid)).toEqual(picked);
    expect(compareSearch([])).toBe("");
    expect(comparePath(["fms-delhi"])).toBe("/mba-colleges/compare?c=fms-delhi");
    expect(compareShareUrl(picked)).toBe(
      "https://procounsel.co.in/mba-colleges/compare/?c=iim-ahmedabad,fms-delhi&utm_source=whatsapp&utm_medium=share&utm_campaign=mba_compare",
    );
  });

  it("adds up to four and removes", () => {
    let s = ["a"];
    s = addToSelection(s, "a");
    expect(s).toEqual(["a"]);
    s = addToSelection(addToSelection(addToSelection(s, "b"), "c"), "d");
    expect(addToSelection(s, "e")).toEqual(["a", "b", "c", "d"]);
    expect(removeFromSelection(s, "b")).toEqual(["a", "c", "d"]);
  });
});

describe("admission deadlines (deadlineRows + src/lib/mbaDeadlines.ts)", () => {
  const rows = deadlineRows(MBA_SNAPSHOT);

  it("lists only dated rows with an official source, inside the 2027-intake window", () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.source.url).toMatch(/^https?:\/\//);
      expect(r.date).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
      const day = r.date.length === 7 ? `${r.date}-01` : r.date;
      expect(day >= INTAKE_2027_WINDOW.from && day <= INTAKE_2027_WINDOW.to).toBe(true);
      expect(r.event).not.toMatch(/2026-27/);
    }
    // Sorted by date.
    expect(rows.map((r) => r.date)).toEqual([...rows.map((r) => r.date)].sort());
  });

  it("drops institutes and exam dates without a source or an exact date", () => {
    const fake = {
      ...MBA_SNAPSHOT,
      institutes: [],
      colleges: [
        { ...MBA_SNAPSHOT.colleges[0], slug: "no-source", keyDates: { applicationOpens: null, applicationDeadline: "2026-12-01", examDate: null, notes: null, tentative: false, source: { kind: "official", title: "x", url: "", year: null, retrievedAt: "" } } },
        { ...MBA_SNAPSHOT.colleges[0], slug: "no-dates", keyDates: null },
        { ...MBA_SNAPSHOT.colleges[0], slug: "ok", keyDates: { applicationOpens: "2025-01-01", applicationDeadline: "2026-12-01", examDate: null, notes: "tentative", tentative: true, source: { kind: "official", title: "x", url: "https://x.ac.in", year: null, retrievedAt: "" } } },
      ],
      exams: [
        {
          ...MBA_SNAPSHOT.exams[0],
          id: "xat",
          dates: [
            { label: "Result", value: "Last week of Jan 2027", note: null, tentative: true, source: MBA_SNAPSHOT.exams[0].sources[0] },
            { label: "Exam", value: "3 Jan 2027", iso: "2027-01-03", note: null, tentative: false, source: MBA_SNAPSHOT.exams[0].sources[0] },
            { label: "Last date, A.Y. 2026-27", value: "14 Sep 2026", iso: "2026-09-14", note: null, tentative: false, source: MBA_SNAPSHOT.exams[0].sources[0] },
          ],
        },
      ],
    };
    const out = deadlineRows(fake as typeof MBA_SNAPSHOT);
    expect(out.map((r) => r.id)).toEqual(["ok-applicationDeadline", "xat-1"]);
    expect(out[0].tentative).toBe(true);
  });

  it("filters by exam, sorts both ways and labels month-only dates", () => {
    const cat = filterByExam(rows, "cat");
    expect(cat.every((r) => r.exams.includes("cat"))).toBe(true);
    expect(filterByExam(rows, "all")).toHaveLength(rows.length);
    const desc = sortByDate(rows, "desc");
    expect(desc[0].date >= desc[desc.length - 1].date).toBe(true);
    expect(deadlineLabel({ date: "2026-11-25", precision: "day" })).toBe("25 Nov 2026");
    expect(deadlineLabel({ date: "2026-09", precision: "month" })).toBe("Sep 2026");
    expect(isPast({ date: "2026-11-01", precision: "day" }, "2026-11-12")).toBe(true);
    expect(isPast({ date: "2026-11", precision: "month" }, "2026-11-12")).toBe(false);
  });

  it("builds a valid all-day iCalendar file with the official source on every event", () => {
    const sample: DeadlineRow[] = [
      { id: "a", kind: "exam", name: "XAT", slug: "xat", event: "Registration closes; last date, online", date: "2026-12-31", precision: "day", exams: ["xat"], tentative: true, note: null, source: { kind: "official", title: "XAT 2027 Bulletin", url: "https://xatonline.in/b.pdf", year: 2026, retrievedAt: "" } },
      { id: "b", kind: "college", name: "IMI", slug: "imi-delhi", event: "Applications open", date: "2026-09", precision: "month", exams: ["cat"], tentative: false, note: null, source: { kind: "official", title: "IMI", url: "https://imi.edu", year: null, retrievedAt: "" } },
    ];
    const ics = buildIcs(sample, "20261112T000000Z");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1); // month-only row skipped
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    expect(ics).toContain("SUMMARY:XAT: Registration closes\\; last date\\, online (tentative)");
    expect(ics).toContain("URL:https://xatonline.in/b.pdf");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe("specialisations.json sidecar (snapshot.specialisationListings)", () => {
  it("maps names to specialisation pages", () => {
    expect(specialisationSlugFor("Finance")).toBe("finance");
    expect(specialisationSlugFor("HR")).toBe("human-resource-management");
    expect(specialisationSlugFor("Business Analytics")).toBe("business-analytics");
    expect(specialisationSlugFor("agribusiness-management")).toBe("agribusiness-management");
    expect(specialisationSlugFor("Basket weaving")).toBeNull();
  });

  it("counts sourced listings toward the gate: linked to profiles, or listed without one", () => {
    const src = { kind: "official" as const, title: "Programme page", url: "https://x.ac.in", year: null, retrievedAt: "" };
    const base = { ...MBA_SNAPSHOT, specialisationListings: [] };
    expect(publishedSpecialisations(base)).not.toContain("agribusiness-management");
    const withListings = {
      ...base,
      specialisationListings: [
        { spec: "agribusiness-management", slug: "iim-ahmedabad", profileSlug: "iim-ahmedabad", institute: "IIM Ahmedabad", programme: "PGP-FABM", evidence: "x", source: src },
        { spec: "agribusiness-management", slug: "irma", profileSlug: null, institute: "IRMA", programme: "PGDM (RM)", evidence: "x", source: src },
        { spec: "agribusiness-management", slug: "manage", profileSlug: null, institute: "MANAGE", programme: "PGDM (ABM)", evidence: "x", source: src },
      ],
    };
    // IIM Lucknow lists ABM in its own programme names; the sidecar adds IIM A plus two unprofiled institutes.
    expect(collegesOffering(withListings, "agribusiness-management").map((c) => c.slug)).toContain("iim-ahmedabad");
    expect(unprofiledOffering(withListings, "agribusiness-management")).toHaveLength(2);
    expect(publishedSpecialisations(withListings)).toContain("agribusiness-management");
  });
});
