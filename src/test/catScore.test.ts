import { describe, expect, it } from "vitest";
import {
  EMPTY_SECTION_DRAFT,
  UNKNOWN_COUNT_MAX,
  cleanCount,
  schemeFromMarking,
  scoreCat,
  scoreSection,
  scoreSummary,
  sectionLimit,
  validateSection,
  whatsappShareUrl,
} from "@/lib/catScore";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";

const SCHEME = schemeFromMarking(MBA_SNAPSHOT.catExam.versions[0].marking)!;

describe("CAT raw-score arithmetic", () => {
  it("reads the official scheme from the snapshot: MCQ +3/−1, TITA +3/0", () => {
    expect(SCHEME).toEqual({ mcqCorrect: 3, mcqWrong: -1, titaCorrect: 3, titaWrong: 0 });
    expect(schemeFromMarking([{ type: "MCQ", correct: 3, incorrect: -1 }])).toBeNull();
  });

  it("scores a section: correct ×3, wrong MCQ −1, TITA correct ×3", () => {
    const s = scoreSection("VARC", { mcqCorrect: 12, mcqWrong: 4, titaCorrect: 5 }, SCHEME, 24);
    expect(s).toMatchObject({ mcqMarks: 32, titaMarks: 15, raw: 47, max: 72 });
  });

  it("a section can go negative", () => {
    expect(scoreSection("QA", { mcqCorrect: 1, mcqWrong: 5, titaCorrect: 0 }, SCHEME, 22).raw).toBe(-2);
  });

  it("totals the sections; max only when every count is known", () => {
    const secs = [
      scoreSection("VARC", { mcqCorrect: 10, mcqWrong: 2, titaCorrect: 2 }, SCHEME, 24),
      scoreSection("DILR", { mcqCorrect: 6, mcqWrong: 3, titaCorrect: 1 }, SCHEME, 22),
      scoreSection("QA", { mcqCorrect: 8, mcqWrong: 4, titaCorrect: 3 }, SCHEME, 22),
    ];
    const known = scoreCat(secs, true);
    expect(known.total).toBe(34 + 18 + 29);
    expect(known.max).toBe(204);
    expect(known.correct).toBe(30);
    expect(known.wrong).toBe(9);
    expect(scoreCat(secs, false).max).toBeNull();
    expect(scoreSummary(known, 2026)).toBe(
      "My CAT 2026 raw score: 81 (VARC 34 · DILR 18 · QA 29), worked out with the official marking scheme.",
    );
  });
});

describe("validation", () => {
  it("uses the announced count, else a cap of 30", () => {
    expect(sectionLimit(24)).toBe(24);
    expect(sectionLimit(null)).toBe(UNKNOWN_COUNT_MAX);
    expect(UNKNOWN_COUNT_MAX).toBe(30);
  });

  it("blank fields are 0", () => {
    expect(validateSection(EMPTY_SECTION_DRAFT, 30)).toEqual({
      attempt: { mcqCorrect: 0, mcqWrong: 0, titaCorrect: 0 },
      errors: {},
    });
  });

  it("rejects a field above the limit and answers that add up to more than the section", () => {
    expect(validateSection({ mcqCorrect: "25", mcqWrong: "", titaCorrect: "" }, 24).errors.mcqCorrect).toMatch(/24/);
    const over = validateSection({ mcqCorrect: "15", mcqWrong: "6", titaCorrect: "4" }, 24);
    expect(over.attempt).toBeNull();
    expect(over.errors.total).toMatch(/25/);
    expect(validateSection({ mcqCorrect: "15", mcqWrong: "6", titaCorrect: "4" }, 30).attempt).not.toBeNull();
  });

  it("rejects non-integers; the input cleaner keeps two digits", () => {
    expect(validateSection({ mcqCorrect: "1.5", mcqWrong: "", titaCorrect: "" }, 30).errors.mcqCorrect).toBeTruthy();
    expect(validateSection({ mcqCorrect: "-1", mcqWrong: "", titaCorrect: "" }, 30).errors.mcqCorrect).toBeTruthy();
    expect(cleanCount("-1a23")).toBe("12");
  });
});

it("builds a wa.me share link with the text and URL encoded", () => {
  const url = whatsappShareUrl("My score: 81 (VARC 34)", "https://procounsel.co.in/cat-score-calculator/");
  expect(url.startsWith("https://wa.me/?text=")).toBe(true);
  expect(decodeURIComponent(url.split("text=")[1])).toBe(
    "My score: 81 (VARC 34) https://procounsel.co.in/cat-score-calculator/",
  );
});
