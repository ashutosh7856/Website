import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDown, Headset, Plus, X } from 'lucide-react';
import { mbaErrorMessage, type ShortlistItem } from '@/api/mba';
import {
  COUNSELLOR_TOPICS,
  MAX_SLOTS,
  SLOT_TIMES,
  useCounsellorRequests,
  useCreateCounsellorRequest,
  useSetCounsellorSharing,
  type CounsellorRequest,
  type CounsellorRequestStatus,
  type CounsellorTopic,
  type PreferredSlot,
  type SlotTime,
} from '@/api/mbaApplications';
import { formatDate } from '@/components/mba/format';
import { trackEvent } from '@/lib/analytics';

const PREFERRED_MAX = 120;
const NOTE_MAX = 1000;
const SHARE_LABEL = 'Let my counsellor see my MBA profile, shortlist and mock scores';

const STATUS_INFO: Record<CounsellorRequestStatus, { label: string; tone: string }> = {
  new: { label: 'Waiting for a counsellor', tone: '#D97706' },
  contacted: { label: 'Contacted', tone: '#2F43F2' },
  in_progress: { label: 'In progress', tone: '#7C3AED' },
  converted: { label: 'Complete', tone: '#059669' },
  closed: { label: 'Closed', tone: '#64748B' },
};

const isActive = (r: CounsellorRequest) => r.status !== 'converted' && r.status !== 'closed';

function statusInfo(req: CounsellorRequest) {
  if (req.status === 'new' && req.counsellorName) return { label: 'Counsellor assigned', tone: '#2F43F2' };
  return STATUS_INFO[req.status] ?? STATUS_INFO.new;
}

const topicLabel = (t: CounsellorTopic) => COUNSELLOR_TOPICS.find((x) => x.id === t)?.label ?? t;
const slotTimeLabel = (t: SlotTime) => SLOT_TIMES.find((x) => x.id === t)?.label ?? t;

/** YYYY-MM-DD in India time, `days` from today (slots are booked in IST). */
const istDay = (days = 0) => new Date(Date.now() + 5.5 * 3_600_000 + days * 86_400_000).toISOString().slice(0, 10);
const SLOT_DAYS_AHEAD = 60;

