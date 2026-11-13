import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Send, Trash2 } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import { trackEvent } from '@/lib/analytics';
import {
  COACHES,
  useClearCoachChat,
  useCoachChat,
  useSendCoachMessage,
  type CoachChat,
  type CoachId,
} from '@/api/mbaCoach';

const MAX_CHARS = 1500;

function sendErrorMessage(err: unknown): string {
  switch (mbaStatus(err)) {
    case 429:
      return 'You have used all your AI requests for today. They reset at midnight.';
    case 409:
      return mbaErrorMessage(err, 'That question is part of your test in progress. Submit the test first.');
    case 503:
      return 'The coach is not available right now. Please try again later.';
    default:
      return mbaErrorMessage(err, 'Could not send your message.');
  }
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
const STATUS_LABEL = { weak: 'Weak', ok: 'OK', strong: 'Strong', low_evidence: 'Too few answers' } as const;
const STATUS_COLOR = {
  weak: 'var(--red-500)',
  ok: 'var(--neutral-600)',
  strong: 'var(--green-600)',
  low_evidence: 'var(--neutral-400)',
} as const;

/** "What your coach sees": exactly the data sent to the model. */
function ContextPanel({ chat }: { chat: CoachChat }) {
  const { context } = chat;
  return (
    <section aria-labelledby="coach-context" className="ss-panel space-y-3 p-4 md:p-5">
      <h2 id="coach-context" className="ss-display text-[15px] text-[var(--ink)]">
        What your coach sees
      </h2>
      <p className="font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">
        Only your own results in this section. No other student's data is ever shared.
      </p>
      {context.topics.length ? (
        <ul className="space-y-1.5">
          {context.topics.map((t) => (
            <li key={t.topic} className="flex items-baseline justify-between gap-2 font-[Poppins] text-[12px]">
              <span className="min-w-0 truncate text-[var(--neutral-700)]">{t.topic}</span>
              <span className="shrink-0 text-right">
                <span className="ss-data text-[var(--ink)]">{pct(t.accuracy)}</span>
                <span className="text-[var(--neutral-400)]"> · {t.attempts} answered · </span>
                <span style={{ color: STATUS_COLOR[t.status] }}>{STATUS_LABEL[t.status]}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          No answers in this section yet.{' '}
          <Link to={`/mba/practice?section=${chat.section}`} className="font-semibold text-[var(--brand-purple-700)]">
            Practise a few questions
          </Link>{' '}
          so the coach can tailor its advice.
        </p>
      )}
      {context.recentMistakeTopics.length > 0 && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">Recent mistakes</p>
          <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-700)]">{context.recentMistakeTopics.join(' · ')}</p>
        </div>
      )}
      <div>
        <p className="ss-eyebrow text-[var(--neutral-500)]">Score estimate</p>
        <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-700)]">
          {context.estimate
            ? `About ${context.estimate.expected} (${context.estimate.low}–${context.estimate.high}) of ${context.estimate.maxScore}`
            : 'Not enough timed tests yet.'}
        </p>
      </div>
    </section>
  );
}

