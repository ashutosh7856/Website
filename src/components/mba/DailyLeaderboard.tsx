import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { mbaErrorMessage } from '@/api/mba';
import {
  useDailyBoard,
  useLeaderboardPrefs,
  useSaveLeaderboardPrefs,
  useWeeklyBoard,
  type DailyEntry,
  type WeeklyEntry,
} from '@/api/mbaInsights';
import { formatPercent } from './format';

const pct = (v: number | null) => formatPercent(v === null ? null : v * 100);

const chip = (active: boolean) =>
  ({
    borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
    background: active ? 'var(--brand-purple-500)' : '#fff',
    color: active ? '#fff' : 'var(--neutral-600)',
  }) as const;

function NameForm({ initial, submitLabel, onSubmit, pending }: { initial: string; submitLabel: string; onSubmit: (name: string) => void; pending: boolean }) {
  const [name, setName] = useState(initial);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name.trim());
      }}
    >
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        Display name
        <input
          type="text"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 block w-[220px] max-w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2 font-[Poppins] text-[14px] font-normal text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending || name.trim().length < 2}
        className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function Row({ rank, name, isYou, detail, value }: { rank: number; name: string; isYou: boolean; detail: string; value: string }) {
  return (
    <li
      className="flex items-center gap-3 rounded-xl px-3 py-2"
      style={{ background: isYou ? 'var(--brand-purple-50)' : undefined }}
      aria-current={isYou || undefined}
    >
      <span className="ss-data w-7 shrink-0 text-center text-[14px] text-[var(--neutral-500)]">{rank}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
          {name}
          {isYou ? ' (you)' : ''}
        </span>
        <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{detail}</span>
      </span>
      <span className="ss-data shrink-0 text-[15px] text-[var(--ink)]">{value}</span>
    </li>
  );
}

const dailyRow = (e: DailyEntry) => (
  <Row key={`${e.rank}-${e.displayName}`} rank={e.rank} name={e.displayName} isYou={e.isYou} detail={`${e.correct}/${e.answered} correct`} value={pct(e.accuracy)} />
);
const weeklyRow = (e: WeeklyEntry) => (
  <Row
    key={`${e.rank}-${e.displayName}`}
    rank={e.rank}
    name={e.displayName}
    isYou={e.isYou}
    detail={`${pct(e.accuracy)} accuracy${e.improvement !== null ? ` · ${e.improvement >= 0 ? '+' : ''}${Math.round(e.improvement * 100)} pts vs last week` : ''}`}
    value={`${e.daysActive}/7 days`}
  />
);

/**
 * Daily challenge leaderboard — opt-in. Ranked by accuracy and participation,
 * never by volume. Only display names are shown.
 */
export default function DailyLeaderboard() {
  const prefs = useLeaderboardPrefs();
  const save = useSaveLeaderboardPrefs();
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [editing, setEditing] = useState(false);
  const daily = useDailyBoard();
  const weekly = useWeeklyBoard(view === 'weekly');
  const board = view === 'daily' ? daily : weekly;
  const optedIn = prefs.data?.optedIn ?? false;

  const entries = board.data?.entries ?? [];
  const you = board.data?.you ?? null;
  const youListed = entries.some((e) => e.isYou);

  return (
    <section className="ss-panel space-y-4 p-4 md:p-5" aria-labelledby="leaderboard-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="leaderboard-heading" className="ss-display mr-auto flex items-center gap-2 text-[17px] text-[var(--ink)]">
          <Trophy className="h-5 w-5 text-[var(--gold-500)]" aria-hidden /> Leaderboard
        </h2>
        {(['daily', 'weekly'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className="cursor-pointer rounded-full border px-3 py-1 font-[Poppins] text-[11px] font-semibold"
            style={chip(view === v)}
          >
            {v === 'daily' ? 'Today' : 'This week'}
          </button>
        ))}
      </div>

      {prefs.isPending ? null : prefs.isError ? (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {mbaErrorMessage(prefs.error)}
        </p>
      ) : !optedIn ? (
        <div className="rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4">
          <p className="font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">Join the leaderboard (optional)</p>
          <p className="mt-1 font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-600)]">
            Ranks students who opted in by accuracy on the day&rsquo;s challenge, then by how many of its questions they answered.
            Only your first answer to each question counts. The weekly view rewards showing up and improving. Others see only the
            display name you choose — never your phone number. You can leave any time.
          </p>
          <div className="mt-3">
            <NameForm
              initial={prefs.data.displayName}
              submitLabel="Join leaderboard"
              pending={save.isPending}
              onSubmit={(displayName) => save.mutate({ optedIn: true, displayName })}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          {editing ? (
            <NameForm
              initial={prefs.data.displayName}
              submitLabel="Save name"
              pending={save.isPending}
              onSubmit={(displayName) => save.mutate({ optedIn: true, displayName }, { onSuccess: () => setEditing(false) })}
            />
          ) : (
            <>
              <span>
                Showing as <strong className="text-[var(--ink)]">{prefs.data.displayName}</strong>
              </span>
              <button type="button" onClick={() => setEditing(true)} className="cursor-pointer font-semibold text-[var(--brand-purple-700)]">
                Edit name
              </button>
              <button
                type="button"
                onClick={() => save.mutate({ optedIn: false })}
                disabled={save.isPending}
                className="cursor-pointer font-semibold text-[var(--neutral-500)]"
              >
                Leave leaderboard
              </button>
            </>
          )}
        </div>
      )}
      {save.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {mbaErrorMessage(save.error, 'Could not save.')}
        </p>
      )}

      {board.isPending ? (
        <div className="h-[120px] animate-pulse rounded-[16px] bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : board.isError ? (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {mbaErrorMessage(board.error, "Couldn't load the leaderboard.")}
        </p>
      ) : entries.length === 0 ? (
        <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          {view === 'daily' ? 'Nobody on the board yet today.' : 'Nobody on the board this week yet.'}
          {optedIn ? ' Answer today’s questions to get on it.' : ''}
        </p>
      ) : (
        <>
          <ol className="space-y-1">
            {view === 'daily'
              ? (entries as DailyEntry[]).map(dailyRow)
              : (entries as WeeklyEntry[]).map(weeklyRow)}
          </ol>
          {you && !youListed && (
            <ol className="border-t border-[var(--borders-default)] pt-2">
              {view === 'daily' ? dailyRow(you as DailyEntry) : weeklyRow(you as WeeklyEntry)}
            </ol>
          )}
        </>
      )}
      {board.data && (
        <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
          {board.data.participants} taking part. {board.data.rule}
        </p>
      )}
    </section>
  );
}
