import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { FeedbackCard, GroupChip, ItemGuidance, Pill } from '@/components/mba/GdpiFeedback';
import { formatClock } from '@/components/mba/format';
import { mbaStatus } from '@/api/mba';
import {
  MIN_ANSWER_CHARS,
  TOPIC_GROUPS,
  WAT_MAX_CHARS,
  gdpiErrorMessage,
  useCreateGdpiSession,
  useGdpiItems,
  useGdpiSession,
  useSubmitGdpiAnswer,
  wordCount,
  type GdpiSession,
  type TopicGroup,
} from '@/api/mbaGdpi';

const draftKey = (sessionId: string) => `mba-gdpi-wat-draft:${sessionId}`;
const readDraft = (sessionId: string) => {
  try {
    return localStorage.getItem(draftKey(sessionId)) ?? '';
  } catch {
    return '';
  }
};
const writeDraft = (sessionId: string, text: string | null) => {
  try {
    if (text === null) localStorage.removeItem(draftKey(sessionId));
    else localStorage.setItem(draftKey(sessionId), text);
  } catch {
    /* storage unavailable: the draft just isn't kept */
  }
};

function Setup({ topicId, onStarted }: { topicId: string | null; onStarted: (id: string) => void }) {
  const [group, setGroup] = useState<TopicGroup | undefined>();
  const [duration, setDuration] = useState<15 | 20>(15);
  const topics = useGdpiItems({ kind: 'wat' });
  const create = useCreateGdpiSession();
  const topic = topicId ? topics.data?.items.find((i) => i.id === topicId) : undefined;

  return (
    <section className="ss-panel space-y-5 p-4 md:p-6">
      <div>
        <h2 className="ss-display text-[18px] text-[var(--ink)]">Set up your timed essay</h2>
        <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-500)]">
          Most WATs ask for a short essay in 15–20 minutes. Plan for two or three minutes, write, and keep a minute to
          re-read. The clock starts when you press Start.
        </p>
      </div>
      {topicId ? (
        topics.isPending ? (
          <Skeleton rows={1} />
        ) : topic ? (
          <div className="rounded-xl bg-[var(--neutral-50)] p-3">
            <GroupChip group={topic.group} />
            <p className="ss-display mt-2 text-[17px] text-[var(--ink)]">{topic.prompt}</p>
          </div>
        ) : (
          <p className="font-[Poppins] text-[13px] text-[var(--red-500)]">
            That topic isn't available. Pick a theme below for a random topic instead.
          </p>
        )
      ) : null}
      {(!topicId || (!topics.isPending && !topic)) && (
        <fieldset>
          <legend className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
            Theme (you'll get a random topic)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill active={!group} onClick={() => setGroup(undefined)}>
              Any
            </Pill>
            {TOPIC_GROUPS.map((g) => (
              <Pill key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
                {g.label}
              </Pill>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">Time limit</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {([15, 20] as const).map((m) => (
            <Pill key={m} active={duration === m} onClick={() => setDuration(m)}>
              {m} minutes
            </Pill>
          ))}
        </div>
      </fieldset>
      {create.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {gdpiErrorMessage(create.error, 'Could not start the essay.')}
        </p>
      )}
      <button
        type="button"
        disabled={create.isPending || (!!topicId && topics.isPending)}
        onClick={() =>
          create.mutate(
            topic
              ? { kind: 'wat', itemId: topic.id, durationMinutes: duration }
              : { kind: 'wat', focus: group, durationMinutes: duration },
            { onSuccess: (session) => onStarted(session.id) },
          )
        }
        className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {create.isPending ? 'Starting…' : 'Start the clock'}
      </button>
    </section>
  );
}

