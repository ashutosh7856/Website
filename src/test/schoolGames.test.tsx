import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SchoolGames from "@/pages/school/SchoolGames";
import SchoolStudentLayout from "@/layouts/SchoolStudentLayout";
import { useAuthStore } from "@/store/AuthStore";
import { createGameSession } from "@/api/schoolGames";
import { AnswerKey, GameGate, SavedWordAnswer } from "@/pages/school/SchoolPlay";
import { gameActivityCount } from "@/components/school-student/gameShape";

/**
 * Games & Quests, against the shapes the live backend actually returns.
 *
 * Two things here are worth a test more than the markup is:
 *
 *   1. **The Accept header.** /api/schoolStudent content-negotiates and its
 *      DEFAULT is XML. Send the request without `Accept: application/json` and
 *      `getAllGames` answers `<List><item>…`, which is not an error and not
 *      JSON — the rack would simply render empty with nothing in the console.
 *      That regression is invisible by eye, so it is pinned here.
 *   2. **`{ success: false }` is not a crash.** "No game scheduled for
 *      2026-08-29" comes back as HTTP 200 with that body. It has to read as an
 *      ordinary quiet day, not as an outage.
 */

const PHONE = "8000000000";

const GAMES = [
  {
    gameId: "quiz",
    name: "Career Quiz",
    description: "Ten questions. Sixty seconds each.",
    engine: "quiz_mcq_v1",
    isActive: true,
    sortOrder: 10,
    defaultTimeLimitSecs: 600,
    pointsPerCorrect: 1,
    solvePoints: null,
    passingPercent: 60,
    speedBonus: 2,
    noMistakeBonus: 0,
    supportsHints: true,
    hintPenalty: 1,
    oneAttemptPerDay: true,
  },
  {
    gameId: "sudoku",
    name: "Number Grid",
    description: "Fill the 9x9 grid. Logic only, no guessing.",
    engine: "sudoku_v1",
    isActive: true,
    sortOrder: 20,
    defaultTimeLimitSecs: 1800,
    pointsPerCorrect: null,
    solvePoints: 5,
    passingPercent: 100,
    speedBonus: 3,
    noMistakeBonus: 0,
    supportsHints: true,
    hintPenalty: 1,
    oneAttemptPerDay: true,
  },
  {
    gameId: "retired",
    name: "Retired Game",
    description: "Should never reach the rack.",
    engine: "quiz_mcq_v1",
    isActive: false,
    sortOrder: 99,
    defaultTimeLimitSecs: 60,
    pointsPerCorrect: 1,
    solvePoints: null,
    passingPercent: 60,
    speedBonus: 0,
    noMistakeBonus: 0,
    supportsHints: false,
    hintPenalty: 1,
    oneAttemptPerDay: true,
  },
];

const SCHEDULED = {
  date: "2026-09-01",
  gameId: "quiz",
  itemId: null,
  setId: "quiz_careers_s1",
  title: "Set 1 — Know Your Careers",
  status: "scheduled",
};

const SET = {
  setId: "quiz_careers_s1",
  gameId: "quiz",
  title: "Set 1 — Know Your Careers",
  status: "published",
  isActive: true,
  grades: [8, 9, 10],
  itemCount: 10,
  points: 10,
  // Deliberately different from the game's 600s default: the set overrides it.
  timeLimitSecs: 480,
  mode: "fixed",
  passTier: "free",
  setNumber: 1,
  quarter: null,
  plays: 0,
  avgPercent: 0,
  cycleId: "default",
};

