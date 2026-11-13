import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus, ExternalLink, Trophy, Users } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton } from '@/components/mba/ui';
import { PostForm, ThreadList } from '@/components/mba/Doubts';
import { formatPercent } from '@/components/mba/format';
import { mbaErrorMessage } from '@/api/mba';
import { downloadIcs } from '@/lib/mbaPlanner';
import {
  buildEventIcs,
  useGroupBoard,
  useGroupPost,
  useGroupPosts,
  useGroups,
  useJoinGroup,
  useMbaEvents,
  useMyDoubts,
  type GroupInfo,
  type MbaEvent,
} from '@/api/mbaCommunity';

type Tab = 'doubts' | 'group' | 'live';
const TABS: { id: Tab; label: string }[] = [
  { id: 'doubts', label: 'My doubts' },
  { id: 'group', label: 'Study group' },
  { id: 'live', label: 'Doubt hours & webinars' },
];

const chip = (active: boolean) =>
  ({
    borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
    background: active ? 'var(--brand-purple-500)' : '#fff',
    color: active ? '#fff' : 'var(--neutral-600)',
  }) as const;

const errorLine = (err: unknown, fallback: string) => (
  <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
    {mbaErrorMessage(err, fallback)}
  </p>
);

// ── My doubts ────────────────────────────────────────────────────────────────
function DoubtsTab() {
  const mine = useMyDoubts();
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4">
        <p className="font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">How to ask a doubt</p>
        <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          Answer a question in <Link to="/mba/practice" className="font-semibold text-[var(--brand-purple-700)]">Practice</Link>,{' '}
          <Link to="/mba/mistakes" className="font-semibold text-[var(--brand-purple-700)]">Mistakes</Link> or the daily challenge, or open a
          submitted mock&rsquo;s review, then tap <strong>Ask a doubt</strong> under the solution. Other students can reply; our faculty answer
          anything still open after a day, marked <strong>Verified</strong>.
        </p>
      </section>
      <section aria-labelledby="my-doubts-heading" className="space-y-3">
        <h2 id="my-doubts-heading" className="ss-display text-[16px] text-[var(--ink)]">
          Your doubts and posts
        </h2>
        {mine.isPending ? (
          <Skeleton rows={2} />
        ) : mine.isError ? (
          errorLine(mine.error, "Couldn't load your doubts.")
        ) : (
          <ThreadList threads={mine.data.threads} emptyText="You haven't asked anything yet." />
        )}
      </section>
    </div>
  );
}

// ── Study group ──────────────────────────────────────────────────────────────
function GroupPicker({ groups, current, suggestedId, onDone }: { groups: GroupInfo[]; current: GroupInfo | null; suggestedId: string | null; onDone?: () => void }) {
  const join = useJoinGroup();
  const [choice, setChoice] = useState(current?.id ?? suggestedId ?? groups[0]?.id ?? '');
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (choice) join.mutate(choice, { onSuccess: () => onDone?.() });
      }}
    >
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        Exam and year
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="mt-1.5 block w-[220px] max-w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[14px] font-normal text-[var(--ink)]"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label} ({g.members} {g.members === 1 ? 'member' : 'members'})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!choice || join.isPending || choice === current?.id}
        className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {join.isPending ? 'Joining…' : current ? 'Switch group' : 'Join group'}
      </button>
      {join.isError && <div className="w-full">{errorLine(join.error, 'Could not join the group.')}</div>}
    </form>
  );
}

