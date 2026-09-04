import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageSEO from '@/components/SEO/PageSEO';
import ErrorState from '@/components/common/ErrorState';
import GameMark from '@/components/school-student/GameMark';
import { gameActivityCount } from '@/components/school-student/gameShape';
import { TONE, toneFor } from '@/components/school-student/gameTones';
import McqBoard from '@/components/school-student/boards/McqBoard';
import SudokuBoard from '@/components/school-student/boards/SudokuBoard';
import WordBoard from '@/components/school-student/boards/WordBoard';
import { createGameSession, getGame, getSession, getSet, resolveDay, type Game, type GameSession, type GameSet } from '@/api/schoolGames';
import { duration, scoringLabel } from '@/api/schoolGames';
import { today as isoToday } from '@/api/schoolStudentApi';
import { getItem, loadItems, noteOf, promptOf, type GameItem } from '@/lib/gameItems';
import {
  checkWord,
  markMcq,
  pointsForMcq,
  pointsForSolve,
  type Mark,
  type RunPoints,
} from '@/lib/schoolMarking';
import { recordPlay } from '@/lib/schoolPlays';
import { pruneRuns } from '@/lib/useSessionState';
import { useSchoolShell } from '@/lib/schoolShellContext';
import { isoDate } from '@/lib/schoolStudentProgress';

/**
 * Playing a scheduled game.
 *
 * ─── Which days are open ─────────────────────────────────────────────────────
 *
 * Only today's unplayed game can start. Completed and past days are read-only,
 * and future dates are never opened.
 *
 * This page used to be today-only, on the reasoning that a daily game whose
 * future days are reachable is not a daily game. That half is still true and
 * still enforced. The other half was wrong: a student who was at a wedding on
 * Tuesday lost Tuesday permanently, which is not a rule, it is an amputation.
 * The archive on the games page links straight here with a date.
 *
 * A future date is refused, not redirected — silently loading something else
 * teaches a student that the address bar lies.
 *
 * The page resolves schedule → game → set → items, then hands off to the board
 * for that engine. Phone-first throughout: one column, big targets, and the
 * board sized to fit a screen without scrolling mid-question.
 */

type Loaded = {
  date: string;
  game: Game | null;
  set: GameSet | null;
  title: string | null;
  items: GameItem[];
  /** 'probe' means ids were walked because getItemsBySetId is down. */
  source: 'api' | 'probe' | 'none';
  session: GameSession | null;
};

type Outcome =
  | { kind: 'sudoku'; solved: boolean; gaveUp: boolean; seconds: number; hints: number }
  | { kind: 'mcq'; answers: Record<string, string>; hintsUsed: number; seconds: number }
  | { kind: 'word'; guess: string; gaveUp: boolean; hintsUsed: number; seconds: number };

