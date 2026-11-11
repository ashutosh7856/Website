import { Link } from 'react-router-dom';
import { Icon } from '@/components/school-student/assets';
import { campProgressLabel, type ClimbView, type CampState } from '@/lib/mbaLevels';
import { formatDate } from './format';

/**
 * Road to IIM — the MBA dashboard's hero.
 *
 * The school dashboard's expedition, grown up: one ridge, climbed left to
 * right, seven camps on it, the summit at the top right. The gold rope is the
 * part already climbed and stops partway up the next leg by exactly the share
 * of the next camp's requirements that is done — so the drawing reports the
 * same numbers as the "Next camp" card, never a decorative estimate.
 *
 * Two drawings, not one scaled: seven markers on a 1200-wide ridge shrink to
 * specks on a phone, so the narrow scene is its own steeper geometry. Which one
 * shows is decided by the hero's own width (a container query), not the
 * viewport's, because the shell's rail eats a different share at each size.
 *
 * The scene is `role="img"` with a one-sentence summary; the full route, camp
 * by camp, is the list beside the hero (CampRoute), which is the text version.
 */

type Pt = readonly [number, number];

/** Catmull-Rom through the points, as cubic segments — one string per leg. */
function legs(points: readonly Pt[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push(
      `M${p1[0]} ${p1[1]} C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`,
    );
  }
  return out;
}

function smooth(points: readonly Pt[]): string {
  return legs(points)
    .map((d, i) => (i === 0 ? d : d.replace(/^M[^C]+/, '')))
    .join(' ');
}

const closed = (points: readonly Pt[], h: number) =>
  `${smooth(points)} L${points[points.length - 1][0]} ${h + 20} L${points[0][0]} ${h + 20} Z`;

/** A soft, waving snow line, closed upward — clipped to the ridge it becomes the snowcap. */
function snowLine(y: number, from: number, to: number): string {
  const offsets = [6, -4, 8, -2, 10, -6, 4, -3, 9, 0, 7, -5, 5];
  const step = (to - from) / (offsets.length - 1);
  const pts = offsets.map((d, i) => [Math.round(from + i * step), Math.round(y + d)] as const);
  return `${smooth(pts)} L${to} -400 L${from} -400 Z`;
}

interface Geometry {
  w: number;
  h: number;
  /** Marker radius. */
  r: number;
  camps: readonly Pt[];
  near: readonly Pt[];
  mid: readonly Pt[];
  far: readonly Pt[];
  stars: readonly (readonly [number, number, number])[];
  /** Height of the snow line, in view-box units. */
  snow: number;
}

/** Desktop: sits beside the copy, summit top right. */
const WIDE: Geometry = {
  w: 760,
  h: 340,
  r: 15,
  camps: [
    [62, 298],
    [168, 272],
    [268, 248],
    [368, 214],
    [468, 180],
    [566, 134],
    [672, 62],
  ],
  near: [
    [-1100, 346], [-760, 334], [-420, 338], [-180, 326], [10, 312], [62, 290], [116, 286], [168, 264], [218, 262], [268, 240],
    [318, 232], [368, 206], [420, 200], [468, 172], [516, 160], [566, 126], [614, 112],
    [672, 52], [716, 86], [760, 128], [800, 150],
  ],
  mid: [
    [-1100, 318], [-860, 286], [-640, 306], [-420, 270], [-200, 296], [-40, 276], [70, 262], [170, 284], [280, 232], [390, 262], [500, 210], [610, 238],
    [700, 176], [800, 214],
  ],
  far: [
    [-1100, 262], [-900, 214], [-700, 244], [-480, 190], [-260, 236], [-80, 206], [90, 196], [200, 230], [330, 168], [450, 204], [560, 136], [640, 160],
    [720, 118], [800, 150],
  ],
  stars: [
    [60, 40, 1.3], [150, 82, 1], [240, 30, 1.5], [330, 70, 1.1], [420, 26, 1.2],
    [500, 64, 1], [610, 30, 1.4], [700, 20, 1.1], [120, 130, 0.9], [380, 120, 1],
    [-60, 30, 1.2], [-180, 90, 1], [-320, 50, 1.3], [-470, 110, 0.9], [-560, 24, 1.1],
  ],
  snow: 118,
};

