import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/components/school-student/assets';
import type { NeutralIcon, SchoolIcon } from '@/components/school-student/icons';

export type SidebarNavItem = {
  key: string;
  label: string;
  icon: SchoolIcon | NeutralIcon;
  to?: string;
  /**
   * Extra path prefixes this entry owns.
   *
   * NavLink's own matching is exact here, which left the rail with nothing
   * selected while a student was actually playing — /school-student/play IS
   * Quests & Games, and a section that de-highlights the moment you go into it
   * reads as having navigated away from the app.
   */
  owns?: string[];
};

/**
 * The programme's navigation rail — the ONLY navigation a school student sees.
 *
 * Only entries with a `to` are links; anything without one renders as a
 * disabled row marked "Soon", so the rail can grow one route at a time without
 * a release ever shipping a dead link. Every entry is built today — that
 * fallback stays for the next section that is not. Profile is pinned to the
 * foot, away from the programme's own sections.
 */
const NAV_ITEMS: SidebarNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'navHome', to: '/school-student/dashboard' },
  // ProBuddies gets its own page INSIDE this shell rather than linking to
  // /pro-buddies: that route lives in the site layout, which carries a header,
  // breadcrumbs and a footer a school student never sees — and which redirects
  // this role away anyway.
  { key: 'probuddies', label: 'ProBuddies', icon: 'navProfile', to: '/school-student/probuddies', owns: ['/school-student/probuddies/'] },
  { key: 'quests', label: 'Quests & Games', icon: 'gamesController', to: '/school-student/games', owns: ['/school-student/play'] },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'trophyLeaderboard', to: '/school-student/leaderboard' },
];

const SCHOOL_PINNED: SidebarNavItem[] = [
  { key: 'profile', label: 'Profile', icon: 'navProfile', to: '/school-student/profile' },
];

const SCHOOL_TAGLINE = 'Small steps today, big success tomorrow!';

/**
 * The rail is shared with the MBA shell, which passes its own `items`,
 * `pinnedItems` and `tagline`. Every one defaults to the school programme's,
 * so the school layout's call is unchanged. The daily-goal card renders only
 * when both goal numbers are given.
 */
export default function DashboardSidebar({
  dailyGoalDone,
  dailyGoalTarget,
  onNavigate,
  onClose,
  items = NAV_ITEMS,
  pinnedItems = SCHOOL_PINNED,
  tagline = SCHOOL_TAGLINE,
  subtitle = 'Your Personal Admission Expert',
}: {
  dailyGoalDone?: number;
  dailyGoalTarget?: number;
  onNavigate?: () => void;
  onClose?: () => void;
  items?: SidebarNavItem[];
  pinnedItems?: SidebarNavItem[];
  tagline?: string | null;
  subtitle?: string;
}) {
  const { pathname } = useLocation();
  const showGoal = dailyGoalDone !== undefined && dailyGoalTarget !== undefined;
  const safeTarget = Math.max(1, dailyGoalTarget ?? 1);
  const displayedDone = Math.min(Math.max(0, dailyGoalDone ?? 0), safeTarget);
  const goalMet = displayedDone >= safeTarget;

  const row = (
    { key, label, icon, to, owns }: SidebarNavItem,
    { pinned = false }: { pinned?: boolean } = {},
  ) => {
    const glyph = <Icon name={icon} className="h-[20px] w-[20px] shrink-0" />;
    // A section stays lit while you are anywhere inside it, including its
    // sub-routes: playing a game is still Quests & Games.
    const ownsPath = (owns ?? []).some((prefix) => pathname.startsWith(prefix));
    return (
      <li key={key}>
        {to ? (
          <NavLink
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 font-[Poppins] text-[14px] font-semibold ${
                isActive || ownsPath ? 'text-white' : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive || ownsPath
                ? { background: 'var(--vivid-purple)', boxShadow: '0 10px 22px -10px rgba(122,90,245,0.95)' }
                : { transition: 'background var(--motion-fast) var(--motion-ease)' }
            }
          >
            {glyph}
            {label}
          </NavLink>
        ) : (
          <span
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 font-[Poppins] text-[14px] font-semibold text-white/35 ${
              pinned ? '' : ''
            }`}
          >
            <span className="opacity-50">{glyph}</span>
            <span className="flex-1">{label}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
              Soon
            </span>
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="relative flex h-full w-[248px] shrink-0 flex-col overflow-hidden text-white">
      {/* Depth, not a flat slab: a brand-purple bloom over the rail gradient.
          Pure CSS, so it costs nothing to paint and nothing in the bundle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 55% at 0% 0%, rgba(139,108,248,0.55) 0%, rgba(139,108,248,0) 62%), linear-gradient(180deg, var(--rail-top) 0%, var(--rail-mid) 48%, var(--rail-bottom) 100%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-2 px-5 pt-5 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="font-[Poppins] text-[15px] leading-tight font-bold">ProCounsel</p>
            <p className="font-[Poppins] text-[10px] leading-tight text-white/45">
              {subtitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer rounded-lg px-2 py-1 text-[18px] text-white/60 hover:bg-white/10 lg:hidden"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-1">{items.map((item) => row(item))}</ul>
      </nav>

      <div className="relative flex flex-col gap-3 p-3">
        {/* Today's goal — one activity a day, shown as a count. */}
        {/*
         * Completed state: a green EDGE, not a green fill.
         *
         * Filling the whole card with saturated green and keeping the white
         * text on top left the label, the count and the bar all fighting the
         * background — the one state a student most wants to read became the
         * hardest to. The card keeps the rail's dark surface and signals
         * completion with a green border, a tick and a green count instead.
         */}
        {showGoal && (
        <div
          className="rounded-2xl border p-4"
          style={{
            background: goalMet ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.07)',
            borderColor: goalMet ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.12)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]" aria-hidden>
              {goalMet ? '✅' : '🎯'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-[Poppins] text-[13px] font-bold">Daily Goal</p>
              <p className="font-[Poppins] text-[11px] text-white/60">
                {goalMet ? 'Done for today — resets tomorrow' : 'Complete 1 activity'}
              </p>
            </div>
            <span
              className="shrink-0 font-[Poppins] text-[15px] font-extrabold"
              style={{ color: goalMet ? '#4ADE80' : '#FFFFFF' }}
            >
              {displayedDone} / {safeTarget}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(displayedDone / safeTarget) * 100}%`,
                background: 'linear-gradient(90deg,#4ADE80 0%,#22C55E 100%)',
                transition: 'width var(--motion-slow) var(--motion-ease)',
              }}
            />
          </div>
        </div>
        )}

        <ul className="flex flex-col gap-1 border-t border-white/10 pt-3">
          {pinnedItems.map((item) => row(item, { pinned: true }))}
        </ul>

        {tagline && (
          <p className="px-2 pb-1 text-center font-[Poppins] text-[11px] leading-relaxed text-white/35">
            &ldquo;{tagline}&rdquo; <span aria-hidden>🌟</span>
          </p>
        )}
      </div>
    </div>
  );
}