const NOT_FOUND = { success: false, message: "Game session not found" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** A body the live service returns under a non-200 status. */
type WithStatus = { __status: number; body: unknown };
const withStatus = (body: unknown, status: number): WithStatus => ({ __status: status, body });
const isWithStatus = (value: unknown): value is WithStatus =>
  typeof value === "object" && value !== null && "__status" in value;

/** Routes a stubbed fetch by path, the way the real backend would. */
const stubApi = (overrides: Record<string, unknown> = {}) => {
  const spy = vi.fn(async (url: string | URL, init?: RequestInit) => {
    void init;
    const path = String(url);
    for (const [fragment, body] of Object.entries(overrides)) {
      if (path.includes(fragment)) {
        if (body instanceof Error) throw body;
        if (isWithStatus(body)) return json(body.body, body.__status);
        return json(body);
      }
    }
    if (path.includes("getAllGames")) return json(GAMES);
    if (path.includes("getTodayGameByGrade")) return json(SCHEDULED);
    if (path.includes("getGameById")) return json(GAMES[0]);
    if (path.includes("getGameSetById")) return json(SET);
    if (path.includes("getGameSession")) return json(NOT_FOUND);
    return json(NOT_FOUND);
  });
  vi.stubGlobal("fetch", spy);
  return spy;
};

const signIn = () => {
  localStorage.setItem("jwt", "jwt-test");
  useAuthStore.setState({
    user: { firstName: "Aarav", role: "schoolStudent" } as never,
    userId: PHONE,
    role: "schoolStudent",
    isAuthenticated: true,
    schoolStudent: {
      phoneNumber: PHONE,
      firstName: "Aarav",
      lastName: "Kumar",
      school: "Delhi Public School",
      className: "9",
    },
  });
};

const renderGames = () =>
  render(
    <MemoryRouter initialEntries={["/school-student/games"]}>
      <Routes>
        <Route path="/school-student" element={<SchoolStudentLayout />}>
          <Route path="games" element={<SchoolGames />} />
        </Route>
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  // Default wiring for every test; a test that wants a different answer calls
  // stubApi again with an override.
  stubApi();
  signIn();
});

describe("the request itself", () => {
  it("asks for JSON — without the header this backend answers XML", async () => {
    const spy = stubApi();

    renderGames();
    await screen.findAllByText("Career Quiz");

    for (const [, init] of spy.mock.calls) {
      const headers = (init as RequestInit | undefined)?.headers as
        | Record<string, string>
        | undefined;
      expect(headers?.Accept).toBe("application/json");
    }
  });

  it("narrows the schedule to the student's own class", async () => {
    const spy = stubApi();

    renderGames();
    await screen.findAllByText("Career Quiz");

    const urls = spy.mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes("getTodayGameByGrade") && url.includes("grade=9"))).toBe(
      true,
    );
  });

  it("saves the calculated score using the create-session contract", async () => {
    const spy = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      json({ status: "completed", score: 8 }),
    );
    vi.stubGlobal("fetch", spy);

    await createGameSession({
      studentId: PHONE,
      date: "2026-12-01",
      gameId: "quiz_postman",
      setId: "quiz_careers_s1_postman",
      status: "completed",
      score: 7.6,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toContain("/api/schoolStudent/createGameSession");
    expect(init).toMatchObject({
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      studentId: PHONE,
      date: "2026-12-01",
      gameId: "quiz_postman",
      setId: "quiz_careers_s1_postman",
      status: "completed",
      score: 8,
    });
  });

  it("rejects invalid dates before sending a session", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);

    await expect(
      createGameSession({
        studentId: PHONE,
        date: "01-12-2026",
        gameId: "quiz",
        setId: null,
        status: "completed",
        score: 8,
      }),
    ).rejects.toThrow("yyyy-mm-dd");
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces a create-session business error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ success: false, message: "Already played" })));

    await expect(
      createGameSession({
        studentId: PHONE,
        date: "2026-12-01",
        gameId: "quiz",
        setId: null,
        status: "completed",
        score: 8,
      }),
    ).rejects.toThrow("Already played");
  });
});