/** Phone: steeper, so seven markers still fit at a legible size. */
const NARROW: Geometry = {
  w: 360,
  h: 230,
  r: 13,
  camps: [
    [26, 206],
    [76, 188],
    [124, 170],
    [174, 146],
    [222, 122],
    [268, 92],
    [322, 38],
  ],
  near: [
    [-700, 236], [-480, 226], [-260, 230], [-110, 222], [-4, 214], [26, 198], [52, 194], [76, 180], [100, 178], [124, 162],
    [150, 156], [174, 138], [198, 134], [222, 114], [246, 104], [268, 84], [294, 72],
    [322, 28], [346, 56], [380, 96],
  ],
  mid: [
    [-700, 214], [-540, 178], [-380, 204], [-220, 168], [-80, 196], [40, 176], [110, 196], [180, 158], [250, 178], [310, 128], [380, 150],
  ],
  far: [
    [-700, 176], [-560, 130], [-420, 160], [-260, 110], [-110, 150], [50, 120], [130, 150], [210, 96], [280, 120], [340, 76], [380, 96],
  ],
  stars: [
    [30, 26, 1.1], [90, 54, 0.9], [150, 20, 1.2], [210, 46, 1], [250, 16, 1.1], [120, 92, 0.8],
    [-60, 40, 1], [-150, 70, 1.1], [-240, 24, 0.9],
  ],
  snow: 66,
};

const GOLD = '#FBBF24';

function Marker({
  at,
  r,
  number,
  state,
  name,
  summit,
}: {
  at: Pt;
  r: number;
  number: number;
  state: CampState;
  name: string;
  summit: boolean;
}) {
  const reached = state === 'reached';
  const next = state === 'next';
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <title>{`Camp ${number}: ${name}${reached ? ' (reached)' : next ? ' (next)' : ''}`}</title>
      {summit && (
        // The summit flag. Planted only once the summit is reached; until then
        // it is an outline on the peak.
        <g transform={`translate(0 ${-r - 2})`}>
          <line x1="0" y1="0" x2="0" y2={-r * 1.9} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d={`M0 ${-r * 1.9} L${r * 1.35} ${-r * 1.55} L0 ${-r * 1.2} Z`}
            fill={reached ? '#F97316' : 'none'}
            stroke={reached ? '#F97316' : 'rgba(255,255,255,0.75)'}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>
      )}
      {next && <circle className="ss-beacon" r={r + 4} fill={GOLD} />}
      <circle r={r + 1.5} fill="#06102A" fillOpacity="0.5" />
      <circle
        r={r}
        fill={reached ? GOLD : next ? '#FFFFFF' : '#2B3D68'}
        stroke={reached ? '#FFFFFF' : next ? GOLD : '#7C8DB5'}
        strokeWidth={next ? 3.5 : 2}
      />
      <text
        textAnchor="middle"
        y={r * 0.34}
        fontSize={r * 0.95}
        fill={reached ? '#2A1400' : next ? '#0B1636' : '#C9D3EA'}
        style={{ fontFamily: 'var(--font-data)', fontWeight: 700 }}
      >
        {number}
      </text>
    </g>
  );
}