function ChatPanel({ coach }: { coach: CoachId }) {
  const info = COACHES.find((c) => c.id === coach) ?? COACHES[0];
  const chat = useCoachChat(coach);
  const send = useSendCoachMessage(coach);
  const clear = useClearCoachChat(coach);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const turns = chat.data?.turns ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [turns.length, pending]);

  const submit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || send.isPending) return;
    setError(null);
    setPending(trimmed);
    send.mutate(trimmed, {
      onSuccess: () => {
        setText('');
        trackEvent('mba_ai_coach_message', { coach });
      },
      onError: (err) => setError(sendErrorMessage(err)),
      onSettled: () => setPending(null),
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
  };

  if (chat.isPending) return <Skeleton rows={2} />;
  if (chat.isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't open the coach"
        detail={mbaErrorMessage(chat.error)}
        action={{ label: 'Try again', onClick: () => void chat.refetch() }}
      />
    );

  const data = chat.data;
  const outOfQuota = data.remainingToday <= 0;
  const disabled = !data.configured || outOfQuota || send.isPending;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label={info.label} className="ss-panel flex min-w-0 flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SectionChip section={info.section} />
          <h2 className="ss-display text-[16px] text-[var(--ink)]">{info.label}</h2>
          <span className="ml-auto font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            {data.remainingToday} of {data.dailyLimit} AI requests left today
          </span>
        </div>
        <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">{info.blurb}</p>

        {data.context.inRunningTest && (
          <p role="status" className="mt-3 rounded-xl bg-[var(--gold-100)] px-3 py-2 font-[Poppins] text-[12px] text-[var(--neutral-700)]">
            You have a test in progress. The coach won't help with its questions until you submit it.
          </p>
        )}
        {!data.configured && (
          <p role="status" className="mt-3 rounded-xl bg-[var(--neutral-50)] px-3 py-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
            The AI coach isn't available right now. Please check back later.
          </p>
        )}

        <div className="mt-4 max-h-[60vh] min-h-[180px] space-y-3 overflow-y-auto" aria-live="polite">
          {turns.length === 0 && !pending ? (
            <div className="rounded-xl bg-[var(--surfaces-card-purple)] p-4">
              <p className="flex items-center gap-1.5 font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
                <Bot className="h-4 w-4 text-[var(--brand-purple-600)]" aria-hidden /> Ask me anything about {info.section === 'QA' ? 'Quant' : info.section}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {info.starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={disabled}
                    onClick={() => submit(s)}
                    className="btn-secondary cursor-pointer px-3 py-1.5 text-left font-[Poppins] text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {turns.map((t, i) => (
                <div key={`${t.at}-${i}`} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 font-[Poppins] text-[13px] leading-relaxed ${
                      t.role === 'user'
                        ? 'bg-[var(--brand-purple-500)] text-white'
                        : 'bg-[var(--neutral-50)] text-[var(--neutral-800)]'
                    }`}
                  >
                    <span className="sr-only">{t.role === 'user' ? 'You: ' : 'Coach: '}</span>
                    {t.text}
                  </p>
                </div>
              ))}
              {pending && (
                <>
                  <div className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[var(--brand-purple-500)] px-3.5 py-2.5 font-[Poppins] text-[13px] text-white opacity-80">
                      {pending}
                    </p>
                  </div>
                  <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">Thinking…</p>
                </>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p role="alert" className="mt-3 font-[Poppins] text-[12px] text-[var(--red-500)]">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <label htmlFor={`coach-input-${coach}`} className="sr-only">
            Message the {info.label}
          </label>
          <textarea
            id={`coach-input-${coach}`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
            rows={3}
            disabled={!data.configured || outOfQuota}
            placeholder={outOfQuota ? 'Daily limit reached. Come back tomorrow.' : 'Ask about a concept, a method or your own results…'}
            className="block w-full resize-y rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[13px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)] disabled:bg-[var(--neutral-50)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={disabled || !text.trim()}
              className="btn-primary flex cursor-pointer items-center gap-1.5 px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden /> {send.isPending ? 'Sending…' : 'Send'}
            </button>
            <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
              {text.length}/{MAX_CHARS}
            </span>
            {turns.length > 0 &&
              (confirmClear ? (
                <span className="ml-auto flex items-center gap-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
                  Delete this chat?
                  <button
                    type="button"
                    onClick={() => clear.mutate(undefined, { onSettled: () => setConfirmClear(false) })}
                    disabled={clear.isPending}
                    className="cursor-pointer font-semibold text-[var(--red-500)] disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="cursor-pointer font-semibold text-[var(--neutral-500)]">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="ml-auto flex cursor-pointer items-center gap-1 font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)] hover:text-[var(--red-500)]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear chat
                </button>
              ))}
          </div>
        </form>
        <p className="mt-3 font-[Poppins] text-[11px] leading-relaxed text-[var(--neutral-400)]">
          AI replies can be wrong. Chats are kept for 7 days. For exam dates, cut-offs and the exam pattern, check the official pages:{' '}
          <Link to="/mba-entrance-exams/cat" className="underline">
            CAT pattern
          </Link>
          ,{' '}
          <Link to="/mba-colleges/iim-cutoffs" className="underline">
            IIM cut-offs
          </Link>
          ,{' '}
          <Link to="/mba-admission-deadlines" className="underline">
            deadlines
          </Link>
          .
        </p>
      </section>
      <ContextPanel chat={data} />
    </div>
  );
}

/** /mba/coach — VARC, DILR and Quant AI coaches (?coach=varc|dilr|quant). */
export default function MbaCoach() {
  const [params, setParams] = useSearchParams();
  const coach: CoachId = COACHES.some((c) => c.id === params.get('coach')) ? (params.get('coach') as CoachId) : 'quant';

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="AI coach"
        title="Section coaches"
        lead="Three AI coaches, one per CAT section. They use your own results to give advice on concepts, methods and what to fix next."
      />
      <div role="tablist" aria-label="Coaches" className="flex flex-wrap gap-2">
        {COACHES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={coach === c.id}
            onClick={() => setParams({ coach: c.id }, { replace: true })}
            className="cursor-pointer rounded-full border px-4 py-2 font-[Poppins] text-[13px] font-semibold"
            style={{
              borderColor: coach === c.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
              background: coach === c.id ? 'var(--brand-purple-500)' : '#fff',
              color: coach === c.id ? '#fff' : 'var(--neutral-600)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ChatPanel key={coach} coach={coach} />
    </div>
  );
}
