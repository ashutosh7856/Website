import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, Flag, MessageCircle, ThumbsUp } from 'lucide-react';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import {
  REPORT_REASONS,
  useReply,
  useReportPost,
  useSetDoubtStatus,
  useVote,
  type DoubtDetail,
  type DoubtReply,
  type DoubtThread,
  type PostReportReason,
} from '@/api/mbaCommunity';
import { formatDate } from './format';

/**
 * Shared pieces of the doubt / study-group thread model: a post form, a list
 * of threads, one thread with its replies, and the "Ask a doubt" link shown
 * under a revealed question.
 */

const POST_RULES = 'Keep it on ProCounsel: no links, phone numbers, e-mail IDs or other apps. Be kind.';
const TEXT_MAX = 2000;

function postErrorText(err: unknown, fallback = 'Could not post. Please try again.'): string {
  if (mbaStatus(err) === 429) return mbaErrorMessage(err, "You've posted a lot today. Please try again later.");
  return mbaErrorMessage(err, fallback);
}

const timeOf = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatDate(iso)}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
};

export function PostForm({
  label,
  placeholder,
  submitLabel,
  pending,
  error,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  /** Resolve to clear the box (after a successful post). */
  onSubmit: (text: string, done: () => void) => void;
}) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed.length >= 5) onSubmit(trimmed, () => setText(''));
      }}
    >
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        {label}
        <textarea
          value={text}
          maxLength={TEXT_MAX}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[13px] font-normal text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={trimmed.length < 5 || pending}
          className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Posting…' : submitLabel}
        </button>
        <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
          {text.length}/{TEXT_MAX}
        </span>
      </div>
      <p className="mt-1.5 font-[Poppins] text-[11px] text-[var(--neutral-500)]">{POST_RULES}</p>
      {error != null && (
        <p role="alert" className="mt-1.5 font-[Poppins] text-[12px] text-[var(--red-500)]">
          {postErrorText(error)}
        </p>
      )}
    </form>
  );
}

function Badge({ tone, children }: { tone: 'green' | 'purple' | 'grey'; children: ReactNode }) {
  const colors = {
    green: { color: 'var(--green-600)', background: 'var(--green-50)' },
    purple: { color: 'var(--brand-purple-700)', background: 'var(--brand-purple-50)' },
    grey: { color: 'var(--neutral-600)', background: 'var(--neutral-100)' },
  }[tone];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-[Poppins] text-[11px] font-semibold" style={colors}>
      {children}
    </span>
  );
}