describe("today's game", () => {
  it("names the set the backend scheduled, not the game's generic name", async () => {
    renderGames();

    // The title now appears twice: once on today's drop and once per matching
    // row in the "Earlier games" archive, which this stub schedules on every
    // date. The drop is the one wrapped in an <article>; the archive rows are
    // list items. Scoping by that is what the assertions below already assume.
    const headings = await screen.findAllByText("Set 1 — Know Your Careers");
    const heading = headings.find((el) => el.closest("article")) as HTMLElement;
    expect(heading, "today's drop should render the scheduled set title").toBeTruthy();
    // The set's own numbers, straight off getGameSetById — read from the card
    // that owns the heading, since the rack repeats the game's own clock.
    const drop = heading.closest("article") as HTMLElement;
    // The set's clock, not the game's 600s default — proof the set won.
    expect(within(drop).getByText("8 min")).toBeInTheDocument();
    const questions = within(drop).getByText("Questions").parentElement as HTMLElement;
    expect(within(questions).getByText("10")).toBeInTheDocument();
    expect(within(drop).queryByText("Entry")).not.toBeInTheDocument();
  });

  it("reports an unplayed day as unplayed rather than inventing a score", async () => {
    renderGames();

    expect(await screen.findByText("Not played yet")).toBeInTheDocument();
    expect(screen.queryByText("Played today")).not.toBeInTheDocument();
  });

  it("shows the score returned by the daily game session", async () => {
    stubApi({
      getGameSession: {
        date: "2026-09-03",
        gameId: "quiz",
        studentId: PHONE,
        score: 8,
        setId: "quiz_careers_s1",
        sessionId: `${PHONE}_2026-09-03`,
        status: "completed",
      },
    });

    renderGames();

    expect(await screen.findByText("Played · 8 pts")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /play again/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view result/i })).toHaveAttribute(
      "href",
      "/school-student/play",
    );
  });

  it("links past dates to their result page but keeps future dates locked", async () => {
    renderGames();
    await screen.findAllByText("Career Quiz");

    expect(document.querySelector('a[href="/school-student/play/2026-09-02"]')).not.toBeNull();
    expect(document.querySelector('a[href="/school-student/play/2026-09-04"]')).toBeNull();
  });

  it("still gives a class the day was not authored for its game", async () => {
    /*
     * The schedule is authored per grade and today's only names 8, 9 and 10, so
     * `getTodayGameByGrade` answers "No game configured for grade: 7" — its
     * ordinary envelope, not a fault. That used to surface as "No game today"
     * on a day that has a game, for every student in class 6, 7, 11 or 12.
     * Every grade on a day points at the same pack anyway.
     */
    useAuthStore.setState({
      schoolStudent: {
        phoneNumber: PHONE,
        firstName: "Aarav",
        lastName: "Kumar",
        school: "Delhi Public School",
        className: "7",
      },
    });
    stubApi({
      getTodayGameByGrade: withStatus(
        { success: false, message: "No game configured for grade: 7" },
        500,
      ),
      getTodayGame: {
        date: "2026-09-01",
        gameId: "quiz",
        title: "Set 1 — Know Your Careers",
        status: "scheduled",
        plays: 0,
        avgPercent: 0,
        linkedTaskId: null,
        byGrade: {
          "8": { itemId: null, setId: "quiz_careers_s1" },
          "9": { itemId: null, setId: "quiz_careers_s1" },
          "10": { itemId: null, setId: "quiz_careers_s1" },
        },
      },
    });

    renderGames();

    const headings = await screen.findAllByText("Set 1 — Know Your Careers");
    expect(headings.some((el) => el.closest("article"))).toBe(true);
    expect(screen.queryByText("No game today")).not.toBeInTheDocument();
    // Said plainly, rather than withheld.
    expect(
      screen.getByText(/isn't set for class 7/i),
    ).toBeInTheDocument();
  });

  it("treats an empty schedule as a quiet day, not a failure", async () => {
    // Exactly what the live service sends for a date with nothing on it: the
    // failure envelope, under an HTTP 500. Trusting the status code here is
    // what would turn a quiet Saturday into a red error on the dashboard.
    stubApi({
      getTodayGameByGrade: withStatus(
        { success: false, message: "No game scheduled for: 2026-08-29" },
        500,
      ),
    });

    renderGames();

    expect(await screen.findByText("No game today")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("still reports a genuine fault — a 500 with no envelope is an error", async () => {
    stubApi({ getTodayGameByGrade: withStatus({ oops: true }, 500) });

    renderGames();

    expect(await screen.findByText("Today's game didn't load")).toBeInTheDocument();
  });
});

describe("saved quiz result", () => {
  it("shows the correct answer and explanation without inventing a past choice", () => {
    render(
      <AnswerKey
        items={[{
          itemId: "itm_q1_01",
          gameId: "quiz",
          setId: "quiz_careers_s1",
          order: 1,
          content: {
            question: "Who designs buildings?",
            options: [
              { id: "a", text: "Auditor" },
              { id: "b", text: "Architect" },
            ],
            explanation: "Architects design buildings and plan spaces.",
          },
        } as never]}
      />,
    );

    expect(screen.getByText("Correct answers and explanations (1)")).toBeInTheDocument();
    expect(screen.getByText("Correct answers and explanations (1)").closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Architects design buildings and plan spaces.")).toBeInTheDocument();
    expect(screen.queryByText(/You chose/i)).not.toBeInTheDocument();
  });

  it("shows the answer and explanation for a saved word game", () => {
    render(
      <SavedWordAnswer item={{
        itemId: "itm_wg_01",
        gameId: "word_guess",
        setId: "wordguess_daily",
        order: 1,
        content: {
          length: 9,
          displayPattern: "A_______T",
          revealedIndices: [0],
          hints: [],
          maxWrongGuesses: 5,
          explanation: "A profession-focused helper.",
        },
      } as never} />,
    );

    expect(screen.getByText("Correct answer")).toBeInTheDocument();
    expect(screen.getByText("ARCHITECT")).toBeInTheDocument();
    expect(screen.getByText("A profession-focused helper.")).toBeInTheDocument();
  });

  it("shows saved points and never offers another attempt", () => {
    render(
      <GameGate
        data={{
          date: "2026-09-03",
          game: GAMES[0],
          set: SET,
          title: SET.title,
          items: [],
          source: "api",
          session: { date: "2026-09-03", score: 8, status: "completed" },
        } as never}
        isToday
        longDate="3 Sep"
        tone={{ ink: "#000", tint: "#fff", edge: "#ddd" }}
        onStart={vi.fn()}
      />,
    );

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/saved score.*final/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start|play again/i })).not.toBeInTheDocument();
  });

  it("counts one-board games as one activity and quizzes by question count", () => {
    expect(gameActivityCount("sudoku_v1", 81)).toBe(1);
    expect(gameActivityCount("word_guess_v1", 12)).toBe(1);
    expect(gameActivityCount("quiz_mcq_v1", 10)).toBe(10);
  });
});

