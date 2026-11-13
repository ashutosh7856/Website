import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { formatDate } from '@/components/mba/format';
import {
  SHORTLIST_STATUSES,
  mbaErrorMessage,
  useMbaShortlist,
  useRemoveShortlistItem,
  useSaveShortlistItem,
  type ShortlistItem,
  type ShortlistStatus,
} from '@/api/mba';
import { useMbaApplications, type Application, type DocumentsConfig } from '@/api/mbaApplications';
import ApplicationChecklist from '@/components/mba/ApplicationChecklist';
import ApplicationOutcome, { OutcomeFunnelCard } from '@/components/mba/ApplicationOutcome';
import CounsellorRequestPanel from '@/components/mba/CounsellorRequestPanel';

const STATUS_TONE: Record<ShortlistStatus, string> = {
  interested: '#64748B',
  shortlisted: '#6C4CF1',
  applied: '#2F43F2',
  interview: '#D97706',
  offer: '#059669',
  declined: '#DC2626',
};

const NOTES_MAX = 2000;

/** Whole days from today (local) to a YYYY-MM-DD date. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function DeadlineHint({ date }: { date: string | null }) {
  if (!date) return null;
  const d = daysUntil(date);
  const text = d < 0 ? `${Math.abs(d)} day${d === -1 ? '' : 's'} ago` : d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`;
  const tone = d < 0 ? 'var(--neutral-400)' : d <= 7 ? 'var(--red-500)' : 'var(--neutral-500)';
  return (
    <span className="font-[Poppins] text-[11.5px] font-semibold" style={{ color: tone }}>
      Deadline {formatDate(date)} · {text}
    </span>
  );
}

function ShortlistRow({ item, app, documents }: { item: ShortlistItem; app?: Application; documents?: DocumentsConfig }) {
  const save = useSaveShortlistItem();
  const remove = useRemoveShortlistItem();
  const [status, setStatus] = useState<ShortlistStatus>(item.status);
  const [deadline, setDeadline] = useState(item.deadline ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const dirty = status !== item.status || deadline !== (item.deadline ?? '') || notes !== (item.notes ?? '');

  // PUT is a full replace, so every field is always sent.
  const persist = (next: { status: ShortlistStatus; deadline: string; notes: string }) => {
    setError(null);
    setSaved(false);
    save.mutate(
      {
        slug: item.slug,
        status: next.status,
        deadline: next.deadline || null,
        notes: next.notes.trim() ? next.notes : null,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setError(mbaErrorMessage(err, 'Could not save.')),
      },
    );
  };

  const title = item.shortName ?? item.name ?? item.slug;

  return (
    <article className="ss-panel space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="ss-display text-[16px] text-[var(--ink)]">{title}</h3>
          {item.name && item.shortName && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">{item.name}</p>
          )}
          {!item.name && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">This institute is no longer listed.</p>
          )}
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-white"
          style={{ background: STATUS_TONE[item.status] }}
        >
          {SHORTLIST_STATUSES.find((s) => s.id === item.status)?.label}
        </span>
      </div>

      <DeadlineHint date={item.deadline} />

      {app && <ApplicationChecklist app={app} documents={documents} />}
      {app && <ApplicationOutcome app={app} />}

      <div className="grid gap-3 sm:grid-cols-[200px_180px_1fr]">
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Status
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as ShortlistStatus;
              setStatus(next);
              // A status change saves at once (with the deadline and notes as
              // they stand, since PUT replaces the whole entry).
              persist({ status: next, deadline, notes });
            }}
            className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]"
          >
            {SHORTLIST_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Application deadline
          <input
            type="date"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              setSaved(false);
            }}
            className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]"
          />
        </label>
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Notes
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value.slice(0, NOTES_MAX));
              setSaved(false);
            }}
            rows={2}
            maxLength={NOTES_MAX}
            placeholder="Documents pending, interview dates, fee instalments…"
            className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => persist({ status, deadline, notes })}
          disabled={!dirty || save.isPending}
          className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {saved && !dirty && <span className="font-[Poppins] text-[12px] text-[var(--green-600)]">Saved</span>}
        <span className="ml-auto font-[Poppins] text-[11px] text-[var(--neutral-400)]">
          Updated {formatDate(item.updatedAt)}
        </span>
        {confirming ? (
          <span className="flex items-center gap-2">
            <span className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">
              Remove {title}
              {app?.checklist.some((c) => c.documents?.length) ? ' and its uploaded files' : ''}?
            </span>
            <button
              type="button"
              onClick={() =>
                remove.mutate(item.slug, { onError: (err) => setError(mbaErrorMessage(err, 'Could not remove.')) })
              }
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-[var(--red-500)] px-3 py-1.5 font-[Poppins] text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {remove.isPending ? 'Removing…' : 'Remove'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-secondary cursor-pointer px-3 py-1.5 font-[Poppins] text-[12px] font-semibold"
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remove ${title} from shortlist`}
            className="cursor-pointer rounded-lg p-2 text-[var(--neutral-500)] hover:bg-red-50 hover:text-[var(--red-500)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

export default function MbaShortlist() {
  const { data, isPending, isError, error, refetch } = useMbaShortlist();
  // Checklist + official dates per institute; the shortlist still renders if this fails.
  const applications = useMbaApplications();
  const appBySlug = useMemo(
    () => new Map((applications.data?.items ?? []).map((a) => [a.slug, a] as const)),
    [applications.data],
  );
  const [filter, setFilter] = useState<ShortlistStatus | 'all'>('all');
  const items = useMemo(() => data?.items ?? [], [data]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(SHORTLIST_STATUSES.map((s) => [s.id, 0])) as Record<ShortlistStatus, number>;
    for (const i of items) c[i.status] += 1;
    return c;
  }, [items]);
  const shown = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Application tracker"
        title="My IIM shortlist"
        lead="Track every application from interest to offer: deadlines first, documents ticked off, a counsellor a tap away."
        aside={items.length ? <span className="font-[Poppins] text-[12px] text-white/70">{items.length} saved</span> : undefined}
      />

      {!isPending && !isError && <CounsellorRequestPanel institutes={items} />}

      {applications.data && <OutcomeFunnelCard funnel={applications.data.funnel} />}

      {items.length > 0 && (
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {(['all', ...SHORTLIST_STATUSES.map((s) => s.id)] as const).map((id) => {
            const active = filter === id;
            const label = id === 'all' ? 'All' : SHORTLIST_STATUSES.find((s) => s.id === id)!.label;
            const n = id === 'all' ? items.length : counts[id];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(id)}
                className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
                style={{
                  borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
                  background: active ? 'var(--brand-purple-500)' : '#fff',
                  color: active ? '#fff' : 'var(--neutral-600)',
                }}
              >
                {label} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </nav>
      )}

      {isPending ? (
        <Skeleton rows={3} />
      ) : isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load your shortlist"
          detail={mbaErrorMessage(error)}
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : items.length === 0 ? (
        <StateBlock
          tone="empty"
          title="Your shortlist is empty"
          detail="Add IIMs from the Colleges page, then track status, deadlines and notes here."
          action={{ label: 'Browse colleges', href: '/mba/colleges' }}
        />
      ) : shown.length === 0 ? (
        <StateBlock tone="empty" title="Nothing at this stage" detail="Pick another status to see those applications." />
      ) : (
        <div className="space-y-4">
          {shown.map((item) => (
            <ShortlistRow
              key={item.slug}
              item={item}
              app={appBySlug.get(item.slug)}
              documents={applications.data?.documents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