export function ThreadList({ threads, emptyText }: { threads: DoubtThread[]; emptyText: string }) {
  if (threads.length === 0)
    return <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            to={`/mba/community/doubts/${encodeURIComponent(t.id)}`}
            className="block rounded-2xl border border-[var(--borders-default)] bg-white p-3.5 hover:border-[var(--brand-purple-400)]"
          >
            <p className="line-clamp-2 font-[Poppins] text-[14px] text-[var(--ink)]">{t.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              <span>
                {t.isYours ? 'You' : t.authorName} · {formatDate(t.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden /> {t.replyCount}
                <span className="sr-only">replies</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden /> {t.upvotes}
                <span className="sr-only">upvotes</span>
              </span>
              {t.facultyAnswered && (
                <Badge tone="green">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified answer
                </Badge>
              )}
              {t.status === 'resolved' && <Badge tone="grey">Resolved</Badge>}
              {t.hidden && <Badge tone="grey">Hidden by moderators</Badge>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VoteButton({ count, active, disabled, onClick }: { count: number; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? `Remove upvote (${count})` : `Upvote (${count})`}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
        color: active ? 'var(--brand-purple-700)' : 'var(--neutral-600)',
        background: active ? 'var(--brand-purple-50)' : '#fff',
      }}
    >
      <ThumbsUp className="h-3.5 w-3.5" aria-hidden /> {count}
    </button>
  );
}

function ReportButton({ reported, pending, onReport }: { reported: boolean; pending: boolean; onReport: (r: PostReportReason) => void }) {
  const [open, setOpen] = useState(false);
  if (reported)
    return <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">Reported — thanks</span>;
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1 font-[Poppins] text-[11px] font-semibold text-[var(--neutral-500)] hover:text-[var(--brand-purple-700)]"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden /> Report
      </button>
    );
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Why are you reporting this?">
      {REPORT_REASONS.map((r) => (
        <button
          key={r.id}
          type="button"
          disabled={pending}
          onClick={() => {
            onReport(r.id);
            setOpen(false);
          }}
          className="cursor-pointer rounded-full border border-[var(--borders-default)] bg-white px-2.5 py-1 font-[Poppins] text-[11px] font-semibold text-[var(--neutral-600)]"
        >
          {r.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer font-[Poppins] text-[11px] font-semibold text-[var(--neutral-500)]"
      >
        Cancel
      </button>
    </div>
  );
}

function ReplyItem({ doubtId, reply }: { doubtId: string; reply: DoubtReply }) {
  const vote = useVote(doubtId);
  const report = useReportPost(doubtId);
  const faculty = reply.by === 'faculty';
  return (
    <li
      className="rounded-2xl border p-3.5"
      style={{
        borderColor: reply.verified ? 'var(--green-600)' : 'var(--borders-default)',
        background: reply.verified ? 'var(--green-50)' : '#fff',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
        <strong className="text-[var(--ink)]">{reply.isYours ? 'You' : reply.authorName}</strong>
        {faculty && <Badge tone="purple">Faculty</Badge>}
        {reply.verified && (
          <Badge tone="green">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
          </Badge>
        )}
        {reply.hidden && <Badge tone="grey">Hidden by moderators</Badge>}
        <span className="text-[11px] text-[var(--neutral-400)]">{timeOf(reply.createdAt)}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap break-words font-[Poppins] text-[14px] leading-relaxed text-[var(--neutral-800)]">{reply.text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <VoteButton
          count={reply.upvotes}
          active={reply.youUpvoted}
          disabled={vote.isPending || reply.isYours}
          onClick={() => vote.mutate({ up: !reply.youUpvoted, replyId: reply.id })}
        />
        {!reply.isYours && !faculty && (
          <ReportButton
            reported={reply.youReported}
            pending={report.isPending}
            onReport={(reason) => report.mutate({ reason, replyId: reply.id })}
          />
        )}
      </div>
      {(vote.isError || report.isError) && (
        <p role="alert" className="mt-1 font-[Poppins] text-[12px] text-[var(--red-500)]">
          {postErrorText(vote.error ?? report.error, 'Could not save. Please try again.')}
        </p>
      )}
    </li>
  );
}

/** One thread: the question/post, its replies (verified first) and the reply box. */
export function DoubtThreadView({ doubt }: { doubt: DoubtDetail }) {
  const reply = useReply(doubt.id);
  const vote = useVote(doubt.id);
  const report = useReportPost(doubt.id);
  const status = useSetDoubtStatus(doubt.id);
  const resolved = doubt.status === 'resolved';
  const noun = doubt.scope === 'group' ? 'post' : 'doubt';

  return (
    <div className="space-y-4">
      <article className="ss-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          <strong className="text-[var(--ink)]">{doubt.isYours ? 'You' : doubt.authorName}</strong>
          <span className="text-[11px] text-[var(--neutral-400)]">{timeOf(doubt.createdAt)}</span>
          {resolved && (
            <Badge tone="green">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Resolved
            </Badge>
          )}
          {doubt.hidden && <Badge tone="grey">Hidden by moderators — only you can see it</Badge>}
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words font-[Poppins] text-[15px] leading-relaxed text-[var(--ink)]">{doubt.text}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VoteButton
            count={doubt.upvotes}
            active={doubt.youUpvoted}
            disabled={vote.isPending || doubt.isYours}
            onClick={() => vote.mutate({ up: !doubt.youUpvoted })}
          />
          {doubt.isYours ? (
            <button
              type="button"
              disabled={status.isPending}
              onClick={() => status.mutate(resolved ? 'open' : 'resolved')}
              className="cursor-pointer rounded-full border border-[var(--borders-default)] bg-white px-3 py-1 font-[Poppins] text-[12px] font-semibold text-[var(--neutral-700)] disabled:opacity-60"
            >
              {resolved ? 'Reopen' : `Mark ${noun} resolved`}
            </button>
          ) : (
            <ReportButton reported={doubt.youReported} pending={report.isPending} onReport={(reason) => report.mutate({ reason })} />
          )}
        </div>
        {(vote.isError || report.isError || status.isError) && (
          <p role="alert" className="mt-1 font-[Poppins] text-[12px] text-[var(--red-500)]">
            {postErrorText(vote.error ?? report.error ?? status.error, 'Could not save. Please try again.')}
          </p>
        )}
      </article>

      <section aria-labelledby="replies-heading" className="space-y-3">
        <h2 id="replies-heading" className="ss-display text-[16px] text-[var(--ink)]">
          {doubt.replies.length === 0 ? 'No replies yet' : `${doubt.replies.length} ${doubt.replies.length === 1 ? 'reply' : 'replies'}`}
        </h2>
        {doubt.replies.length === 0 && doubt.scope === 'question' && (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
            Other students can answer, and if nobody from our faculty has answered within a day, it goes to them automatically.
          </p>
        )}
        {doubt.replies.length > 0 && (
          <ul className="space-y-2">
            {doubt.replies.map((r) => (
              <ReplyItem key={r.id} doubtId={doubt.id} reply={r} />
            ))}
          </ul>
        )}
        {!doubt.hidden && (
          <div className="ss-panel p-4">
            <PostForm
              label={doubt.isYours ? 'Add more detail' : 'Your reply'}
              placeholder={doubt.isYours ? 'Anything you tried, or what still is not clear…' : 'Explain how you would approach it…'}
              submitLabel="Post reply"
              pending={reply.isPending}
              error={reply.error}
              onSubmit={(text, done) => reply.mutate(text, { onSuccess: done })}
            />
          </div>
        )}
      </section>
    </div>
  );
}

/** "Ask a doubt" — under a question whose answer has been shown to the student. */
export function AskDoubtLink({ questionId }: { questionId: string }) {
  return (
    <Link
      to={`/mba/community/questions/${encodeURIComponent(questionId)}`}
      className="inline-flex items-center gap-1.5 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)] hover:underline"
    >
      <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Ask a doubt or see others' doubts
    </Link>
  );
}
