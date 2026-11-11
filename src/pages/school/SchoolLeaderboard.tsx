import { useMemo, useState } from 'react';
import PageSEO from '@/components/SEO/PageSEO';
import ErrorState from '@/components/common/ErrorState';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Icon } from '@/components/school-student/assets';
import { useSchoolShell } from '@/lib/schoolShellContext';
import { useAuthStore } from '@/store/AuthStore';
import { displayName, initials, useLeaderboard, type Ranked, type Scope } from '@/lib/useLeaderboard';

/**
 * The leaderboard.
 *
 * Built from `getAllSchoolStudents`, which is the only endpoint that returns
 * other students' `totalPoints`. Two rules it holds to:
 *
 *   1. **Nobody is invented and nobody is padded.** While the programme is new
 *      most students sit on zero. The board says that plainly rather than
 *      hiding them or seeding fake scores, because a leaderboard that lies is
 *      worse than an empty one.
 *   2. **You are always findable.** If the signed-in student is below the fold
 *      their row is pinned under the list, so the page always answers "where am
 *      I" without scrolling.
 */

const MEDAL = ['#F59E0B', '#94A3B8', '#B45309'];
const PODIUM_HEIGHT = ['h-[104px]', 'h-[78px]', 'h-[62px]'];
/** Second, first, third — so the winner stands in the middle. */
const PODIUM_ORDER = [1, 0, 2];

const Avatar = ({ student, size = 40 }: { student: Ranked; size?: number }) => (
  <span
    className="ss-data flex shrink-0 items-center justify-center rounded-full text-[13px] text-white"
    style={{
      width: size,
      height: size,
      background: student.isYou
        ? 'linear-gradient(135deg,#F59E0B 0%,#EA580C 100%)'
        : 'linear-gradient(135deg,#6B4BD6 0%,#2E1C7A 100%)',
    }}
    aria-hidden
  >
    {initials(student)}
  </span>
);

const Row = ({ student }: { student: Ranked }) => (
  <li
    className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3"
    style={
      student.isYou
        ? { borderColor: '#FBBF24', background: '#FFFBEB', boxShadow: '0 0 0 3px rgba(251,191,36,0.16)' }
        : { borderColor: 'var(--card-border)', background: '#FFFFFF' }
    }
  >
    <span
      className="ss-data w-8 shrink-0 text-center text-[15px]"
      style={{ color: student.rank <= 3 ? MEDAL[student.rank - 1] : 'var(--neutral-400)' }}
    >
      {student.rank}
    </span>
    <Avatar student={student} />
    <span className="min-w-0 flex-1">
      <span className="flex min-w-0 items-baseline font-[Poppins] text-[13.5px] font-semibold text-[var(--ink)]">
        <span className="truncate">{displayName(student)}</span>
        {student.isYou && <span className="ss-eyebrow ml-2 shrink-0 text-[#B45309]">You</span>}
      </span>
      <span className="ss-eyebrow block truncate text-[var(--neutral-400)]">
        {[student.className ? `Class ${student.className}` : null, student.schoolName]
          .filter(Boolean)
          .join(' · ') || 'ProCounsel'}
      </span>
    </span>
    <span className="shrink-0 text-right">
      <span className="ss-data block text-[14px] text-[var(--ink)]">
        {(student.totalPoints ?? 0).toLocaleString('en-IN')}
      </span>
      <span className="ss-eyebrow block text-[var(--neutral-400)]">pts</span>
    </span>
    {student.currentStreak > 0 && (
      <span className="ml-1 hidden shrink-0 items-center gap-1 sm:flex">
        <Icon name="flameStreak" className="h-4 w-4" />
        <span className="ss-data text-[12px] text-[#B45309]">{student.currentStreak}</span>
      </span>
    )}
  </li>
);