function Scene({
  g,
  climb,
  idPrefix,
  className,
  summary,
}: {
  g: Geometry;
  climb: ClimbView;
  idPrefix: string;
  className: string;
  summary: string;
}) {
  const ropeLegs = legs(g.camps);
  const legCount = ropeLegs.length;
  // How far along the rope, in legs: 2.4 means two legs done, 40% of the third.
  const climbed = climb.routeProgress * legCount;
  const id = (s: string) => `${idPrefix}-${s}`;
  const currentIdx = climb.current ? climb.current.number - 1 : -1;
  const here = currentIdx >= 0 ? g.camps[currentIdx] : null;

  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} preserveAspectRatio="xMaxYMax meet" role="img" aria-label={summary} className={className}>
      <defs>
        <linearGradient id={id('far')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3F5C9C" />
          <stop offset="100%" stopColor="#2C4682" />
        </linearGradient>
        <linearGradient id={id('mid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A447F" />
          <stop offset="100%" stopColor="#1B2F60" />
        </linearGradient>
        <linearGradient id={id('near')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F3466" />
          <stop offset="70%" stopColor="#14244C" />
          <stop offset="100%" stopColor="#0C1734" />
        </linearGradient>
        <linearGradient id={id('light')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
        </linearGradient>
        <clipPath id={id('clip')}>
          <path d={closed(g.near, g.h)} />
        </clipPath>
      </defs>

      <g aria-hidden>
        <g fill="#FFFFFF">
          {g.stars.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity="0.7" />
          ))}
        </g>

        <path d={closed(g.far, g.h)} fill={`url(#${id('far')})`} opacity="0.6" />
        <path d={closed(g.mid, g.h)} fill={`url(#${id('mid')})`} opacity="0.9" />
        <path d={closed(g.near, g.h)} fill={`url(#${id('near')})`} />
        <g clipPath={`url(#${id('clip')})`}>
          <rect x={g.near[0][0]} y="0" width={g.w - g.near[0][0] + 80} height={g.h + 20} fill={`url(#${id('light')})`} />
          {/* Snow only above the high camps: the top of the climb is where the
              air changes, which is the point of the drawing. */}
          <path d={snowLine(g.snow, g.w * 0.5, g.w + 40)} fill="#F4F7FF" opacity="0.92" />
        </g>
        <path d={smooth(g.near)} fill="none" stroke="#DCE6FF" strokeOpacity="0.35" strokeWidth="1.4" />

        {/* The rope: the full route dashed, the climbed part solid gold. */}
        <path
          d={smooth(g.camps)}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.55"
          strokeWidth="2.4"
          strokeDasharray="2 6"
          strokeLinecap="round"
        />
        {ropeLegs.map((d, i) => {
          const share = Math.max(0, Math.min(1, climbed - i));
          if (share <= 0) return null;
          const to = 100 - share * 100;
          return (
            <path
              key={d}
              className="ss-trail-progress"
              d={d}
              pathLength={100}
              fill="none"
              stroke={GOLD}
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeDasharray="100"
              style={
                {
                  '--dash-from': '100',
                  '--dash-to': String(to),
                  strokeDashoffset: to,
                  animationDelay: `${i * 160}ms`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {g.camps.map((pt, i) => (
          <Marker
            key={climb.camps[i].id}
            at={pt}
            r={g.r}
            number={climb.camps[i].number}
            state={climb.states[i]}
            name={climb.camps[i].name}
            summit={i === g.camps.length - 1}
          />
        ))}

        {/* "You are here", above the current camp. Omitted at the summit,
            where the planted flag already says it. */}
        {here && climb.next && (
          <g transform={`translate(${here[0]} ${here[1] - g.r - 8})`}>
            <path d="M0 0 L-5 -7 L5 -7 Z" fill="#FFFFFF" />
            <rect x={-g.r * 1.9} y={-7 - g.r * 1.45} width={g.r * 3.8} height={g.r * 1.45} rx={g.r * 0.72} fill="#FFFFFF" />
            <text
              textAnchor="middle"
              y={-7 - g.r * 0.45}
              fontSize={g.r * 0.78}
              fill="#0B1636"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
            >
              You
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

function Chip({ icon, children }: { icon: Parameters<typeof Icon>[0]['name']; children: React.ReactNode }) {
  return (
    <li
      className="flex items-center gap-2 rounded-full border border-white/20 py-1.5 pr-3.5 pl-2.5 backdrop-blur-md"
      style={{ background: 'rgba(6, 12, 34, 0.55)' }}
    >
      <Icon name={icon} className="h-4 w-4 shrink-0" />
      <span className="font-[Poppins] text-[12px] text-white/85">{children}</span>
    </li>
  );
}

export default function RoadToIimHero({
  climb,
  firstName,
  daysToExam,
  examDate,
  streakDays,
  targetPercentile,
}: {
  climb: ClimbView;
  firstName: string | null;
  daysToExam: number | null;
  examDate: string | null | undefined;
  streakDays: number;
  targetPercentile: number | null | undefined;
}) {
  const { current, next } = climb;
  const total = climb.camps.length;
  const summary = current
    ? next
      ? `Road to IIM: camp ${current.number} of ${total}, ${current.name}, reached. Next camp: ${next.name}, ${campProgressLabel(next)}.`
      : `Road to IIM: all ${total} camps reached, including the summit.`
    : `Road to IIM: no camps reached yet. First camp: ${next?.name}.`;

  const days = daysToExam === null ? null : Math.max(0, daysToExam);
  const examLabel = formatDate(examDate);

  return (
    <section
      aria-labelledby="road-heading"
      className="@container relative isolate overflow-hidden rounded-[24px]"
      style={{
        background:
          'radial-gradient(120% 90% at 85% 100%, #F2B37A 0%, rgba(242,179,122,0) 46%), linear-gradient(170deg, #070F2B 0%, #13265C 42%, #2D4F94 78%, #6C7FB8 100%)',
        boxShadow: '0 22px 50px -28px rgba(6, 12, 40, 0.85)',
      }}
    >
      {/* Wide: the range fills the whole band and the copy sits on its low,
          left-hand foothills, where the sky is darkest. Narrow: copy, then the drawing. */}
      <Scene
        g={WIDE}
        climb={climb}
        idPrefix="road-w"
        summary={summary}
        className="absolute inset-0 hidden h-full w-full @3xl:block"
      />
      <div className="relative @3xl:min-h-[380px]">
        <div className="relative z-10 p-5 sm:p-7 @3xl:max-w-[24rem]">
          <h1 id="road-heading" className="ss-display text-[30px] leading-[1.02] text-white sm:text-[38px]">
            Road to IIM
          </h1>
          <p className="mt-2 max-w-[22rem] font-[Poppins] text-[14px] leading-relaxed text-white/80">
            {firstName ? `Welcome back, ${firstName}. ` : 'Welcome back. '}
            {current
              ? next
                ? `You're at ${current.name}, camp ${current.number} of ${total}. Next up: ${next.name}.`
                : `Every camp is behind you. Keep your accuracy where it is.`
              : `Start at ${next?.name}.`}
          </p>

          {/* The countdown: the one number on the page that is not the
              student's to change, so it gets the instrument face. */}
          <div className="mt-5 flex items-end gap-3">
            {days === null ? (
              <Link
                to="/mba/profile"
                className="rounded-xl border border-white/25 px-3.5 py-2.5 font-[Poppins] text-[13px] font-semibold text-white hover:bg-white/10"
              >
                Add your CAT date to see the countdown
              </Link>
            ) : (
              <p className="text-white">
                <span className="ss-data block text-[44px] leading-none">{days}</span>
                <span className="mt-1.5 block font-[Poppins] text-[12px] text-white/75">
                  {days === 0 ? 'CAT is today' : `${days === 1 ? 'day' : 'days'} to CAT`}
                  {examLabel ? `, ${examLabel}` : ''}
                </span>
              </p>
            )}
          </div>

          <ul className="mt-5 flex flex-wrap gap-2">
            <Chip icon="flameStreak">
              {streakDays > 0 ? `${streakDays}-day streak` : 'No streak yet'}
            </Chip>
            {targetPercentile != null && <Chip icon="trophyLeaderboard">Target {targetPercentile} percentile</Chip>}
          </ul>
        </div>

        <div className="relative -mt-2 @3xl:hidden">
          <Scene g={NARROW} climb={climb} idPrefix="road-n" summary={summary} className="block h-auto max-h-[300px] w-full" />
        </div>
      </div>
    </section>
  );
}
