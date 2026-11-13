import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import ShellPortal from '@/components/mba/ShellPortal';
import { mbaErrorMessage } from '@/api/mba';
import {
  useMarkNotificationsSeen,
  useMbaNotifications,
  type MbaNotification,
  type NotificationKind,
} from '@/api/mbaPlanner';
import { isAppPath } from '@/lib/mbaPlanner';

const KIND_ICON: Record<NotificationKind, string> = {
  plan_today: '🗓️',
  plan_overdue: '📋',
  mistakes_due: '🔁',
  resume_mock: '⏱️',
  cat_countdown: '🏔️',
  shortlist_deadline: '📌',
  new_mock: '🆕',
  counsellor_update: '🎧',
  doubt_reply: '💬',
  support_reply: '🛟',
  exam_update: '📣',
};

function relative(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.round((now - t) / 60_000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  if (diff < 24 * 60) return `${Math.round(diff / 60)} h ago`;
  const days = Math.round(diff / (24 * 60));
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function Item({ item, onOpen, onDismiss }: { item: MbaNotification; onOpen: () => void; onDismiss: () => void }) {
  const body = (
    <>
      <span className="text-[18px] leading-none" aria-hidden>
        {KIND_ICON[item.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
          {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand-purple-500)]" aria-label="New" />}
          {item.title}
        </span>
        <span className="mt-0.5 block font-[Poppins] text-[12px] leading-snug text-[var(--neutral-500)]">{item.detail}</span>
        <span className="mt-0.5 block font-[Poppins] text-[11px] text-[var(--neutral-400)]">{relative(item.at)}</span>
      </span>
    </>
  );
  return (
    <li className="flex items-start gap-1 border-b border-[var(--borders-default)] last:border-b-0">
      {isAppPath(item.href) ? (
        <Link to={item.href} onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 hover:bg-[var(--brand-purple-50)]">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3">{body}</div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss: ${item.title}`}
        className="mt-2 mr-2 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--neutral-400)] hover:bg-[var(--brand-purple-50)] hover:text-[var(--neutral-700)]"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

/**
 * The bell in the MBA shell header: GET /mba/me/notifications (computed by the
 * server from the student's real state), with an unread count. Opening the
 * panel marks everything seen; the dots stay for this opening so the student
 * can still tell what was new.
 *
 * The panel renders through ShellPortal so it sits above the rail and the
 * sticky header at every width.
 */
export default function NotificationsBell({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useMbaNotifications(enabled);
  const seen = useMarkNotificationsSeen();
  const location = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // What was unread when the panel opened; the refetch after "seen" clears the flags.
  const [snapshot, setSnapshot] = useState<MbaNotification[] | null>(null);

  const unread = data?.unreadCount ?? 0;
  const items = open && snapshot ? snapshot : (data?.items ?? []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setSnapshot(data?.items ?? null);
    setOpen(true);
    if (unread > 0) seen.mutate([]);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="ss-surface relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-[var(--neutral-900)]"
      >
        <span className="text-[17px]" aria-hidden>
          🔔
        </span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--red-500)] px-1 font-[Poppins] text-[10.5px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <ShellPortal>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-label="Notifications"
            className="ss-surface fixed inset-x-3 top-[72px] z-[71] flex max-h-[calc(100vh-96px)] flex-col overflow-hidden outline-none sm:inset-x-auto sm:right-6 sm:w-[380px] md:right-8"
          >
            <div className="flex items-center justify-between border-b border-[var(--borders-default)] px-4 py-3">
              <h2 className="ss-display text-[16px] text-[var(--ink)]">Notifications</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--neutral-500)] hover:bg-[var(--brand-purple-50)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto">
              {isPending ? (
                <div className="space-y-2 p-4" aria-busy aria-label="Loading">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-[#EDEFF6]" />
                  ))}
                </div>
              ) : isError ? (
                <div role="alert" className="space-y-2 p-4 font-[Poppins] text-[13px] text-[var(--neutral-600)]">
                  <p>{mbaErrorMessage(error, "Couldn't load notifications.")}</p>
                  <button type="button" onClick={() => void refetch()} className="btn-secondary cursor-pointer px-3 py-1.5 text-[12px] font-semibold">
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <p className="p-6 text-center font-[Poppins] text-[13px] text-[var(--neutral-500)]">You&rsquo;re all caught up.</p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      onOpen={() => setOpen(false)}
                      onDismiss={() => {
                        setSnapshot((s) => (s ? s.filter((x) => x.id !== item.id) : s));
                        seen.mutate([item.id]);
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </ShellPortal>
      )}
    </>
  );
}
