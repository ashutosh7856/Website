import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { Icon } from '@/components/school-student/assets';
import ShellClock from '@/components/school-student/ShellClock';
import '@/styles/schoolTheme.css';
import DashboardSidebar from '@/components/school-student/DashboardSidebar';
import { useAuthStore } from '@/store/AuthStore';
import {
  buildDashboardView,
  readProgress,
  recordVisit,
  withServerRecord,
  writeProgress,
  type Progress,
} from '@/lib/schoolStudentProgress';
import { useSchoolStudentRecord } from '@/lib/useSchoolStudentRecord';
import { firstNameOf, type SchoolShellContext } from '@/lib/schoolShellContext';
import { parseGrade, today as isoToday } from '@/api/schoolStudentApi';
import { getSession } from '@/api/schoolGames';

/**
 * The school student's entire app shell.
 *
 * This is NOT the site layout with a few things hidden — it replaces it. No
 * RevampHeader, no site footer, no chatbot, no enquiry popup. A school student
 * lives inside this rail the way an admin lives inside an admin panel, which is
 * why these routes sit outside the RevampLayout subtree in AppRoutes rather
 * than inside it with conditionals.
 *
 * The shell owns the progress state and hands it down through the router's
 * outlet context, so the rail and the page always read the same numbers and
 * storage is touched exactly once per visit.
 *
 * Points, streak and the psychometric report come from the backend record,
 * re-read here on every mount. A school student stays signed in for months, so
 * the copy AuthStore persisted at signup is only ever a fallback — branching
 * the UI on it is how the numbers start going stale without anyone noticing.
 */

/**
 * The loading state, held back for a moment.
 *
 * Most navigations inside the shell resolve in well under 150ms. Rendering a
 * skeleton immediately meant it appeared and vanished within a frame or two,
 * which is what read as a flicker — the eye catches the change, not the
 * content. Waiting first means a fast navigation shows nothing at all and a
 * slow one still explains itself.
 */
function DeferredSkeleton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;
  return (
    <div className="mx-auto max-w-[1240px] space-y-4" aria-busy>
      <div className="h-[300px] animate-pulse rounded-[24px] bg-[#EDEFF6]" />
      <div className="h-[120px] animate-pulse rounded-[16px] bg-[#F1F3F8]" />
    </div>
  );
}

