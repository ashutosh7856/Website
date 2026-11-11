import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { Icon } from '@/components/school-student/assets';
import ShellClock from '@/components/school-student/ShellClock';
import DashboardSidebar, { type SidebarNavItem } from '@/components/school-student/DashboardSidebar';
import '@/styles/schoolTheme.css';
import { useAuthStore, isMbaStudentRole } from '@/store/AuthStore';
import { useMbaDashboard, useMbaProfile, mbaErrorMessage } from '@/api/mba';
import type { MbaShellContext } from '@/lib/mbaShellContext';
import { StateBlock } from '@/components/mba/ui';

/**
 * The MBA student's app shell — the school-student shell, re-used.
 *
 * Same reasoning as SchoolStudentLayout: this replaces the site layout rather
 * than hiding bits of it, so the routes sit outside RevampLayout in AppRoutes.
 *
 * The one piece of state the shell owns is the onboarding answers
 * (GET /mba/me/profile). A 404 there means "not onboarded", and every page
 * except onboarding itself is held behind it.
 */

const NAV_ITEMS: SidebarNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'navHome', to: '/mba/dashboard' },
  { key: 'practice', label: 'Practice', icon: 'quizClipboard', to: '/mba/practice' },
  {
    key: 'mocks',
    label: 'Mock Tests',
    icon: 'bookingCalendar',
    to: '/mba/mocks',
    owns: ['/mba/results/', '/mba/mocks/'],
  },
  { key: 'mistakes', label: 'Mistakes', icon: 'levelShield', to: '/mba/mistakes' },
  { key: 'daily', label: 'Daily Challenge', icon: 'flameStreak', to: '/mba/daily' },
  { key: 'colleges', label: 'Colleges', icon: 'badgeExplorer', to: '/mba/colleges' },
  { key: 'shortlist', label: 'My Shortlist', icon: 'completedCheck', to: '/mba/shortlist' },
];

const PINNED: SidebarNavItem[] = [
  { key: 'profile', label: 'Profile', icon: 'navProfile', to: '/mba/profile' },
];

/** Routes that take the whole screen: no rail, no header. */
const isFocusRoute = (pathname: string) =>
  pathname.startsWith('/mba/exam/') || pathname === '/mba/onboarding';

function DeferredSkeleton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);
  if (!show) return null;
  return (
    <div className="mx-auto max-w-[1240px] space-y-4" aria-busy>
      <div className="h-[180px] animate-pulse rounded-[24px] bg-[#EDEFF6]" />
      <div className="h-[120px] animate-pulse rounded-[16px] bg-[#F1F3F8]" />
    </div>
  );
}

const firstNameOf = (name: string | null | undefined) => {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
};

export default function MbaStudentLayout() {
  const { role, isAuthenticated, user, userId, logout } = useAuthStore();
  const location = useLocation();
  const allowed = isAuthenticated && isMbaStudentRole(role);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const profileQuery = useMbaProfile(allowed);
  const profile = profileQuery.data ?? null;
  const focus = isFocusRoute(location.pathname);
  // The streak chip in the header. Only once onboarded — the dashboard needs a
  // profile to mean anything — and never on the exam screen.
  const dashboard = useMbaDashboard(allowed && !!profile && !focus);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // After every hook, so hook order never changes between renders.
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!allowed) return <Navigate to="/" replace />;

  const onOnboarding = location.pathname === '/mba/onboarding';
  if (profileQuery.isSuccess && !profile && !onOnboarding) {
    return <Navigate to="/mba/onboarding" replace />;
  }

  const firstName = firstNameOf(user?.firstName);
  const context: MbaShellContext = { profile, firstName, phone: userId };

  const body = profileQuery.isPending ? (
    <DeferredSkeleton />
  ) : profileQuery.isError ? (
    <StateBlock
      tone="error"
      title="We couldn't load your MBA profile"
      detail={mbaErrorMessage(profileQuery.error)}
      action={{ label: 'Try again', onClick: () => void profileQuery.refetch() }}
    />
  ) : (
    <Suspense fallback={<DeferredSkeleton />}>
      <div key={location.pathname} className="ss-page">
        <Outlet context={context} />
      </div>
    </Suspense>
  );

  if (focus) {
    return (
      <div className="school-shell min-h-screen bg-[var(--surfaces-page)]">
        <main className="min-w-0">{body}</main>
      </div>
    );
  }

  const rail = (
    <DashboardSidebar
      items={NAV_ITEMS}
      pinnedItems={PINNED}
      subtitle="CAT preparation"
      tagline="One focused hour beats three distracted ones."
      onNavigate={() => setDrawerOpen(false)}
      onClose={isDrawerOpen ? () => setDrawerOpen(false) : undefined}
    />
  );

  const streak = dashboard.data?.streak.current;

  return (
    <div className="school-shell flex min-h-screen bg-[var(--surfaces-page)]">
      <div className="sticky top-0 hidden h-screen lg:block">{rail}</div>

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
        <header className="sticky top-0 z-40 flex min-w-0 items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="ss-surface shrink-0 cursor-pointer p-2 text-[var(--neutral-900)] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <ShellClock />

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            {typeof streak === 'number' && (
              <div className="ss-surface flex shrink-0 items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3" aria-label={`${streak} day streak`}>
                <Icon name="flameStreak" className="h-5 w-5" />
                <span className="font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)]">
                  <strong className="block text-[14px] font-bold text-[var(--neutral-900)]">
                    {streak}
                  </strong>
                  <span className="hidden sm:inline">Day Streak</span>
                </span>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Account menu"
                aria-expanded={isMenuOpen}
                className="ss-surface flex shrink-0 cursor-pointer items-center gap-1.5 px-1.5 py-1.5 sm:gap-2.5 sm:px-2 md:px-3 md:py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-purple-50)]">
                  <Icon name="studentAvatar" className="h-8 w-8" />
                </span>
                <span className="hidden text-left font-[Poppins] text-[11px] leading-tight text-[var(--neutral-500)] sm:block">
                  <strong className="block text-[13px] font-bold text-[var(--neutral-900)]">
                    Hi{firstName ? `, ${firstName}` : ''}!
                  </strong>
                  CAT aspirant
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[var(--neutral-500)] sm:block" />
              </button>

              {isMenuOpen && (
                <div className="ss-surface absolute right-0 z-50 mt-2 w-44 overflow-hidden py-1">
                  <Link
                    to="/mba/profile"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 font-[Poppins] text-[13px] text-[var(--neutral-800)] hover:bg-[var(--brand-purple-50)]"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </Link>
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

        <main className="min-w-0 flex-1 px-4 pt-1 pb-16 md:px-8">{body}</main>
      </div>
    </div>
  );
}
