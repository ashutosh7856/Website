import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveDay } from "@/api/schoolGames";
import { invalidateSchoolCache } from "@/api/schoolStudentApi";

/**
 * Which pack a student opens, and the two ways that used to come back empty.
 *
 * The programme's schedule is authored per grade, and the backend only knows
 * the grades it was authored for: `getTodayGameByGrade` answers
 * `{ success: false, message: "No game configured for grade: 7" }` for classes
 * 6, 7, 11 and 12 — verified against the live service on 2026-09-04, on a day
 * that IS scheduled. Meanwhile the ungraded route knows every day but hides the
 * pack inside `byGrade`, so a student with no class on file read `byGrade[null]`
 * and got a day with a game and no questions in it.
 *
 * Both paths ended at a screen telling a student there was nothing to play on a
 * day that had something to play. Every grade on a day points at the same pack
 * anyway, which is what makes the fallback safe as well as necessary.
 */

const GRADED_MISS = {
  success: false,
  message: "No game configured for grade: 7",
};

const SCHEDULE = {
  date: "2026-09-04",
  gameId: "myth_fact",
  title: "Set 1 — Career Myths",
  status: "scheduled",
  plays: 0,
  avgPercent: 0,
  linkedTaskId: null,
  byGrade: {
    "8": { itemId: null, setId: "mythfact_s1" },
    "9": { itemId: null, setId: "mythfact_s1" },
    "10": { itemId: null, setId: "mythfact_s1" },
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Routes by exact route name, not by substring: "getTodayGameByGrade" contains
 * "getTodayGame", so a substring match would answer the graded route with the
 * ungraded body and quietly test nothing.
 */
const stub = (routes: Record<string, unknown>) => {
  const spy = vi.fn(async (url: string | URL) => {
    const route = String(url).split("/api/schoolStudent/")[1]?.split("?")[0] ?? "";
    if (route in routes) return json(routes[route], 200);
    // Everything else is the live service's "nothing here" envelope, which it
    // sends under a 500.
    return json({ success: false, message: "not found" }, 500);
  });
  vi.stubGlobal("fetch", spy);
  return spy;
};

beforeEach(() => invalidateSchoolCache());
afterEach(() => vi.unstubAllGlobals());

describe("resolveDay", () => {
  it("uses the grade's own pack when the day names that grade", async () => {
    stub({
      getTodayGameByGrade: {
        date: "2026-09-04",
        gameId: "myth_fact",
        itemId: null,
        setId: "mythfact_s1",
        title: "Set 1 — Career Myths",
        status: "scheduled",
      },
    });

    const day = await resolveDay("2026-09-04", 9);

    expect(day?.setId).toBe("mythfact_s1");
    expect(day?.gradeMatched).toBe(true);
  });

  it("still hands a class 7 student the day's game", async () => {
    // The regression: the graded route has nothing for grade 7, and the page
    // rendered "Nothing scheduled" on a day that is scheduled.
    stub({ getTodayGameByGrade: GRADED_MISS, getTodayGame: SCHEDULE });

    const day = await resolveDay("2026-09-04", 7);

    expect(day?.gameId).toBe("myth_fact");
    expect(day?.setId).toBe("mythfact_s1");
    // Inferred, not authored — the page is free to say so.
    expect(day?.gradeMatched).toBe(false);
  });

  it("resolves the pack with no class on file at all", async () => {
    // The other regression: the day loaded, the game named itself, and then
    // `byGrade[null]` left setId null so no questions could ever be fetched.
    stub({ getTodayGame: SCHEDULE });

    const day = await resolveDay("2026-09-04", null);

    expect(day?.setId).toBe("mythfact_s1");
    expect(day?.gradeMatched).toBe(false);
  });

  it("carries the item id through for the single-puzzle engines", async () => {
    stub({
      getTodayGame: {
        ...SCHEDULE,
        gameId: "sudoku",
        byGrade: {
          "8": { itemId: "itm_sd_01", setId: "sudoku_ladder" },
          "9": { itemId: "itm_sd_01", setId: "sudoku_ladder" },
        },
      },
    });

    const day = await resolveDay("2026-09-04", 12);

    expect(day?.itemId).toBe("itm_sd_01");
    expect(day?.setId).toBe("sudoku_ladder");
  });

  it("takes the nearest grade when the day's packs genuinely differ", async () => {
    stub({
      getTodayGame: {
        ...SCHEDULE,
        byGrade: {
          "8": { itemId: null, setId: "junior_set" },
          "10": { itemId: null, setId: "senior_set" },
        },
      },
    });

    expect((await resolveDay("2026-09-04", 11))?.setId).toBe("senior_set");
    invalidateSchoolCache();
    expect((await resolveDay("2026-09-04", 6))?.setId).toBe("junior_set");
  });

  it("reports a genuinely empty day as empty", async () => {
    stub({});

    expect(await resolveDay("2026-09-25", 9)).toBeNull();
  });
});