export default function SchoolPlay() {
  const navigate = useNavigate();
  const { progress, update, grade, studentId } = useSchoolShell();
  const params = useParams<{ date?: string }>();

  const today = isoToday();
  /*
   * The URL names the day, and the URL is not trusted. Anything that is not a
   * yyyy-mm-dd on or before today falls back to today, so a typed date, a stale
   * bookmark from last month's link format, or a hopeful `+1` all land on the
   * game that is actually open rather than on an error page.
   */
  const requested = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const isFuture = requested > today;
  const date = isFuture ? today : requested;
  const isToday = date === today;


  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [started, setStarted] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Scratch copies of any other day's run are dropped before this one starts,
  // so an abandoned board cannot resurface weeks later. See lib/useSessionState.
  useEffect(() => pruneRuns(date), [date]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    setOutcome(null);
    setSaveState('idle');
    setStarted(false);

    const load = async (): Promise<Loaded | null> => {
      const scheduled = await resolveDay(date, grade);
      if (!scheduled) return null;

      const { setId, itemId } = scheduled;

      const [game, set, session] = await Promise.all([
        getGame(scheduled.gameId).catch(() => null),
        setId ? getSet(setId).catch(() => null) : Promise.resolve(null),
        studentId ? getSession(studentId, date).catch(() => null) : Promise.resolve(null),
      ]);

      /*
       * A schedule that names one item (sudoku, word) needs exactly that item;
       * a schedule that names only a set needs the whole pack. Every engine on
       * the programme lands in one of those two branches — the single-item ones
       * because the day picks a puzzle, the MCQ-shaped ones (quiz, myth/fact and
       * flags alike) because the day picks a pack — so a day that resolves at
       * all now reaches a board whatever it is scheduled to play.
       */
      let items: GameItem[] = [];
      let source: Loaded['source'] = 'none';
      if (itemId) {
        const one = await getItem(itemId).catch(() => null);
        if (one) {
          items = [one];
          source = 'api';
        }
      } else if (setId) {
        const result = await loadItems(setId, scheduled.gameId, set?.itemCount ?? 12);
        items = result.items;
        source = result.source;
      }

      return { date, game, set, title: scheduled.title, items, source, session };
    };

    load()
      .then((next) => {
        if (ignore) return;
        setData(next);
        setLoading(false);
      })
      .catch((cause) => {
        if (ignore) return;
        console.error('Game load failed:', cause);
        setError("We couldn't load this game. Check your connection and try again.");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [date, grade, studentId, nonce]);

  /** Save the calculated score remotely, while retaining the local fast path. */
  const award = useCallback(
    (points: number, result: { correct: number | null; total: number | null; solved: boolean | null; seconds: number }) => {
      const gained = recordPlay(studentId, {
        date,
        gameId: data?.game?.gameId ?? 'unknown',
        setId: data?.set?.setId ?? null,
        correct: result.correct,
        total: result.total,
        solved: result.solved,
        points,
        seconds: result.seconds,
      });

      // The daily log tracks the day the student is actually living in, not the
      // day of the game they are catching up on — a Tuesday played on Friday is
      // Friday's activity, and dating it Tuesday would rewrite a closed streak.
      const stamp = isoDate();
      const daily = progress.daily.map((row) => ({ ...row }));
      const todayRow = daily.find((d) => d.date === stamp);
      if (todayRow) {
        todayRow.points += gained;
        todayRow.activities += 1;
      } else {
        daily.push({ date: stamp, points: gained, activities: 1 });
      }

      // Finishing a game completes the "Daily Games & Quizzes" quest, which is
      // what moves the quarter's progress bar and the route ring — otherwise
      // points climb while every bar stays at zero.
      const done = new Set(progress.completedQuests);
      done.add('games');

      update({
        ...progress,
        points: progress.points + gained,
        quizzesPlayed: progress.quizzesPlayed + (gained > 0 || !todayRow ? 1 : 0),
        completedQuests: [...done],
        questProgress: { ...progress.questProgress, games: 100 },
        daily: daily.slice(-7),
      });

      if (!studentId || !data?.game?.gameId) {
        setSaveState('failed');
        return;
      }

      setSaveState('saving');
      void createGameSession({
        studentId,
        date,
        gameId: data.game.gameId,
        setId: data.set?.setId ?? null,
        status: 'completed',
        score: points,
      })
        .then(() => setSaveState('saved'))
        .catch((cause) => {
          console.error('Game session save failed:', cause);
          setSaveState('failed');
        });
    },
    [studentId, date, data, progress, update],
  );

  const finishMcq = useCallback(
    (r: { answers: Record<string, string>; hintsUsed: number; seconds: number }) => {
      setOutcome({ kind: 'mcq', ...r });
      const mark = markMcq(data?.items ?? [], r.answers);
      const earned = pointsForMcq(data?.game ?? null, mark, r.hintsUsed);
      award(earned.points, {
        correct: mark?.correct ?? null,
        total: mark?.total ?? null,
        solved: null,
        seconds: r.seconds,
      });
    },
    [award, data],
  );

  const finishSudoku = useCallback(
    (r: { solved: boolean; gaveUp: boolean; seconds: number; hints: number }) => {
      setOutcome({ kind: 'sudoku', ...r });
      const earned = pointsForSolve(data?.game ?? null, r.solved, r.hints);
      award(earned.points, { correct: null, total: null, solved: r.solved, seconds: r.seconds });
    },
    [award, data],
  );

  const finishWord = useCallback(
    (r: { guess: string; gaveUp: boolean; hintsUsed: number; seconds: number }) => {
      setOutcome({ kind: 'word', ...r });
      const item = data?.items[0];
      const verdict = item ? checkWord(item, r.guess) : { isRight: null, answer: null };
      const solved = verdict.isRight === true && !r.gaveUp;
      const earned = pointsForSolve(data?.game ?? null, solved, r.hintsUsed);
      award(earned.points, { correct: null, total: null, solved, seconds: r.seconds });
    },
    [award, data],
  );

  /*
   * One key per day and per set. Keyed on both so a resumed run can only ever
   * belong to the game it came from — if the schedule changes, the old scratch
   * copy is simply never read again.
   */
  const runKey = `procounsel:school-run:${date}:${data?.set?.setId ?? data?.game?.gameId ?? 'none'}`;

  const tone = TONE[toneFor(data?.game?.gameId ?? 'quiz')];
  const engine = data?.game?.engine ?? '';
  const heading = data?.set?.title || data?.title || data?.game?.name || 'Today’s game';

  const longDate = useMemo(() => {
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }, [date]);

  return (
    <>
      <PageSEO title="Play" description="Play today's game." noIndex />

      <div className="mx-auto w-full max-w-[620px] pb-24">
        {/* Bar: leave, what this is, which day. */}
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-student/games')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] bg-white text-[18px] text-[var(--neutral-500)]"
            aria-label="Back to games"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="ss-eyebrow truncate text-[var(--neutral-400)]">
              {data?.game?.name ?? 'Game'} · {isToday ? 'Today' : longDate}
            </p>
            <h1 className="ss-display truncate text-[18px] text-[var(--ink)]">{heading}</h1>
          </div>
          {data?.game && <GameMark gameId={data.game.gameId} engine={engine} size={40} />}
        </div>

        {/* Past days are records only. */}
        {!isToday && !loading && data && !outcome && (
          <p className="mb-3 rounded-[10px] border border-[var(--card-border)] bg-[#F5F6FA] px-3.5 py-2.5 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
            Viewing <strong className="font-semibold text-[var(--ink)]">{longDate}</strong>.
            Past games cannot be started or replayed.
          </p>
        )}

        {isFuture && (
          <p className="mb-3 rounded-[10px] border border-[#F8E3A3] bg-[#FFFBEB] px-3.5 py-2.5 font-[Poppins] text-[12px] text-[#7A5A00]">
            That day hasn&apos;t opened yet, so here is today&apos;s game instead.
          </p>
        )}

        {loading ? (
          <div className="ss-panel h-[420px] animate-pulse bg-[#F7F8FC]" aria-busy />
        ) : error ? (
          <ErrorState
            variant="inline"
            title="This game didn't load"
            message={error}
            onRetry={() => setNonce((n) => n + 1)}
            showBack={false}
          />
        ) : !data ? (
          <div className="ss-panel p-8 text-center">
            <p className="ss-display text-[18px] text-[var(--ink)]">Nothing scheduled</p>
            <p className="mt-1.5 font-[Poppins] text-[13px] text-[var(--neutral-500)]">
              There is no game for your class on {longDate}.
            </p>
            <Link to="/school-student/games" className="ss-go mt-4 px-5 py-2.5 text-[13.5px]">
              See every game
            </Link>
          </div>
        ) : outcome ? (
          <Summary outcome={outcome} data={data} tone={tone} saveState={saveState} />
        ) : !started ? (
          <GameGate
            data={data}
            isToday={isToday}
            longDate={longDate}
            tone={tone}
            onStart={() => setStarted(true)}
          />
        ) : data.items.length === 0 ? (
          <div className="ss-panel p-8 text-center">
            <p className="ss-display text-[18px] text-[var(--ink)]">
              The question pack isn&apos;t available
            </p>
            <p className="mt-1.5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-500)]">
              The game is scheduled, but its questions can&apos;t be fetched yet.
              {data.set?.itemCount ? ` This set has ${data.set.itemCount} of them.` : ''}
            </p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="ss-go mt-4 px-5 py-2.5 text-[13.5px]"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {data.source === 'probe' && (
              <p className="mb-3 rounded-[10px] border border-[#F8E3A3] bg-[#FFFBEB] px-3 py-2 font-[Poppins] text-[11.5px] text-[#7A5A00]">
                Questions were fetched one at a time because the set endpoint did
                not answer. The order may not match the published set.
              </p>
            )}

            {engine === 'sudoku_v1' ? (
              <SudokuBoard
                item={data.items[0]}
                hintPenalty={data.game?.hintPenalty ?? 0}
                sessionKey={runKey}
                onFinish={finishSudoku}
              />
            ) : engine === 'word_guess_v1' ? (
              <WordBoard
                item={data.items[0]}
                hintPenalty={data.game?.hintPenalty ?? 0}
                sessionKey={runKey}
                onFinish={finishWord}
              />
            ) : (
              <McqBoard
                items={data.items}
                game={data.game}
                timeLimitSecs={data.set?.timeLimitSecs ?? data.game?.defaultTimeLimitSecs}
                sessionKey={runKey}
                onFinish={finishMcq}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

export function GameGate({
  data,
  isToday,
  longDate,
  tone,
  onStart,
}: {
  data: Loaded;
  isToday: boolean;
  longDate: string;
  tone: { ink: string; tint: string; edge: string };
  onStart: () => void;
}) {
  const game = data.game;
  const session = data.session;
  const title = data.set?.title || data.title || game?.name || 'Daily game';
  const activityCount = gameActivityCount(game?.engine, data.set?.itemCount, data.items.length);

  return (
    <section className="ss-panel overflow-hidden">
      <div className="p-6" style={{ background: tone.tint }}>
        <p className="ss-eyebrow" style={{ color: tone.ink }}>
          {session ? 'Last result' : isToday ? 'Before you start' : 'Past game'}
        </p>
        <h2 className="ss-display mt-2 text-[24px] text-[var(--ink)]">{title}</h2>
        {session && (
          <p className="ss-data mt-4 text-[38px] leading-none" style={{ color: tone.ink }}>
            {session.score ?? 0} <span className="text-[15px]">points</span>
          </p>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {session && (
          <dl className="mb-5">
            <Row label="Date" value={session.date ?? data.date} />
            <Row label="Status" value={session.status ?? 'completed'} />
            {typeof session.percent === 'number' && <Row label="Result" value={`${session.percent}%`} />}
            {typeof session.correct === 'number' && typeof session.total === 'number' && (
              <Row label="Correct" value={`${session.correct} of ${session.total}`} />
            )}
          </dl>
        )}

        {session && game?.engine !== 'sudoku_v1' && game?.engine !== 'word_guess_v1' && (
          <AnswerKey items={data.items} />
        )}
        {session && game?.engine === 'word_guess_v1' && data.items[0] && (
          <SavedWordAnswer item={data.items[0]} />
        )}

        <h3 className="ss-display text-[17px] text-[var(--ink)]">Rules</h3>
        <ul className="mt-3 space-y-2 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          {activityCount && (
            <li>{activityCount === 1 ? 'One activity' : `${activityCount} questions`} in this game.</li>
          )}
          <li>{game ? scoringLabel(game) : 'Your completed score is saved for this date'}.</li>
          <li>Time limit: {duration(data.set?.timeLimitSecs ?? game?.defaultTimeLimitSecs)}.</li>
          {game?.supportsHints && <li>Each hint costs {game.hintPenalty} point{game.hintPenalty === 1 ? '' : 's'}.</li>}
          {game && <li>Score {game.passingPercent}% or more to pass.</li>}
        </ul>

        {isToday && !session ? (
          <button type="button" onClick={onStart} className="ss-go mt-5 px-5 py-2.5 text-[13.5px]">
            Start game <span aria-hidden>→</span>
          </button>
        ) : (
          <p className="mt-5 rounded-[12px] border border-[#F8E3A3] bg-[#FFFBEB] px-4 py-3 font-[Poppins] text-[12.5px] text-[#7A5A00]">
            {session
              ? `This game is complete. Your saved score for ${longDate} is final.`
              : `Time limit crossed for ${longDate}. This game was not played.`}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * The end of a run.
 *
 * Every engine now gets a real verdict, from the source of truth for that
 * engine — the grid's own solution, the flag's own filename, or the reviewed
 * key in data/schoolGameAnswers. Where no source exists (a set published with
 * no key entry yet), the score is omitted rather than invented, and the note at
 * the bottom says so in words.
 */
function Summary({
  outcome,
  data,
  tone,
  saveState,
}: {
  outcome: Outcome;
  data: Loaded;
  tone: { ink: string; tint: string; edge: string };
  saveState: 'idle' | 'saving' | 'saved' | 'failed';
}) {
  const mins = Math.floor(outcome.seconds / 60);
  const secs = outcome.seconds % 60;
  const clock = `${mins}m ${String(secs).padStart(2, '0')}s`;

  const mark: Mark | null =
    outcome.kind === 'mcq' ? markMcq(data.items, outcome.answers) : null;

  const word =
    outcome.kind === 'word' && data.items[0]
      ? checkWord(data.items[0], outcome.guess)
      : null;

  const solved =
    outcome.kind === 'sudoku'
      ? outcome.solved
      : outcome.kind === 'word'
        ? word?.isRight === true && !outcome.gaveUp
        : null;

  const earned: RunPoints =
    outcome.kind === 'mcq'
      ? pointsForMcq(data.game, mark, outcome.hintsUsed)
      : pointsForSolve(data.game, solved === true, outcome.kind === 'sudoku' ? outcome.hints : outcome.hintsUsed);

  const passed = mark ? mark.percent >= (data.game?.passingPercent ?? 60) : solved === true;

  return (
    <div className="ss-panel overflow-hidden">
      <div className="p-6 text-center" style={{ background: passed ? '#DCFCE7' : tone.tint }}>
        <p className="text-[42px]" aria-hidden>
          {mark?.correct === mark?.total && mark ? '🏆' : passed ? '🎉' : '✅'}
        </p>

        {mark ? (
          <>
            {/* The headline number, because "how did I do" is the only question
                anyone has at the end of a quiz. */}
            <p className="ss-data mt-2 text-[40px] leading-none text-[var(--ink)]">
              {mark.correct}
              <span className="text-[20px] text-[var(--neutral-400)]">/{mark.total}</span>
            </p>
            <h2 className="ss-display mt-1 text-[19px] text-[var(--ink)]">
              {mark.correct === mark.total
                ? 'Perfect run!'
                : passed
                  ? 'Nice work!'
                  : 'Good try'}
            </h2>
            <div className="mx-auto mt-3 flex max-w-[240px] items-center gap-2">
              <span className="ss-data text-[11px] text-[#16A34A]">{mark.correct} right</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#FEE2E2]">
                <span
                  className="block h-full rounded-full bg-[#22C55E]"
                  style={{ width: `${(mark.correct / mark.total) * 100}%` }}
                />
              </span>
              <span className="ss-data text-[11px] text-[#B91C1C]">
                {mark.total - mark.correct} wrong
              </span>
            </div>
          </>
        ) : (
          <h2 className="ss-display mt-2 text-[22px] text-[var(--ink)]">
            {solved === true ? 'Solved it!' : solved === false ? 'Not this time' : 'Run finished'}
          </h2>
        )}

        <p className="mt-2.5 font-[Poppins] text-[13px] text-[var(--neutral-600)]">
          {data.set?.title ?? data.game?.name} · {clock}
        </p>
      </div>

      <div className="p-5">
        {/* The word, revealed only now. Showing it during play would be the
            game; withholding it after is just a locked drawer. */}
        {outcome.kind === 'word' && word?.answer && (
          <div
            className="mb-4 rounded-[12px] px-4 py-3 text-center"
            style={{ background: word.isRight ? '#DCFCE7' : '#F5F6FA' }}
          >
            <p className="ss-eyebrow text-[var(--neutral-500)]">The word was</p>
            <p className="ss-data mt-1 text-[22px] tracking-[0.14em] text-[var(--ink)]">
              {word.answer}
            </p>
          </div>
        )}

        {outcome.kind === 'sudoku' ? (
          <dl>
            <Row label="Result" value={outcome.solved ? 'Solved' : outcome.gaveUp ? 'Given up' : 'Incomplete'} />
            <Row label="Time" value={clock} />
            <Row label="Squares revealed" value={String(outcome.hints)} />
          </dl>
        ) : outcome.kind === 'word' ? (
          <dl>
            <Row label="Your answer" value={outcome.guess || '—'} />
            <Row
              label="Result"
              value={word?.isRight === null ? 'Not marked' : word?.isRight ? 'Correct' : 'Wrong'}
            />
            <Row label="Hints used" value={String(outcome.hintsUsed)} />
            <Row label="Time" value={clock} />
          </dl>
        ) : (
          <dl>
            <Row
              label="Answered"
              value={`${Object.keys(outcome.answers).length} of ${data.items.length}`}
            />
            <Row label="Hints used" value={String(outcome.hintsUsed)} />
            <Row label="Time" value={clock} />
          </dl>
        )}

        {/* How the points were arrived at, line by line. A single total invites
            "why 6?"; the arithmetic answers it before it is asked. */}
        {earned.breakdown.length > 0 && (
          <div className="mt-4 rounded-[12px] border border-[var(--card-border)] p-4">
            <p className="ss-eyebrow text-[var(--neutral-400)]">Points</p>
            <ul className="mt-2 space-y-1.5">
              {earned.breakdown.map((line) => (
                <li
                  key={line.label}
                  className="flex items-center justify-between font-[Poppins] text-[13px] text-[var(--neutral-600)]"
                >
                  <span>{line.label}</span>
                  <span className="ss-data text-[var(--ink)]">{line.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 flex items-center justify-between border-t border-[var(--card-border)] pt-2.5">
              <span className="ss-eyebrow text-[var(--neutral-500)]">Earned</span>
              <span className="ss-data text-[17px]" style={{ color: tone.ink }}>
                {earned.points}
              </span>
            </p>
          </div>
        )}

        {(mark?.unmarkable ?? 0) > 0 && (
          <p className="mt-4 rounded-[12px] border border-[#F8E3A3] bg-[#FFFBEB] px-4 py-3 font-[Poppins] text-[12.5px] leading-relaxed text-[#7A5A00]">
            {mark!.unmarkable} question{mark!.unmarkable === 1 ? '' : 's'} in this set
            can&apos;t be marked yet, so {mark!.unmarkable === 1 ? 'it is' : 'they are'} left out
            of your score rather than counted against you.
          </p>
        )}

        {!mark && outcome.kind === 'mcq' && (
          <p className="mt-4 rounded-[12px] border border-[var(--card-border)] bg-[#F7F8FC] px-4 py-3 font-[Poppins] text-[12.5px] leading-relaxed text-[var(--neutral-600)]">
            This set can&apos;t be marked yet, so no score is shown rather than a
            guessed one. Your answers and the explanations are below.
          </p>
        )}

        <p
          role={saveState === 'failed' ? 'alert' : 'status'}
          className="mt-4 rounded-[12px] border border-[var(--card-border)] bg-[#F7F8FC] px-4 py-3 font-[Poppins] text-[12.5px] leading-relaxed text-[var(--neutral-600)]"
        >
          {saveState === 'saving'
            ? 'Saving your score…'
            : saveState === 'saved'
              ? 'Score saved. Your progress and leaderboard can now update.'
              : saveState === 'failed'
                ? 'Your result is saved on this device, but could not reach the server. Please check your connection.'
                : 'Your result is saved on this device.'}
        </p>

        {outcome.kind === 'mcq' && mark && (
          <Review items={data.items} answers={outcome.answers} mark={mark} />
        )}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link to="/school-student/games" className="ss-go px-5 py-2.5 text-[13.5px]">
            Back to games
          </Link>
          <Link
            to="/school-student/dashboard"
            className="flex items-center rounded-[12px] border border-[var(--card-border)] bg-white px-5 py-2.5 font-[Poppins] text-[13.5px] font-semibold text-[var(--neutral-600)]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Going back through the questions afterwards.
 *
 * This is what the item's `explanation` is for, and why it is not shown during
 * play: read at the moment of answering it hands over the answer without ever
 * marking it. Read here, next to what the student actually chose AND next to
 * what was right, it teaches.
 *
 * A row whose item has no key shows neither tick nor cross — `isRight: null`
 * from `markMcq` reaches this component unchanged, so an unmarkable question
 * looks like a note rather than a silent pass.
 */
function Review({
  items,
  answers,
  mark,
}: {
  items: GameItem[];
  answers: Record<string, string>;
  mark: Mark;
}) {
  const rows = new Map(mark.byItem.map((row) => [row.itemId, row]));
  const wrong = mark.total - mark.correct;

  return (
    <details className="group mt-4" open={wrong > 0}>
      <summary className="ss-eyebrow flex cursor-pointer list-none items-center justify-between rounded-[12px] border border-[var(--card-border)] bg-white px-4 py-3.5 text-[var(--neutral-600)]">
        Review your answers ({items.length})
        <span aria-hidden className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <ol className="mt-3 space-y-3">
        {items.map((item, index) => {
          const row = rows.get(item.itemId);
          const chosenId = answers[item.itemId];
          const chosen = item.content.options?.find((o) => o.id === chosenId);
          const right = item.content.options?.find((o) => o.id === row?.correctId);
          const isRight = row?.isRight ?? null;
          const note = noteOf(item);

          return (
            <li key={item.itemId} className="rounded-[12px] border border-[var(--card-border)] p-4">
              <div className="flex items-start gap-2.5">
                <span className="ss-data mt-0.5 shrink-0 text-[12px] text-[var(--neutral-400)]">
                  {index + 1}
                </span>
                <p className="font-[Poppins] text-[13.5px] leading-snug font-semibold text-[var(--ink)]">
                  {promptOf(item)}
                </p>
              </div>

              <p
                className="mt-2.5 flex items-center gap-2 rounded-[10px] px-3 py-2 font-[Poppins] text-[13px]"
                style={
                  isRight === null
                    ? { background: '#F5F6FA', color: 'var(--neutral-600)' }
                    : isRight
                      ? { background: '#DCFCE7', color: '#16A34A' }
                      : { background: '#FEE2E2', color: '#B91C1C' }
                }
              >
                {isRight !== null && <span aria-hidden>{isRight ? '✓' : '✗'}</span>}
                <span className="ss-eyebrow opacity-70">You chose</span>
                {chosen?.text ?? 'Nothing'}
              </p>

              {right && (
                <p className="mt-1.5 flex items-center gap-2 rounded-[10px] bg-[#F0FDF4] px-3 py-2 font-[Poppins] text-[13px] text-[#15803D]">
                  <span aria-hidden>→</span>
                  <span className="ss-eyebrow opacity-70">Answer</span>
                  {right.text}
                </p>
              )}

              {note && (
                <p className="mt-2 font-[Poppins] text-[12.5px] leading-relaxed text-[var(--neutral-600)]">
                  {note}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/** Correct answers remain reviewable on a saved result, even though the
 * session API does not return the student's historical option selections. */
export function AnswerKey({ items }: { items: GameItem[] }) {
  const rows = new Map((markMcq(items, {})?.byItem ?? []).map((row) => [row.itemId, row]));
  const reviewable = items.flatMap((item) => {
    const correctId = rows.get(item.itemId)?.correctId;
    const answer = item.content.options?.find((option) => option.id === correctId)?.text;
    return answer ? [{ item, answer }] : [];
  });

  if (!reviewable.length) return null;

  return (
    <details className="group mb-5" open>
      <summary className="ss-eyebrow flex cursor-pointer list-none items-center justify-between rounded-[12px] border border-[var(--card-border)] bg-white px-4 py-3.5 text-[var(--neutral-600)]">
        Correct answers and explanations ({reviewable.length})
        <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ol className="mt-3 space-y-3">
        {reviewable.map(({ item, answer }, index) => (
          <li key={item.itemId} className="rounded-[12px] border border-[var(--card-border)] p-4">
            <p className="font-[Poppins] text-[13.5px] font-semibold text-[var(--ink)]">
              {index + 1}. {promptOf(item)}
            </p>
            <p className="mt-2 rounded-[10px] bg-[#F0FDF4] px-3 py-2 font-[Poppins] text-[13px] text-[#15803D]">
              <span className="ss-eyebrow mr-2 opacity-70">Answer</span>{answer}
            </p>
            {noteOf(item) && (
              <p className="mt-2 font-[Poppins] text-[12.5px] leading-relaxed text-[var(--neutral-600)]">
                {noteOf(item)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function SavedWordAnswer({ item }: { item: GameItem }) {
  const answer = checkWord(item, '').answer;
  if (!answer) return null;

  return (
    <div className="mb-5 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
      <p className="ss-eyebrow text-[#15803D]">Correct answer</p>
      <p className="ss-data mt-1 text-[22px] tracking-[0.12em] text-[var(--ink)]">{answer}</p>
      {noteOf(item) && (
        <p className="mt-2 font-[Poppins] text-[12.5px] leading-relaxed text-[var(--neutral-600)]">
          {noteOf(item)}
        </p>
      )}
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="ss-readout">
    <dt className="ss-eyebrow text-[var(--neutral-400)]">{label}</dt>
    <dd className="ss-data text-[13px] text-[var(--ink)]">{value}</dd>
  </div>
);