function Writer({ session, fetchedAt }: { session: GdpiSession; fetchedAt: number }) {
  const topic = session.questions[0];
  const [text, setText] = useState(() => readDraft(session.id));
  const submit = useSubmitGdpiAnswer();
  // Server clock offset so a wrong phone clock can't stretch the timer.
  const offset = useRef(Date.parse(session.serverNow) - fetchedAt);
  const endsAt = session.endsAt ? Date.parse(session.endsAt) : null;
  const [now, setNow] = useState(() => Date.now());
  const autoSent = useRef(false);
  const remainingMs = endsAt === null ? null : endsAt - (now + offset.current);
  const timeUp = remainingMs !== null && remainingMs <= 0;
  const trimmed = text.trim();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const send = () => {
    if (trimmed.length < MIN_ANSWER_CHARS || submit.isPending) return;
    submit.mutate(
      { sessionId: session.id, questionId: topic.id, answerText: trimmed },
      { onSuccess: () => writeDraft(session.id, null) },
    );
  };

  // Hand the essay in when the clock runs out (once), as a real WAT would.
  useEffect(() => {
    if (timeUp && !autoSent.current && trimmed.length >= MIN_ANSWER_CHARS) {
      autoSent.current = true;
      send();
    }
  });

  const low = remainingMs !== null && remainingMs < 60_000;
  return (
    <article className="ss-panel space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <GroupChip group={topic.group} />
        {remainingMs !== null && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[Poppins] text-[14px] font-bold tabular-nums"
            style={{
              background: low ? 'var(--red-100)' : 'var(--brand-purple-50)',
              color: low ? 'var(--red-500)' : 'var(--brand-purple-700)',
            }}
            role="timer"
            aria-label="Time left"
          >
            <Clock className="h-4 w-4" />
            {formatClock(Math.max(0, remainingMs))}
          </span>
        )}
      </div>
      <h2 className="ss-display text-[19px] leading-snug text-[var(--ink)] md:text-[22px]">{topic.prompt}</h2>
      {timeUp && (
        <p role="status" className="rounded-xl bg-[var(--neutral-50)] p-3 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          Time's up. {trimmed.length >= MIN_ANSWER_CHARS ? 'Your essay has been handed in.' : 'You can still submit — it will be marked as over time.'}
        </p>
      )}
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        Your essay
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            writeDraft(session.id, e.target.value);
          }}
          rows={14}
          maxLength={WAT_MAX_CHARS}
          disabled={submit.isPending || submit.isSuccess}
          placeholder="Introduction, two or three arguments, a counterpoint, and a conclusion."
          className="mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-3 text-[14px] font-normal leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)] disabled:bg-[var(--neutral-50)]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
        <strong className="text-[var(--ink)]">{wordCount(text)} words</strong>
        <span>
          {text.length.toLocaleString('en-IN')}/{WAT_MAX_CHARS.toLocaleString('en-IN')} characters
        </span>
      </div>
      {submit.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {gdpiErrorMessage(submit.error, 'Could not get feedback.')}
        </p>
      )}
      <button
        type="button"
        onClick={send}
        disabled={trimmed.length < MIN_ANSWER_CHARS || submit.isPending || mbaStatus(submit.error) === 429}
        className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submit.isPending ? 'Getting feedback…' : 'Submit essay'}
      </button>
    </article>
  );
}

function Result({ session, onRestart }: { session: GdpiSession; onRestart: () => void }) {
  const topic = session.questions[0];
  const answer = session.answers[0];
  const submit = useSubmitGdpiAnswer();
  return (
    <div className="space-y-4">
      <article className="ss-panel space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <GroupChip group={topic.group} />
          <span className="ml-auto font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {answer.wordCount} words · {session.durationMinutes} min{answer.overtime ? ' · submitted over time' : ''}
          </span>
        </div>
        <h2 className="ss-display text-[19px] leading-snug text-[var(--ink)]">{topic.prompt}</h2>
        <p className="whitespace-pre-wrap font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">
          {answer.answerText}
        </p>
      </article>
      <FeedbackCard feedback={answer.feedback} />
      {submit.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {gdpiErrorMessage(submit.error, 'Could not get feedback.')}
        </p>
      )}
      <section className="ss-panel p-4 md:p-5">
        <h3 className="ss-display mb-3 text-[16px] text-[var(--ink)]">About this topic</h3>
        <ItemGuidance item={topic} />
      </section>
      <div className="flex flex-wrap gap-2">
        {answer.feedback.fallback && (
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => submit.mutate({ sessionId: session.id, questionId: topic.id, answerText: answer.answerText })}
            className="btn-secondary cursor-pointer px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-50"
          >
            {submit.isPending ? 'Getting feedback…' : 'Try feedback again'}
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
        >
          Write another essay
        </button>
        <Link to="/mba/gdpi?tab=history" className="btn-secondary px-5 py-2.5 font-[Poppins] text-[13px] font-semibold">
          All my sessions
        </Link>
      </div>
    </div>
  );
}

export default function MbaGdpiWat() {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const query = useGdpiSession(sessionId);
  const restart = () => setParams({});

  let body;
  if (!sessionId)
    body = <Setup topicId={params.get('topic')} onStarted={(id) => setParams({ session: id }, { replace: true })} />;
  else if (query.isPending) body = <Skeleton rows={2} />;
  else if (query.isError)
    body = (
      <StateBlock
        tone="error"
        title={mbaStatus(query.error) === 404 ? 'Session not found' : "Couldn't load this essay"}
        detail={gdpiErrorMessage(query.error, 'Please try again.')}
        action={{ label: 'Start a new essay', onClick: restart }}
      />
    );
  else if (query.data.kind !== 'wat' || !query.data.questions.length)
    body = <StateBlock tone="info" title="This is a mock interview session" action={{ label: 'Open it', href: `/mba/gdpi/interview?session=${query.data.id}` }} />;
  else if (query.data.answers.length) body = <Result session={query.data} onRestart={restart} />;
  else body = <Writer key={query.data.id} session={query.data} fetchedAt={query.dataUpdatedAt} />;

  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <Link
        to="/mba/gdpi?tab=wat"
        className="inline-flex items-center gap-1 font-[Poppins] text-[13px] font-semibold text-[var(--brand-purple-600)]"
      >
        <ArrowLeft className="h-4 w-4" /> Interview prep
      </Link>
      <SkyBanner
        eyebrow="Written ability test"
        title="Timed WAT essay"
        lead="Write against the clock, then get feedback on structure, clarity, relevance and completeness."
      />
      {body}
    </div>
  );
}