export default function SchoolLeaderboard() {
  const { schoolStudent, userId } = useAuthStore();
  const { record } = useSchoolShell();
  const you = record?.schoolStudentId ?? schoolStudent?.phoneNumber ?? userId ?? null;

  const board = useLeaderboard(you);
  const [scope, setScope] = useState<Scope>('all');

  const ranked = useMemo(() => board.rank(scope), [board, scope]);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const yours = ranked.find((student) => student.isYou) ?? null;
  const yourVisible = Boolean(yours && ranked.indexOf(yours) < 23);
  const everyoneOnZero = ranked.length > 0 && ranked.every((s) => (s.totalPoints ?? 0) === 0);

  const scopes: { key: Scope; label: string }[] = [
    { key: 'all', label: 'Everyone' },
    { key: 'school', label: 'My school' },
    { key: 'class', label: 'My class' },
  ];

  return (
    <>
      <PageSEO title="Leaderboard" description="How your points compare." noIndex />

      <div className="mx-auto max-w-[1240px] space-y-6">
        <SkyBanner
          eyebrow="The whole mountain"
          title="Leaderboard"
          lead="Every student on the programme, ranked by points. Equal scores share a place."
          aside={
            yours && (
              <div
                className="rounded-2xl border border-white/25 px-4 py-3 backdrop-blur-md"
                style={{ background: 'rgba(16, 9, 44, 0.72)' }}
              >
                <p className="ss-eyebrow text-white/55">Your place</p>
                <p className="ss-data mt-1 text-[24px] leading-none text-white">#{yours.rank}</p>
              </div>
            )
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {scopes.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setScope(option.key)}
              aria-pressed={scope === option.key}
              className="ss-eyebrow cursor-pointer rounded-full border px-3.5 py-2 transition-colors"
              style={
                scope === option.key
                  ? { background: 'var(--ink)', color: '#FFFFFF', borderColor: 'var(--ink)' }
                  : { background: '#FFFFFF', color: 'var(--neutral-500)', borderColor: 'var(--card-border)' }
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        {board.loading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="ss-panel h-[190px] animate-pulse bg-[#F7F8FC]" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="ss-panel h-[66px] animate-pulse bg-[#F7F8FC]" />
            ))}
          </div>
        ) : board.error ? (
          <ErrorState
            variant="inline"
            title="The leaderboard didn't load"
            message={board.error}
            onRetry={board.reload}
            showBack={false}
          />
        ) : ranked.length === 0 ? (
          <div className="ss-panel p-8 text-center">
            <p className="ss-display text-[18px] text-[var(--ink)]">Nobody here yet</p>
            <p className="mt-1.5 font-[Poppins] text-[12.5px] text-[var(--neutral-500)]">
              {scope === 'all'
                ? 'The board fills up as students join the programme.'
                : 'No one else from your ' + (scope === 'school' ? 'school' : 'class') + ' has joined yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* The podium. Only drawn when there is something to stand on — with
                everyone on zero it would award medals for nothing. */}
            {!everyoneOnZero && podium.length > 0 && (
              <section className="ss-panel overflow-hidden p-5 pb-0">
                <h2 className="ss-display text-[17px] text-[var(--ink)]">Top of the mountain</h2>
                <ol className="mt-5 flex items-end justify-center gap-3 sm:gap-6">
                  {PODIUM_ORDER.filter((i) => podium[i]).map((i) => {
                    const student = podium[i];
                    return (
                      <li key={student.schoolStudentId} className="flex w-[104px] flex-col items-center sm:w-[132px]">
                        <Avatar student={student} size={i === 0 ? 56 : 46} />
                        <p className="mt-2 max-w-full truncate text-center font-[Poppins] text-[12.5px] font-semibold text-[var(--ink)]">
                          {displayName(student)}
                        </p>
                        <p className="ss-data text-[12px]" style={{ color: MEDAL[i] }}>
                          {(student.totalPoints ?? 0).toLocaleString('en-IN')} pts
                        </p>
                        <div
                          className={`mt-2.5 flex w-full items-start justify-center rounded-t-[12px] pt-2 ${PODIUM_HEIGHT[i]}`}
                          style={{ background: `linear-gradient(180deg, ${MEDAL[i]} 0%, ${MEDAL[i]}22 100%)` }}
                        >
                          <span className="ss-data text-[20px] text-white">{student.rank}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {everyoneOnZero && (
              <div
                className="rounded-[14px] border px-4 py-3.5 font-[Poppins] text-[12.5px] leading-relaxed text-[#7A5A00]"
                style={{ background: 'var(--gradients-reward-card)', borderColor: 'var(--borders-gold-soft)' }}
              >
                Nobody has scored yet. The first points on the board are yours to take.
              </div>
            )}

            <section aria-label="Rankings">
              <ul className="space-y-2.5">
                {(everyoneOnZero ? ranked : rest).slice(0, 23).map((student) => (
                  <Row key={student.schoolStudentId} student={student} />
                ))}
              </ul>

              {/* Pinned so "where am I" never needs a scroll. */}
              {yours && !yourVisible && (
                <div className="mt-4">
                  <p className="ss-eyebrow mb-2 text-[var(--neutral-400)]">Your place</p>
                  <ul>
                    <Row student={yours} />
                  </ul>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