function GroupLeaderboard({ groupId }: { groupId: string }) {
  const board = useGroupBoard(groupId);
  const pct = (v: number) => formatPercent(v * 100);
  return (
    <section className="ss-panel space-y-3 p-4 md:p-5" aria-labelledby="group-board-heading">
      <h2 id="group-board-heading" className="ss-display flex items-center gap-2 text-[16px] text-[var(--ink)]">
        <Trophy className="h-5 w-5 text-[var(--gold-500)]" aria-hidden /> This week in your group
      </h2>
      {board.isPending ? (
        <div className="h-[100px] animate-pulse rounded-[16px] bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : board.isError ? (
        errorLine(board.error, "Couldn't load the group leaderboard.")
      ) : (
        <>
          {!board.data.optedIn && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">
              You&rsquo;re not on the leaderboard. It&rsquo;s optional —{' '}
              <Link to="/mba/daily" className="font-semibold text-[var(--brand-purple-700)]">join it on the Daily Challenge page</Link>.
            </p>
          )}
          {board.data.entries.length === 0 ? (
            <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
              Nobody from your group is on the board this week yet. Take today&rsquo;s challenge to start.
            </p>
          ) : (
            <ol className="space-y-1">
              {board.data.entries.map((e) => (
                <li
                  key={`${e.rank}-${e.displayName}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: e.isYou ? 'var(--brand-purple-50)' : undefined }}
                  aria-current={e.isYou || undefined}
                >
                  <span className="ss-data w-7 shrink-0 text-center text-[14px] text-[var(--neutral-500)]">{e.rank}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
                      {e.displayName}
                      {e.isYou ? ' (you)' : ''}
                    </span>
                    <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{pct(e.accuracy)} accuracy</span>
                  </span>
                  <span className="ss-data shrink-0 text-[15px] text-[var(--ink)]">{e.daysActive}/7 days</span>
                </li>
              ))}
            </ol>
          )}
          <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{board.data.rule}</p>
        </>
      )}
    </section>
  );
}

function GroupBoardPosts({ groupId }: { groupId: string }) {
  const posts = useGroupPosts(groupId);
  const post = useGroupPost(groupId);
  return (
    <section className="space-y-3" aria-labelledby="group-posts-heading">
      <h2 id="group-posts-heading" className="ss-display text-[16px] text-[var(--ink)]">
        Group discussion
      </h2>
      <div className="ss-panel p-4">
        <PostForm
          label="Start a discussion"
          placeholder="Share a strategy, ask how others plan their mocks, or find a revision partner for a topic…"
          submitLabel="Post"
          pending={post.isPending}
          error={post.error}
          onSubmit={(text, done) => post.mutate(text, { onSuccess: done })}
        />
      </div>
      {posts.isPending ? (
        <Skeleton rows={2} />
      ) : posts.isError ? (
        errorLine(posts.error, "Couldn't load the discussion.")
      ) : (
        <ThreadList threads={posts.data.threads} emptyText="No posts yet. Say hello to your group." />
      )}
    </section>
  );
}

function GroupTab() {
  const groups = useGroups();
  const leave = useJoinGroup();
  const [switching, setSwitching] = useState(false);

  if (groups.isPending) return <Skeleton rows={2} />;
  if (groups.isError) return errorLine(groups.error, "Couldn't load study groups.");
  const { mine, suggestedId } = groups.data;

  if (!mine)
    return (
      <section className="ss-panel space-y-3 p-4 md:p-5" aria-labelledby="join-heading">
        <h2 id="join-heading" className="ss-display flex items-center gap-2 text-[17px] text-[var(--ink)]">
          <Users className="h-5 w-5 text-[var(--brand-purple-500)]" aria-hidden /> Join a study group
        </h2>
        <p className="font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          Prepare alongside students taking the same exam in the same year: a weekly group leaderboard (only for those who opted in) and a
          discussion board. No chat, no phone numbers — just your display name.
        </p>
        <GroupPicker groups={groups.data.groups} current={null} suggestedId={suggestedId} />
      </section>
    );

  return (
    <div className="space-y-4">
      <section className="ss-panel flex flex-wrap items-center gap-3 p-4 md:p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-purple-50)]">
          <Users className="h-5 w-5 text-[var(--brand-purple-700)]" aria-hidden />
        </span>
        <div className="mr-auto">
          <p className="ss-display text-[17px] text-[var(--ink)]">{mine.label}</p>
          <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {mine.members} {mine.members === 1 ? 'member' : 'members'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSwitching((v) => !v)}
          className="cursor-pointer font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]"
        >
          {switching ? 'Cancel' : 'Switch group'}
        </button>
        <button
          type="button"
          disabled={leave.isPending}
          onClick={() => leave.mutate(null)}
          className="cursor-pointer font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]"
        >
          Leave
        </button>
        {switching && (
          <div className="w-full">
            <GroupPicker groups={groups.data.groups} current={mine} suggestedId={suggestedId} onDone={() => setSwitching(false)} />
          </div>
        )}
        {leave.isError && <div className="w-full">{errorLine(leave.error, 'Could not leave the group.')}</div>}
      </section>
      <GroupLeaderboard groupId={mine.id} />
      <GroupBoardPosts groupId={mine.id} />
    </div>
  );
}

// ── Doubt hours and webinars ─────────────────────────────────────────────────
const timeRange = (e: MbaEvent) => {
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  const day = start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const t = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${t(start)} – ${t(end)}`;
};

function EventCard({ event }: { event: MbaEvent }) {
  const cancelled = event.status === 'cancelled';
  const now = Date.now();
  const live = !cancelled && new Date(event.startsAt).getTime() <= now && now <= new Date(event.endsAt).getTime();
  const ended = new Date(event.endsAt).getTime() < now;
  return (
    <li className="ss-panel space-y-2 p-4" style={{ opacity: cancelled || ended ? 0.7 : 1 }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--brand-purple-50)] px-2 py-0.5 font-[Poppins] text-[11px] font-semibold text-[var(--brand-purple-700)]">
          {event.kind === 'doubt_hour' ? 'Doubt hour' : 'Webinar'}
        </span>
        {live && (
          <span className="rounded-full bg-[var(--green-50)] px-2 py-0.5 font-[Poppins] text-[11px] font-semibold text-[var(--green-600)]">Live now</span>
        )}
        {cancelled && (
          <span className="rounded-full bg-[var(--red-100)] px-2 py-0.5 font-[Poppins] text-[11px] font-semibold text-[var(--red-500)]">Cancelled</span>
        )}
        {ended && !cancelled && <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">Ended</span>}
      </div>
      <p className={`ss-display text-[16px] text-[var(--ink)] ${cancelled ? 'line-through' : ''}`}>{event.title}</p>
      <p className="font-[Poppins] text-[13px] text-[var(--neutral-600)]">
        {timeRange(event)}
        {event.host ? ` · with ${event.host}` : ''}
      </p>
      {event.description && <p className="whitespace-pre-wrap font-[Poppins] text-[13px] text-[var(--neutral-600)]">{event.description}</p>}
      {!cancelled && !ended && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 font-[Poppins] text-[12px] font-semibold"
            >
              Join <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={() => downloadIcs(buildEventIcs(event), `procounsel-${event.kind}-${event.startsAt.slice(0, 10)}.ics`)}
            className="inline-flex cursor-pointer items-center gap-1.5 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden /> Add to calendar
          </button>
        </div>
      )}
    </li>
  );
}

function LiveTab() {
  const events = useMbaEvents();
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4">
        <p className="font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">Weekly quiz</p>
        <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          Our weekly quiz is the daily challenge: a few fresh questions every day, and the weekly leaderboard ranks showing up and improving.
        </p>
        <Link to="/mba/daily" className="btn-primary mt-3 inline-block px-4 py-2 font-[Poppins] text-[12px] font-semibold">
          Take today&rsquo;s challenge
        </Link>
      </section>
      <section aria-labelledby="events-heading" className="space-y-3">
        <h2 id="events-heading" className="ss-display text-[16px] text-[var(--ink)]">
          Upcoming doubt hours and webinars
        </h2>
        {events.isPending ? (
          <Skeleton rows={2} />
        ) : events.isError ? (
          errorLine(events.error, "Couldn't load sessions.")
        ) : events.data.events.length === 0 ? (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
            Nothing scheduled right now. New sessions show up here — and you can always ask a doubt on any question you&rsquo;ve answered.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.data.events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </ul>
        )}
        <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">Times are shown in your device&rsquo;s time zone.</p>
      </section>
    </div>
  );
}

/** /mba/community — the student's doubts, their study group, and live doubt hours / webinars. */
export default function MbaCommunity() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.some((t) => t.id === params.get('tab')) ? (params.get('tab') as Tab) : 'doubts';

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <SkyBanner
        eyebrow="Community"
        title="Doubts, study groups and live sessions"
        lead="Ask about any question you've answered, prepare with students taking the same exam, and join faculty doubt hours."
      />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Community sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'doubts' ? {} : { tab: t.id }, { replace: true })}
            className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
            style={chip(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'doubts' ? <DoubtsTab /> : tab === 'group' ? <GroupTab /> : <LiveTab />}
      </div>
    </div>
  );
}
