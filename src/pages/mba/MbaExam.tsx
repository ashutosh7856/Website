import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';
import ShellPortal from '@/components/mba/ShellPortal';
import { AnswerInput, SafeHtml, SetPanel, StateBlock } from '@/components/mba/ui';
import { formatClock, SECTION_SHORT } from '@/components/mba/format';
import {
  mbaApi,
  mbaErrorMessage,
  mbaKeys,
  mbaStatus,
  SECTION_LABEL,
  type Attempt,
  type AttemptResponse,
  type SectionId,
} from '@/api/mba';

/**
 * The mock exam player.
 *
 * The server owns the clock and the answers; this page is a cache of both.
 *  • Timing: the section ends at `sectionEndsAt` in SERVER time. The offset
 *    between server and device clocks is taken from `serverNow` on every
 *    response and re-read every minute (and when the tab comes back), so a
 *    wrong or drifting device clock never moves the deadline.
 *  • Saving: changed responses are PATCHed shortly after each change and every
 *    10s, each with a higher `seq`; the server ignores stale ones.
 *  • Recovery: opening /mba/exam/:testId POSTs /attempts, which hands back the
 *    in-progress attempt if there is one — so a reload resumes.
 */

const AUTOSAVE_MS = 10_000;
const CHANGE_DEBOUNCE_MS = 1_500;
const RESYNC_MS = 60_000;

type PaletteState = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';
type SaveState = 'idle' | 'saving' | 'saved' | 'offline';
type Confirm = null | 'section' | 'final';

const EMPTY: AttemptResponse = { answer: null, markedForReview: false, timeSpentMs: 0 };

const PALETTE_STYLE: Record<PaletteState, { bg: string; fg: string; border: string; label: string }> = {
  not_visited: { bg: '#F3F4F6', fg: '#4B5563', border: '#E5E7EB', label: 'Not visited' },
  not_answered: { bg: '#FEE2E2', fg: '#B91C1C', border: '#FCA5A5', label: 'Not answered' },
  answered: { bg: '#DCFCE7', fg: '#15803D', border: '#86EFAC', label: 'Answered' },
  marked: { bg: '#EDE9FE', fg: '#5B21B6', border: '#C4B5FD', label: 'Marked for review' },
  answered_marked: { bg: '#EDE9FE', fg: '#5B21B6', border: '#22C55E', label: 'Answered & marked' },
};

function paletteState(r: AttemptResponse | undefined, visited: boolean): PaletteState {
  const answered = !!r && r.answer !== null && r.answer !== '';
  const marked = !!r?.markedForReview;
  if (answered && marked) return 'answered_marked';
  if (marked) return 'marked';
  if (answered) return 'answered';
  return visited ? 'not_answered' : 'not_visited';
}

