import { useState } from 'react';
import { Headset } from 'lucide-react';
import { mbaErrorMessage, type ShortlistItem } from '@/api/mba';
import {
  COUNSELLOR_TOPICS,
  useCounsellorRequests,
  useCreateCounsellorRequest,
  type CounsellorRequest,
  type CounsellorRequestStatus,
  type CounsellorTopic,
} from '@/api/mbaApplications';
import { formatDate } from '@/components/mba/format';

const PREFERRED_MAX = 120;
const NOTE_MAX = 1000;

const STATUS_INFO: Record<CounsellorRequestStatus, { label: string; tone: string }> = {
  open: { label: 'Waiting for a counsellor', tone: '#D97706' },
  assigned: { label: 'Counsellor assigned', tone: '#2F43F2' },
  done: { label: 'Done', tone: '#059669' },
};

const topicLabel = (t: CounsellorTopic) => COUNSELLOR_TOPICS.find((x) => x.id === t)?.label ?? t;

const fieldCls =
  'mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--ink)]';
const labelCls = 'block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]';

function RequestLine({ req, institutes }: { req: CounsellorRequest; institutes: ShortlistItem[] }) {
  const info = STATUS_INFO[req.status];
  const inst = req.slug ? institutes.find((i) => i.slug === req.slug) : undefined;
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
          {topicLabel(req.topic)}
          {inst && <span className="font-normal text-[var(--neutral-500)]"> · {inst.shortName ?? inst.name ?? inst.slug}</span>}
        </p>
        <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
          Requested {formatDate(req.createdAt)}
          {req.preferredTime && ` · prefers ${req.preferredTime}`}
          {req.assignedTo && req.status !== 'open' && ` · with ${req.assignedTo}`}
        </p>
      </div>
      <span
        className="rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-white"
        style={{ background: info.tone }}
      >
        {info.label}
      </span>
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
  const [sent, setSent] = useState(false);

  const list = requests.data?.requests ?? [];
  const active = list.filter((r) => r.status !== 'done').length;

  const submit = () => {
    setError(null);
    create.mutate(
      {
        topic,
        slug: slug || null,
        preferredTime: preferredTime.trim() || null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setSent(true);
          setOpen(false);
          setPreferredTime('');
          setNote('');
          setSlug('');
        },
        onError: (err) => setError(mbaErrorMessage(err, 'Could not send your request.')),
      },
    );
  };

  return (
    <section className="ss-panel space-y-3 p-4 md:p-5" aria-labelledby="counsellor-heading">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDEFF6] text-[var(--brand-purple-500)]">
          <Headset className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="counsellor-heading" className="ss-display text-[16px] text-[var(--ink)]">
            Talk to my counsellor
          </h2>
          <p className="font-[Poppins] text-[12.5px] text-[var(--neutral-500)]">
            Stuck on which colleges to apply to, a form, or interview prep? Ask for a call and a ProCounsel counsellor will
            reach out.
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
          Request sent. We'll call you on your registered number.
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