export default function SchoolStudentLayout() {
  const { role, isAuthenticated, schoolStudent, user, userId, logout } = useAuthStore();
  const location = useLocation();
  const phone = schoolStudent?.phoneNumber ?? userId ?? null;

  // Seeded synchronously so the first paint already has the student's numbers;
  // an effect-only read would flash an empty shell on every navigation.
  const [progress, setProgress] = useState<Progress | null>(() =>
    phone ? readProgress(phone) : null,
  );
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Advancing the streak is a write, so it belongs in an effect rather than in
  // render — StrictMode runs render twice.
  useEffect(() => {
    if (!phone) return;
    const stored = readProgress(phone);
    const visited = recordVisit(stored);
    if (visited !== stored) writeProgress(phone, visited);
    setProgress(visited);
  }, [phone]);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const update = useCallback(
    (next: Progress) => {
      writeProgress(phone, next);
      setProgress(next);
    },
    [phone],
  );

  const { record, reload: refreshRecord } = useSchoolStudentRecord(phone);

  /*
   * Who this student is, decided once for the whole shell.
   *
   * Both of these used to be worked out again on each page, from whichever
   * source that page happened to import, and the pages disagreed. The games
   * page read the class only from what signup persisted — and `verifyOtp` drops
   * that profile on any login it cannot match to the same phone, so a returning
   * student had no class at all and was told so, on top of being handed a
   * schedule with no pack in it. The server record has their class; it is read
   * here and everything downstream uses this answer.
   */
  const className = record?.className ?? schoolStudent?.className ?? null;
  const grade = parseGrade(className);
  const studentId = record?.schoolStudentId ?? phone;

  // Has the backend recorded a game for today? One small GET, deduped with the
  // one the games page makes, and the only source of this fact that survives a
  // new device or a cleared browser.
  const [playedToday, setPlayedToday] = useState(false);
  const stamp = isoToday();
  useEffect(() => {
    if (!studentId) return;
    let ignore = false;
    getSession(studentId, stamp)
      .then((session) => {
        if (!ignore && session) setPlayedToday(true);
      })
      .catch(() => {
        // No session, or the service is unreachable. The local ledger still
        // answers for this device; a missing session is never an error here.
      });
    return () => {
      ignore = true;
    };
  }, [studentId, stamp]);

  // The server wins on the fields it owns; local storage keeps the rest, points
  // are reconciled because nothing on the backend can award one yet, and the
  // day's tally is rebuilt from the play records rather than trusted.
  const merged = useMemo(
    () =>
      progress
        ? withServerRecord(progress, record, studentId, { playedToday, today: stamp })
        : null,
    [progress, record, studentId, playedToday, stamp],
  );

  const view = useMemo(() => (merged ? buildDashboardView(merged) : null), [merged]);

  // After every hook, so the hook order never changes between renders.
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role !== 'schoolStudent') return <Navigate to="/" replace />;

  const firstName =
    firstNameOf(record?.firstName, schoolStudent?.firstName, user?.firstName) ?? 'there';

  const rail = view && (
    <DashboardSidebar
      dailyGoalDone={view.activitiesToday}
      dailyGoalTarget={view.dailyGoalTarget}
      onNavigate={() => setDrawerOpen(false)}
      onClose={isDrawerOpen ? () => setDrawerOpen(false) : undefined}
    />
  );

  return (
    <div className="school-shell flex min-h-screen bg-[var(--surfaces-page)]">
      {/* Desktop rail */}
      <div className="sticky top-0 hidden h-screen lg:block">{rail}</div>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 h-full">{rail}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 md:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="ss-surface cursor-pointer p-2 text-[var(--neutral-900)] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* The left of this bar was empty on every page. The clock takes it,
              so the date is the first thing in the header rather than a line of
              eyebrow text lost against the hero's sky. */}
          <ShellClock />

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {view && (
              <div className="ss-surface flex items-center gap-3 px-3 py-2 md:gap-4 md:px-4">
                <span className="flex items-center gap-2">
                  <Icon name="flameStreak" className="h-5 w-5" />
                  <span className="font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)]">
                    <strong className="block text-[14px] font-bold text-[var(--neutral-900)]">
                      {view.streakDays}
                    </strong>
                    Day Streak
                  </span>
                </span>
                <span className="h-8 w-px bg-[var(--borders-default)]" />
                <span className="flex items-center gap-2">
                  <Icon name="coinPoints" className="h-5 w-5" />
                  <span className="font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)]">
                    <strong className="block text-[14px] font-bold text-[var(--neutral-900)]">
                      {view.points.toLocaleString('en-IN')}
                    </strong>
                    Points
                  </span>
                </span>
              </div>
            )}

            <button
              type="button"
              aria-label="Notifications"
              title="Notifications are coming soon"
              disabled
              className="ss-surface relative hidden h-11 w-11 items-center justify-center text-[var(--neutral-500)] sm:flex"
            >
              <span className="text-[17px]" aria-hidden>
                🔔
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Account menu"
                aria-expanded={isMenuOpen}
                className="ss-surface flex cursor-pointer items-center gap-2.5 px-2 py-1.5 md:px-3 md:py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-purple-50)]">
                  <Icon name="studentAvatar" className="h-8 w-8" />
                </span>
                <span className="hidden text-left font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)] sm:block">
                  <strong className="block text-[13px] font-bold text-[var(--neutral-900)]">
                    Hi, {firstName}! <span aria-hidden>👋</span>
                  </strong>
                  {view ? `Level ${view.level.level} ${view.level.name}` : ''}
                </span>
                <ChevronDown className="h-4 w-4 text-[var(--neutral-500)]" />
              </button>

              {isMenuOpen && (
                <div className="ss-surface absolute right-0 z-50 mt-2 w-44 overflow-hidden py-1">
                  <button
                    onClick={logout}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 font-[Poppins] text-[13px] text-[var(--red-500)] hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-1 pb-16 md:px-8">
          {view && merged && (
            /*
             * The shell's OWN Suspense boundary.
             *
             * Without it the nearest boundary is the one wrapping every route in
             * AppRoutes, so moving between two school pages unmounted the rail
             * and the top bar and threw up the site-wide full-page loader — the
             * app appeared to close and reopen on every tap. React uses the
             * nearest boundary, so putting one here keeps the chrome on screen
             * and swaps only the content.
             */
            <Suspense fallback={<DeferredSkeleton />}>
              <div key={location.pathname} className="ss-page">
                <Outlet
                  context={
                    {
                      view,
                      progress: merged,
                      update,
                      record,
                      refreshRecord,
                      studentId,
                      grade,
                      className,
                    } satisfies SchoolShellContext
                  }
                />
              </div>
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