function SlotsPicker({ slots, onChange }: { slots: PreferredSlot[]; onChange: (next: PreferredSlot[]) => void }) {
  const min = istDay();
  const max = istDay(SLOT_DAYS_AHEAD);
  const set = (i: number, patch: Partial<PreferredSlot>) =>
    onChange(slots.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <fieldset className="space-y-2">
      <legend className={labelCls}>When can you do a 30–45 minute mock interview? (pick up to {MAX_SLOTS})</legend>
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={slot.date}
            min={min}
            max={max}
            required
            aria-label={`Slot ${i + 1} date`}
            onChange={(e) => set(i, { date: e.target.value })}
            className="rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[13px] text-[var(--ink)]"
          />
          <select
            value={slot.time}
            aria-label={`Slot ${i + 1} time`}
            onChange={(e) => set(i, { time: e.target.value as SlotTime })}
            className="min-w-0 flex-1 rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[13px] text-[var(--ink)]"
          >
            {SLOT_TIMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {slots.length > 1 && (
            <button
              type="button"
              aria-label={`Remove slot ${i + 1}`}
              onClick={() => onChange(slots.filter((_, j) => j !== i))}
              className="cursor-pointer rounded-lg p-1.5 text-[var(--neutral-500)] hover:bg-red-50 hover:text-[var(--red-500)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      ))}
      {slots.length < MAX_SLOTS && (
        <button
          type="button"
          onClick={() => onChange([...slots, { date: istDay(1), time: 'evening' }])}
          className="inline-flex cursor-pointer items-center gap-1 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-500)]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add another slot
        </button>
      )}
      <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
        India time. Your counsellor will call to confirm one of these.
      </p>
    </fieldset>
  );
}

const fieldCls =
  'mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]';
const labelCls = 'block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]';

function ShareToggle({ req }: { req: CounsellorRequest }) {
  const share = useSetCounsellorSharing();
  const id = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2 font-[Poppins] text-[12px] text-[var(--neutral-700)]"
      >
        <input
          id={id}
          type="checkbox"
          checked={req.shareWithCounsellor}
          disabled={share.isPending}
          onChange={(e) => share.mutate({ id: req.id, share: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-purple-500)]"
        />
        <span>
          {SHARE_LABEL}
          <span className="block text-[11px] text-[var(--neutral-500)]">
            {req.shareWithCounsellor
              ? 'Shared. Untick to stop sharing.'
              : 'Not shared. Your notes on colleges are never shared.'}
          </span>
        </span>
      </label>
      {share.isError && (
        <p role="alert" className="font-[Poppins] text-[11.5px] text-[var(--red-500)]">
          {mbaErrorMessage(share.error, 'Could not update sharing.')}
        </p>
      )}
    </div>
  );
}

function RequestLine({ req, institutes }: { req: CounsellorRequest; institutes: ShortlistItem[] }) {
  const info = statusInfo(req);
  const inst = req.slug ? institutes.find((i) => i.slug === req.slug) : undefined;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
            {topicLabel(req.topic)}
            {inst && (
              <span className="font-normal text-[var(--neutral-500)]">
                {' '}
                · {inst.shortName ?? inst.name ?? inst.slug}
              </span>
            )}
          </p>
          <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
            Requested {formatDate(req.createdAt)}
            {req.preferredTime && ` · prefers ${req.preferredTime}`}
          </p>
          {req.preferredSlots.length > 0 && (
            <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
              Your slots:{' '}
              {req.preferredSlots
                .map((s) => `${formatDate(s.date)}, ${slotTimeLabel(s.time).split(' (')[0].toLowerCase()}`)
                .join(' · ')}
            </p>
          )}
          {req.counsellorName && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-700)]">
              Your counsellor: <span className="font-semibold">{req.counsellorName}</span>
            </p>
          )}
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-white"
          style={{ background: info.tone }}
        >
          {info.label}
        </span>
      </div>
      {req.timeline.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex cursor-pointer items-center gap-1 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-500)]"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            {open ? 'Hide updates' : `Updates (${req.timeline.length})`}
          </button>
          {open && (
            <ol id={panelId} className="mt-2 space-y-2 border-l-2 border-[var(--borders-default)] pl-3">
              {req.timeline.map((t, i) => (
                <li key={`${t.at}-${i}`} className="font-[Poppins] text-[12px]">
                  <span className="block text-[11px] text-[var(--neutral-500)]">{formatDate(t.at)}</span>
                  <span className="text-[var(--ink)]">{t.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {isActive(req) && <ShareToggle req={req} />}
    </li>
  );
}

/** "Talk to my counsellor": request form + the status of earlier requests. */
export default function CounsellorRequestPanel({ institutes }: { institutes: ShortlistItem[] }) {
  const requests = useCounsellorRequests();
  const create = useCreateCounsellorRequest();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<CounsellorTopic>('shortlisting');
  const [slug, setSlug] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [sent, setSent] = useState(false);
  const [slots, setSlots] = useState<PreferredSlot[]>([{ date: istDay(1), time: 'evening' }]);
  const sectionRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const mock = topic === 'mock_interview';

  // "Book a mock interview" links from interview prep open the form at /mba/shortlist?request=mock_interview#counsellor.
  const wanted = params.get('request');
  useEffect(() => {
    if (wanted !== 'mock_interview') return;
    setTopic('mock_interview');
    setOpen(true);
    setSent(false);
    const next = new URLSearchParams(params);
    next.delete('request');
    setParams(next, { replace: true });
  }, [wanted, params, setParams]);

  const list = requests.data?.requests ?? [];
  const active = list.filter(isActive).length;

  // Notifications link to /mba/shortlist#counsellor.
  useEffect(() => {
    if (hash === '#counsellor')
      sectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }, [hash]);

  const submit = () => {
    setError(null);
    create.mutate(
      {
        topic,
        slug: slug || null,
        preferredTime: mock ? null : preferredTime.trim() || null,
        note: note.trim() || null,
        shareWithCounsellor: share,
        ...(mock ? { preferredSlots: slots } : {}),
      },
      {
        onSuccess: () => {
          trackEvent('mba_counsellor_request', { topic });
          setSent(true);
          setOpen(false);
          setPreferredTime('');
          setNote('');
          setSlug('');
          setShare(false);
          setSlots([{ date: istDay(1), time: 'evening' }]);
        },
        onError: (err) => setError(mbaErrorMessage(err, 'Could not send your request.')),
      },
    );
  };

  return (
    <section
      ref={sectionRef}
      id="counsellor"
      className="ss-panel scroll-mt-20 space-y-3 p-4 md:p-5"
      aria-labelledby="counsellor-heading"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDEFF6] text-[var(--brand-purple-500)]">
          <Headset className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="counsellor-heading" className="ss-display text-[16px] text-[var(--ink)]">
            Talk to my counsellor
          </h2>
          <p className="font-[Poppins] text-[12.5px] text-[var(--neutral-500)]">
            Stuck on which colleges to apply to, a form, or interview prep? Ask for a call and a ProCounsel counsellor
            will reach out.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setSent(false);
            }}
            className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold"
          >
            Request a call
          </button>
        )}
      </div>

      {sent && !open && (
        <p role="status" className="font-[Poppins] text-[12.5px] text-[var(--green-600)]">
          Request sent. We'll call you on your registered number
          {mock ? ' to confirm your mock interview slot' : ''}.
        </p>
      )}

      {open && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              What do you need help with?
              <select value={topic} onChange={(e) => setTopic(e.target.value as CounsellorTopic)} className={fieldCls}>
                {COUNSELLOR_TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              About a college (optional)
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className={fieldCls}>
                <option value="">Not about one college</option>
                {institutes.map((i) => (
                  <option key={i.slug} value={i.slug}>
                    {i.shortName ?? i.name ?? i.slug}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mock ? (
            <SlotsPicker slots={slots} onChange={setSlots} />
          ) : (
            <label className={labelCls}>
              Best time to call (optional)
              <input
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value.slice(0, PREFERRED_MAX))}
                maxLength={PREFERRED_MAX}
                placeholder="e.g. Weekdays after 6 pm"
                className={fieldCls}
              />
            </label>
          )}
          <label className={labelCls}>
            Anything we should know? (optional)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              maxLength={NOTE_MAX}
              rows={3}
              placeholder="Your question, your CAT mock percentile, colleges you're unsure about…"
              className={fieldCls}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2 font-[Poppins] text-[12px] text-[var(--neutral-700)]">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-purple-500)]"
            />
            <span>
              {SHARE_LABEL} (optional)
              <span className="block text-[11px] text-[var(--neutral-500)]">
                Helps them prepare for the call. You can change this later.
              </span>
            </span>
          </label>
          {error && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {create.isPending ? 'Sending…' : 'Send request'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {requests.isError ? (
        <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          {mbaErrorMessage(requests.error, "Couldn't load your earlier requests.")}
        </p>
      ) : list.length > 0 ? (
        <div>
          <p className="font-[Poppins] text-[11.5px] font-semibold uppercase tracking-wide text-[var(--neutral-400)]">
            Your requests{active ? ` · ${active} active` : ''}
          </p>
          <ul className="divide-y divide-[var(--borders-default)]">
            {list.slice(0, 5).map((r) => (
              <RequestLine key={r.id} req={r} institutes={institutes} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