export default function MbaExam() {
  const { testId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, AttemptResponse>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const attemptId = attempt?.id;

  // Synchronous mirrors for the save loop, which must never read stale state.
  const responsesRef = useRef<Record<string, AttemptResponse>>({});
  const dirtyRef = useRef<Set<string>>(new Set());
  const seqRef = useRef(0);
  const savingRef = useRef(false);
  const offsetRef = useRef(0); // serverTime - deviceTime
  const endsAtRef = useRef(0);
  const attemptRef = useRef<Attempt | null>(null);
  const activeRef = useRef<{ id: string | null; since: number }>({ id: null, since: Date.now() });
  const timeUpRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<Promise<Attempt> | null>(null);

  // ── Applying server state ────────────────────────────────────────────────
  const applyAttempt = useCallback((a: Attempt, { resetQuestion = false } = {}) => {
    offsetRef.current = Date.parse(a.serverNow) - Date.now();
    endsAtRef.current = Date.parse(a.sectionEndsAt);
    seqRef.current = Math.max(seqRef.current, a.savedSeq ?? 0);
    const sectionChanged = attemptRef.current?.currentSection !== a.currentSection;
    attemptRef.current = a;
    // Re-arm the time-up handler only when there is time on the clock again —
    // otherwise a server that has not yet rolled the section over would be
    // asked to, twice a second.
    if (sectionChanged || Date.parse(a.sectionEndsAt) > Date.parse(a.serverNow)) timeUpRef.current = false;

    // Server answers, with anything not yet saved from this device on top.
    const merged: Record<string, AttemptResponse> = { ...a.responses };
    for (const id of dirtyRef.current) {
      if (responsesRef.current[id]) merged[id] = responsesRef.current[id];
    }
    responsesRef.current = merged;
    setResponses(merged);
    setAttempt(a);
    setVisited((prev) => {
      const next = new Set(prev);
      for (const [id, r] of Object.entries(a.responses)) {
        if (r.answer !== null || r.markedForReview || r.timeSpentMs > 0) next.add(id);
      }
      return next;
    });

    if (resetQuestion || sectionChanged) {
      const first = a.questions
        .filter((q) => q.section === a.currentSection)
        .sort((x, y) => x.sectionIndex - y.sectionIndex)[0];
      setCurrentId(first?.id ?? null);
    }
  }, []);

  const goToResult = useCallback(
    (id: string) => navigate(`/mba/results/${id}`, { replace: true }),
    [navigate],
  );

  // ── Start / resume ───────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    // One POST even under StrictMode's double effect: the promise is shared.
    if (!startRef.current) startRef.current = mbaApi.startAttempt(testId);
    startRef.current
      .then((a) => {
        if (ignore) return;
        if (a.status === 'submitted') return goToResult(a.id);
        applyAttempt(a, { resetQuestion: true });
      })
      .catch((err) => {
        if (!ignore) setLoadError(mbaErrorMessage(err, 'Could not start this test.'));
      });
    return () => {
      ignore = true;
    };
  }, [testId, applyAttempt, goToResult]);

  // ── Time on question ─────────────────────────────────────────────────────
  const commitTime = useCallback(() => {
    const { id, since } = activeRef.current;
    const t = Date.now();
    activeRef.current = { id, since: t };
    if (!id || !attemptRef.current) return;
    const prev = responsesRef.current[id] ?? EMPTY;
    const next = { ...prev, timeSpentMs: prev.timeSpentMs + (t - since) };
    responsesRef.current = { ...responsesRef.current, [id]: next };
    dirtyRef.current.add(id);
  }, []);

  useEffect(() => {
    commitTime();
    activeRef.current = { id: currentId, since: Date.now() };
    if (currentId) setVisited((prev) => (prev.has(currentId) ? prev : new Set(prev).add(currentId)));
  }, [currentId, commitTime]);

  // ── Saving ───────────────────────────────────────────────────────────────
  const resync = useCallback(async () => {
    const a = attemptRef.current;
    if (!a) return;
    try {
      const fresh = await mbaApi.getAttempt(a.id);
      if (fresh.status === 'submitted') return goToResult(fresh.id);
      applyAttempt(fresh);
    } catch {
      // Keep the current clock; the next resync will try again.
    }
  }, [applyAttempt, goToResult]);

  const flush = useCallback(async (): Promise<boolean> => {
    const a = attemptRef.current;
    if (!a) return true;
    commitTime();
    // Only the open section is writable — the server 409s the whole batch if
    // a closed section's question is in it, so those are dropped here.
    const open = new Set(a.questions.filter((q) => q.section === a.currentSection).map((q) => q.id));
    for (const id of dirtyRef.current) if (!open.has(id)) dirtyRef.current.delete(id);
    if (savingRef.current || dirtyRef.current.size === 0) return dirtyRef.current.size === 0;
    const ids = [...dirtyRef.current];
    dirtyRef.current = new Set();
    const seq = seqRef.current + 1;
    seqRef.current = seq;
    savingRef.current = true;
    setSaveState('saving');
    try {
      await mbaApi.saveResponses(a.id, {
        seq,
        responses: ids.map((id) => ({ questionId: id, ...(responsesRef.current[id] ?? EMPTY) })),
      });
      setSaveState(dirtyRef.current.size ? 'idle' : 'saved');
      return true;
    } catch (err) {
      if (mbaStatus(err) === 409) {
        // The section closed on the server. Those answers are frozen there;
        // pick up the new state instead of retrying.
        setSaveState('saved');
        void resync();
        return false;
      }
      ids.forEach((id) => dirtyRef.current.add(id));
      setSaveState('offline');
      return false;
    } finally {
      savingRef.current = false;
    }
  }, [commitTime, resync]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void flush(), CHANGE_DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
    if (!attemptId) return;
    const id = setInterval(() => void flush(), AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [attemptId, flush]);

  useEffect(() => {
    if (!attemptId) return;
    const id = setInterval(() => void resync(), RESYNC_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void resync();
      else void flush();
    };
    document.addEventListener('visibilitychange', onVisible);
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      void flush();
      if (dirtyRef.current.size) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [attemptId, resync, flush]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const updateResponse = (id: string, patch: Partial<AttemptResponse>) => {
    const next = { ...(responsesRef.current[id] ?? EMPTY), ...patch };
    responsesRef.current = { ...responsesRef.current, [id]: next };
    dirtyRef.current.add(id);
    setResponses(responsesRef.current);
    setSaveState('idle');
    scheduleSave();
  };

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const remainingMs = attempt ? endsAtRef.current - (now + offsetRef.current) : 0;

  // ── Section / final submit ───────────────────────────────────────────────
  const isLastSection = (a: Attempt) => a.sectionOrder.indexOf(a.currentSection) >= a.sectionOrder.length - 1;

  const submitFinal = useCallback(async () => {
    const a = attemptRef.current;
    if (!a) return;
    setBusy('Submitting your test…');
    setActionError(null);
    await flush();
    try {
      const result = await mbaApi.submitAttempt(a.id);
      qc.setQueryData(mbaKeys.result(a.id), result);
      void qc.invalidateQueries({ queryKey: mbaKeys.dashboard });
      void qc.invalidateQueries({ queryKey: mbaKeys.attempts });
      goToResult(a.id);
    } catch (err) {
      setBusy(null);
      setActionError(mbaErrorMessage(err, 'Could not submit. Your answers are saved — try again.'));
    }
  }, [flush, goToResult, qc]);

  const submitSection = useCallback(async () => {
    const a = attemptRef.current;
    if (!a) return;
    if (isLastSection(a)) return submitFinal();
    setBusy('Opening the next section…');
    setActionError(null);
    await flush();
    try {
      const next = await mbaApi.submitSection(a.id, a.currentSection);
      if (next.status === 'submitted') return goToResult(next.id);
      applyAttempt(next, { resetQuestion: true });
    } catch (err) {
      // Most likely the server already moved on (time up) — read its state.
      if (mbaStatus(err) === 409) await resync();
      else setActionError(mbaErrorMessage(err, 'Could not submit this section. Try again.'));
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }, [applyAttempt, flush, goToResult, resync, submitFinal]);

  // Time up: the server applies it too; this just keeps the screen in step.
  useEffect(() => {
    if (!attempt || busy || remainingMs > 0 || timeUpRef.current) return;
    timeUpRef.current = true;
    setConfirm(null);
    void submitSection();
  }, [attempt, busy, remainingMs, submitSection]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const sectionQuestions = useMemo(
    () =>
      attempt
        ? attempt.questions
            .filter((q) => q.section === attempt.currentSection)
            .sort((x, y) => x.sectionIndex - y.sectionIndex)
        : [],
    [attempt],
  );
  const currentIndex = Math.max(0, sectionQuestions.findIndex((q) => q.id === currentId));
  const question = sectionQuestions[currentIndex];

  const counts = useMemo(() => {
    const c: Record<PaletteState, number> = { not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0 };
    for (const q of sectionQuestions) c[paletteState(responses[q.id], visited.has(q.id))] += 1;
    return c;
  }, [sectionQuestions, responses, visited]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (loadError)
    return (
      <div className="p-4 pt-16">
        <StateBlock tone="error" title="Couldn't open this test" detail={loadError} action={{ label: 'Back to mock tests', href: '/mba/mocks' }} />
      </div>
    );
  if (!attempt)
    return (
      <div className="flex min-h-screen items-center justify-center font-[Poppins] text-[14px] text-[var(--neutral-500)]" aria-busy>
        Preparing your test…
      </div>
    );
  if (sectionQuestions.length === 0)
    return (
      <div className="p-4 pt-16">
        <StateBlock
          tone="empty"
          title="This test has no questions yet"
          detail="Questions for this paper are still being added."
          action={{ label: 'Back to mock tests', href: '/mba/mocks' }}
        />
      </div>
    );

  const go = (i: number) => {
    const target = sectionQuestions[Math.min(Math.max(0, i), sectionQuestions.length - 1)];
    if (target) setCurrentId(target.id);
    setPaletteOpen(false);
  };
  const r = (question && responses[question.id]) ?? EMPTY;
  const low = remainingMs < 5 * 60_000;
  const last = isLastSection(attempt);

  const palette = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {(Object.keys(PALETTE_STYLE) as PaletteState[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 font-[Poppins] text-[10px] text-[var(--neutral-600)]">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md border-2 text-[10px] font-bold"
              style={{ background: PALETTE_STYLE[s].bg, color: PALETTE_STYLE[s].fg, borderColor: PALETTE_STYLE[s].border }}
            >
              {counts[s]}
            </span>
            {PALETTE_STYLE[s].label}
          </span>
        ))}
      </div>
      <p className="ss-eyebrow text-[var(--neutral-400)]">{SECTION_LABEL[attempt.currentSection]}</p>
      <ol className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
        {sectionQuestions.map((q, i) => {
          const st = paletteState(responses[q.id], visited.has(q.id));
          const style = PALETTE_STYLE[st];
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Question ${i + 1}: ${style.label}`}
                aria-current={q.id === question?.id ? 'true' : undefined}
                className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border-2 font-[Poppins] text-[12px] font-bold"
                style={{
                  background: style.bg,
                  color: style.fg,
                  borderColor: style.border,
                  outline: q.id === question?.id ? '2px solid var(--ink)' : undefined,
                  outlineOffset: 1,
                }}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setConfirm(last ? 'final' : 'section')}
        className="btn-primary w-full cursor-pointer px-4 py-2.5 font-[Poppins] text-[13px] font-semibold"
      >
        {last ? 'Submit test' : `Submit ${SECTION_SHORT[attempt.currentSection]} section`}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--borders-default)] bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate font-[Poppins] text-[13px] font-bold text-[var(--ink)]">{attempt.title}</p>
            <ol className="mt-1 flex gap-1.5">
              {attempt.sectionOrder.map((s, i) => {
                const idx = attempt.sectionOrder.indexOf(attempt.currentSection);
                const state = i < idx ? 'done' : i === idx ? 'current' : 'locked';
                return (
                  <li
                    key={s}
                    className="rounded-full px-2 py-0.5 font-[Poppins] text-[10px] font-bold"
                    style={{
                      background: state === 'current' ? 'var(--brand-purple-500)' : state === 'done' ? 'var(--green-100)' : 'var(--neutral-100)',
                      color: state === 'current' ? '#fff' : state === 'done' ? 'var(--green-600)' : 'var(--neutral-400)',
                    }}
                  >
                    {SECTION_SHORT[s as SectionId]}
                    {state === 'done' ? ' ✓' : ''}
                  </li>
                );
              })}
            </ol>
          </div>
          <span
            className="hidden font-[Poppins] text-[11px] sm:block"
            style={{ color: saveState === 'offline' ? 'var(--red-500)' : 'var(--neutral-400)' }}
            aria-live="polite"
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'All answers saved' : saveState === 'offline' ? 'Offline — will retry' : ''}
          </span>
          <div
            className="rounded-xl px-3 py-1.5 text-center"
            style={{ background: low ? 'var(--red-100)' : 'var(--brand-purple-50)' }}
            role="timer"
            aria-label="Time left in this section"
          >
            <p className="ss-data text-[18px] leading-none" style={{ color: low ? 'var(--red-500)' : 'var(--ink)' }}>
              {formatClock(remainingMs)}
            </p>
            <p className="font-[Poppins] text-[9px] text-[var(--neutral-500)]">section time left</p>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Question palette"
            className="cursor-pointer rounded-lg border border-[var(--borders-default)] p-2 lg:hidden"
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
        </div>
        {saveState === 'offline' && (
          <p className="bg-[var(--red-100)] px-4 py-1 text-center font-[Poppins] text-[11px] text-[var(--red-500)] sm:hidden">
            Offline — answers will save when you reconnect
          </p>
        )}
      </header>

      <div className="flex flex-1 gap-5 px-4 py-4 md:px-6">
        {/* Question */}
        <main className="min-w-0 flex-1 space-y-4 pb-24">
          {question && (
            <div className={question.set ? 'grid gap-4 xl:grid-cols-2' : ''}>
              {question.set && <SetPanel set={question.set} />}
              <section className="ss-panel space-y-4 p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <span className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">
                    Question {currentIndex + 1} of {sectionQuestions.length}
                  </span>
                  <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
                    {question.type === 'TITA' ? 'Type in the answer' : 'MCQ'}
                  </span>
                </div>
                <SafeHtml html={question.stemHtml} />
                <AnswerInput
                  key={question.id}
                  question={question}
                  value={r.answer}
                  onChange={(answer) => updateResponse(question.id, { answer })}
                  disabled={!!busy}
                />
              </section>
            </div>
          )}
          {actionError && (
            <p role="alert" className="font-[Poppins] text-[13px] text-[var(--red-500)]">
              {actionError}
            </p>
          )}
        </main>

        {/* Palette — desktop */}
        <aside className="ss-panel sticky top-[84px] hidden h-fit w-[300px] shrink-0 p-4 lg:block">{palette}</aside>
      </div>

      {/* Bottom actions */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--borders-default)] bg-white/95 px-3 py-2.5 backdrop-blur" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
        <div className="flex flex-wrap items-center gap-2 lg:pr-[320px]">
          <button
            type="button"
            onClick={() => question && updateResponse(question.id, { markedForReview: !r.markedForReview })}
            className="btn-secondary cursor-pointer px-3 py-2 font-[Poppins] text-[12px] font-semibold"
            aria-pressed={r.markedForReview}
          >
            {r.markedForReview ? 'Unmark review' : 'Mark for review'}
          </button>
          <button
            type="button"
            onClick={() => question && updateResponse(question.id, { answer: null })}
            disabled={r.answer === null}
            className="btn-secondary cursor-pointer px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-40"
          >
            Clear response
          </button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => go(currentIndex - 1)}
              disabled={currentIndex === 0}
              aria-label="Previous question"
              className="btn-secondary flex cursor-pointer items-center px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              onClick={() => (currentIndex === sectionQuestions.length - 1 ? setConfirm(last ? 'final' : 'section') : go(currentIndex + 1))}
              className="btn-primary flex cursor-pointer items-center px-4 py-2 font-[Poppins] text-[12px] font-semibold"
            >
              {currentIndex === sectionQuestions.length - 1 ? (last ? 'Finish' : 'End section') : 'Save & next'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Palette — mobile sheet */}
      {paletteOpen && (
        <ShellPortal>
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal aria-label="Question palette">
          <button className="absolute inset-0 bg-black/50" aria-label="Close palette" onClick={() => setPaletteOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-[Poppins] text-[14px] font-bold text-[var(--ink)]">Questions</p>
              <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Close" className="cursor-pointer p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            {palette}
          </div>
        </div>
        </ShellPortal>
      )}

      {/* Submit confirmation — in the page, not window.confirm */}
      {(confirm || busy) && (
        <ShellPortal>
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal aria-labelledby="mba-confirm-title">
          <div className="w-full max-w-[460px] rounded-t-[20px] bg-white p-5 sm:rounded-[20px] md:p-6">
            {busy ? (
              <p id="mba-confirm-title" className="py-6 text-center font-[Poppins] text-[14px] text-[var(--neutral-600)]" aria-live="polite">
                {busy}
              </p>
            ) : (
              <>
                <h2 id="mba-confirm-title" className="ss-display text-[18px] text-[var(--ink)]">
                  {confirm === 'final' ? 'Submit the whole test?' : `Submit the ${SECTION_SHORT[attempt.currentSection]} section?`}
                </h2>
                <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-600)]">
                  {confirm === 'final'
                    ? 'You will not be able to change any answer after this. Your score and solutions open right away.'
                    : 'You cannot come back to this section once the next one opens. Its remaining time is not carried over.'}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2 font-[Poppins] text-[12px]">
                  {(
                    [
                      ['Answered', counts.answered + counts.answered_marked],
                      ['Not answered', counts.not_answered],
                      ['Marked for review', counts.marked + counts.answered_marked],
                      ['Not visited', counts.not_visited],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-[var(--neutral-50)] px-3 py-2">
                      <dt className="text-[var(--neutral-500)]">{k}</dt>
                      <dd className="ss-data text-[16px] text-[var(--ink)]">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
                  Time left in this section: {formatClock(remainingMs)}
                </p>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirm(null)}
                    className="btn-secondary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
                  >
                    Keep working
                  </button>
                  <button
                    type="button"
                    onClick={() => void (confirm === 'final' ? submitFinal() : submitSection())}
                    className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
                  >
                    {confirm === 'final' ? 'Submit test' : 'Submit section'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </ShellPortal>
      )}

      <Link to="/mba/mocks" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-70 focus:bg-white focus:p-2">
        Leave test (answers are saved)
      </Link>
    </div>
  );
}