describe("the rack", () => {
  it("lists the active games and drops the retired one", async () => {
    renderGames();
    await screen.findAllByText("Career Quiz");

    const rack = screen.getByRole("region", { name: "Every game" });
    expect(within(rack).getByText("Career Quiz")).toBeInTheDocument();
    expect(within(rack).getByText("Number Grid")).toBeInTheDocument();
    expect(screen.queryByText("Retired Game")).not.toBeInTheDocument();
    expect(screen.getByText("2 games")).toBeInTheDocument();
  });

  it("states each game's own rules, not one shared blurb", async () => {
    renderGames();
    await screen.findAllByText("Career Quiz");

    const rack = screen.getByRole("region", { name: "Every game" });
    // Per-answer scoring for the quiz, solve-or-nothing for the grid.
    expect(within(rack).getAllByText("1 point per correct answer").length).toBeGreaterThan(0);
    expect(within(rack).getAllByText("5 points for solving it").length).toBeGreaterThan(0);
    expect(within(rack).getByText("30 min")).toBeInTheDocument();
  });

  it("marks the scheduled game as today's", async () => {
    renderGames();
    await screen.findAllByText("Career Quiz");

    // Scoped to the rack: the week strip also labels its first tile "Today".
    const rack = screen.getByRole("region", { name: "Every game" });
    expect(within(rack).getByText("Today")).toBeInTheDocument();
  });

  it("offers a retry when the catalogue fails", async () => {
    stubApi({ getAllGames: new Error("network down") });

    renderGames();

    expect(await screen.findByText("The games didn't load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

describe("who can reach it", () => {
  it("turns away anyone who is not a school student", async () => {
    stubApi();
    useAuthStore.setState({ role: "user" as never });

    renderGames();

    expect(await screen.findByText("home page")).toBeInTheDocument();
  });
});
