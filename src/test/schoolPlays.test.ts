import { describe, it, expect, beforeEach } from "vitest";
import { getPlay, listPlays, playCount, recordPlay } from "@/lib/schoolPlays";
import { emptyProgress, withServerRecord } from "@/lib/schoolStudentProgress";
import type { SchoolStudent } from "@/api/schoolStudentApi";

/**
 * The ledger, and the one place it is allowed to win over the server.
 *
 * Both halves are load-bearing and both fail silently. A ledger that lets a
 * replay compound its points hands every student an infinite score for pressing
 * refresh; a reconciliation that takes the server's word wipes the dashboard to
 * zero a second after a game finishes, because nothing on the backend can award
 * a point yet. Neither throws, and neither is visible in a type.
 */

const PHONE = "9000000001";

const run = (over: Partial<Parameters<typeof recordPlay>[1]> = {}) => ({
  date: "2026-09-03",
  gameId: "quiz",
  setId: "quiz_careers_s1",
  correct: 8,
  total: 10,
  solved: null,
  points: 8,
  seconds: 120,
  ...over,
});

beforeEach(() => localStorage.clear());

describe("the play ledger", () => {
  it("remembers a finished run against the student and the day", () => {
    recordPlay(PHONE, run());

    const play = getPlay(PHONE, "2026-09-03");
    expect(play?.correct).toBe(8);
    expect(play?.points).toBe(8);
    // Another student on the same device must not inherit it.
    expect(getPlay("9000000002", "2026-09-03")).toBeNull();
  });

  it("returns the full points for a first attempt", () => {
    expect(recordPlay(PHONE, run())).toBe(8);
  });

  it("returns only the improvement when a day is replayed", () => {
    recordPlay(PHONE, run({ points: 8 }));
    // Every game is oneAttemptPerDay, so a second run is practice. Awarding it
    // again would let anyone farm the leaderboard by refreshing.
    expect(recordPlay(PHONE, run({ points: 8 }))).toBe(0);
    expect(recordPlay(PHONE, run({ points: 10 }))).toBe(2);
    expect(getPlay(PHONE, "2026-09-03")?.points).toBe(10);
  });

  it("never takes points away when a replay goes worse", () => {
    recordPlay(PHONE, run({ points: 10 }));
    expect(recordPlay(PHONE, run({ points: 3 }))).toBe(0);
    expect(getPlay(PHONE, "2026-09-03")?.points).toBe(10);
  });

  it("counts distinct days, not attempts", () => {
    recordPlay(PHONE, run({ date: "2026-09-01" }));
    recordPlay(PHONE, run({ date: "2026-09-02" }));
    recordPlay(PHONE, run({ date: "2026-09-02" }));

    expect(playCount(PHONE)).toBe(2);
    expect(listPlays(PHONE)[0].date).toBe("2026-09-02");
  });

  it("survives a corrupt or foreign value in its own key", () => {
    // Private mode, a truncated write, an older shape — all mean "no history",
    // never a throw on a page that is only reading.
    localStorage.setItem(`procounsel:school-plays:v1:${PHONE}`, "not json");
    expect(listPlays(PHONE)).toEqual([]);
    localStorage.setItem(`procounsel:school-plays:v1:${PHONE}`, "[1,2,3]");
    expect(listPlays(PHONE)).toEqual([]);
  });

  it("has no history for a student it was never given", () => {
    expect(listPlays(null)).toEqual([]);
    expect(recordPlay(null, run())).toBe(0);
  });
});

describe("reconciling the ledger with the server", () => {
  const record = (over: Partial<SchoolStudent> = {}): SchoolStudent =>
    ({
      schoolStudentId: PHONE,
      phoneNumber: PHONE,
      firstName: "Aarav",
      lastName: "S",
      className: "9",
      totalPoints: 0,
      currentStreak: 0,
      pyschometricReportPdfLink: null,
      deleted: false,
      ...over,
    }) as SchoolStudent;

  it("does not wipe local points with the server's standing zero", () => {
    recordPlay(PHONE, run({ points: 8 }));
    const merged = withServerRecord({ ...emptyProgress(), points: 8 }, record(), PHONE);

    // The regression this exists for: totalPoints is 0 for every student
    // because no endpoint awards one, and taking it reset the dashboard the
    // instant a game finished.
    expect(merged.points).toBe(8);
  });

  it("lets the server win the moment it can actually award anything", () => {
    recordPlay(PHONE, run({ points: 8 }));
    const merged = withServerRecord({ ...emptyProgress(), points: 8 }, record({ totalPoints: 40 }), PHONE);

    expect(merged.points).toBe(40);
  });

  it("still takes the report link straight from the record, both ways", () => {
    // The link is the only reliable signal that the psychometric test is done,
    // and unlike points it is authoritative in both directions.
    const done = withServerRecord(
      emptyProgress(),
      record({ pyschometricReportPdfLink: "https://files/report.pdf" }),
      PHONE,
    );
    expect(done.completedQuests).toContain("mettle");

    const undone = withServerRecord(
      { ...emptyProgress(), completedQuests: ["mettle"] },
      record(),
      PHONE,
    );
    expect(undone.completedQuests).not.toContain("mettle");
  });

  it("leaves the local copy alone when the profile call failed", () => {
    const local = { ...emptyProgress(), points: 12, streakDays: 3 };
    expect(withServerRecord(local, null, PHONE)).toBe(local);
  });
});

/**
 * The daily goal, rebuilt rather than remembered.
 *
 * `daily[today].activities` is a counter, incremented exactly once when a run
 * ends. Anything that put a different Progress in front of the shell — a fresh
 * login (verifyOtp drops the persisted school profile, which can change the
 * storage key), a re-read of an older copy, one write that never landed — took
 * that counter back to zero and told a student their finished game was undone.
 * So the tally is derived again on every mount from the records that actually
 * say a game was played.
 */
describe("today's tally", () => {
  const TODAY = "2026-09-03";

  it("counts the day as done from the ledger alone", () => {
    recordPlay(PHONE, run({ date: TODAY, points: 8 }));

    // A Progress with an empty `daily` is exactly what a fresh login hands the
    // shell. The game still happened.
    const merged = withServerRecord(emptyProgress(), null, PHONE, { today: TODAY });

    expect(merged.daily.find((d) => d.date === TODAY)?.activities).toBe(1);
    expect(merged.completedQuests).toContain("games");
  });

  it("counts it from the server's session when this device has no ledger", () => {
    const merged = withServerRecord(emptyProgress(), null, PHONE, {
      today: TODAY,
      playedToday: true,
    });

    expect(merged.daily.find((d) => d.date === TODAY)?.activities).toBe(1);
  });

  it("never lowers a tally that is already higher", () => {
    recordPlay(PHONE, run({ date: TODAY, points: 8 }));
    const local = {
      ...emptyProgress(),
      completedQuests: ["games"],
      daily: [{ date: TODAY, points: 8, activities: 2 }],
    };

    const merged = withServerRecord(local, null, PHONE, { today: TODAY });

    expect(merged.daily.find((d) => d.date === TODAY)?.activities).toBe(2);
    // Nothing to fix, so nothing is rewritten.
    expect(merged).toBe(local);
  });

  it("leaves a day with no play at zero", () => {
    const local = emptyProgress();
    expect(withServerRecord(local, null, PHONE, { today: TODAY })).toBe(local);
  });
});
