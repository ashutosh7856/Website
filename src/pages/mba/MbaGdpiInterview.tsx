import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { FeedbackCard, GroupChip, ItemGuidance, Pill, ScoreBars } from '@/components/mba/GdpiFeedback';
import { DeliveryCard, VoiceAnswer } from '@/components/mba/VoiceAnswer';
import { mbaStatus } from '@/api/mba';
import {
  BACKGROUNDS,
  MIN_ANSWER_CHARS,
  PI_GROUPS,
  PI_MAX_CHARS,
  gdpiErrorMessage,
  useCreateGdpiSession,
  useGdpiSession,
  useSubmitGdpiAnswer,
  useSubmitGdpiVoiceAnswer,
  wordCount,
  type Background,
  type GdpiItem,
  type GdpiSession,
  type PiGroup,
  type SessionAnswer,
} from '@/api/mbaGdpi';

function BackLink() {
  return (
    <Link
      to="/mba/gdpi"
      className="inline-flex items-center gap-1 font-[Poppins] text-[13px] font-semibold text-[var(--brand-purple-600)]"
    >
      <ArrowLeft className="h-4 w-4" /> Interview prep
    </Link>
  );
}

function Setup({ onStarted }: { onStarted: (id: string) => void }) {
  const [background, setBackground] = useState<Background | undefined>();
  const [focus, setFocus] = useState<PiGroup | undefined>();
  const create = useCreateGdpiSession();

  return (
    <section className="ss-panel space-y-5 p-4 md:p-6">
      <div>
        <h2 className="ss-display text-[18px] text-[var(--ink)]">Set up your mock interview</h2>
        <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-500)]">
          You'll get five questions, one at a time. Speak your answer into the mic or type it as you would say it — aim
          for one to two minutes (roughly 150–300 words). Each answer gets AI feedback.
        </p>
      </div>
      <fieldset>
        <legend className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Your undergraduate background
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill active={!background} onClick={() => setBackground(undefined)}>
            Any
          </Pill>
          {BACKGROUNDS.map((b) => (
            <Pill key={b.id} active={background === b.id} onClick={() => setBackground(b.id)}>
              {b.label}
            </Pill>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">Focus</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill active={!focus} onClick={() => setFocus(undefined)}>
            Balanced mix
          </Pill>
          {PI_GROUPS.map((g) => (
            <Pill key={g.id} active={focus === g.id} onClick={() => setFocus(g.id)}>
              {g.label}
            </Pill>
          ))}
        </div>
      </fieldset>
      {create.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {gdpiErrorMessage(create.error, 'Could not start the interview.')}
        </p>
      )}
      <button
        type="button"
        disabled={create.isPending}
        onClick={() =>
          create.mutate({ kind: 'pi', background, focus }, { onSuccess: (session) => onStarted(session.id) })
        }
        className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {create.isPending ? 'Starting…' : 'Start mock interview'}
      </button>
    </section>
  );
}

function Guidance({ item }: { item: GdpiItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-[var(--neutral-50)] p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between font-[Poppins] text-[13px] font-semibold text-[var(--ink)]"
      >
        What the panel is looking for
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3">
          <ItemGuidance item={item} />
        </div>
      )}
    </div>
  );
}

function QuestionStep({
  session,
  index,
  answer,
  remaining,
  onSubmitted,
  onNext,
}: {
  session: GdpiSession;
  index: number;
  answer: SessionAnswer | undefined;
  remaining: number | null;
  onSubmitted: (remaining: number) => void;
  onNext: () => void;
}) {
  const question = session.questions[index];
  const [text, setText] = useState(answer?.answerText ?? '');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const submit = useSubmitGdpiAnswer();
  const voice = useSubmitGdpiVoiceAnswer();
  const trimmed = text.trim();
  const last = index === session.questions.length - 1;

  const send = (answerText: string) =>
    submit.mutate(
      { sessionId: session.id, questionId: question.id, answerText },
      { onSuccess: (res) => onSubmitted(res.remainingToday) },
    );

  const sendVoice = (audio: Blob, durationSeconds: number) =>
    voice.mutate(
      {
        sessionId: session.id,
        questionId: question.id,
        audio,
        durationSeconds,
      },
      { onSuccess: (res) => onSubmitted(res.remainingToday) },
    );

  return (
    <article className="ss-panel space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <GroupChip group={question.group} />
        <span className="ml-auto font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]">
          Question {index + 1} of {session.questions.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--neutral-100)]" aria-hidden>
        <div
          className="h-full rounded-full bg-[var(--brand-purple-500)]"
          style={{
            width: `${((index + (answer ? 1 : 0)) / session.questions.length) * 100}%`,
          }}
        />
      </div>
      <h2 className="ss-display text-[19px] leading-snug text-[var(--ink)] md:text-[22px]">{question.prompt}</h2>

      {answer ? (
        <>
          <div className="rounded-xl border border-[var(--borders-default)] bg-white p-3">
            <p className="ss-eyebrow text-[var(--neutral-500)]">
              {answer.mode === 'voice' ? 'What we heard' : 'Your answer'} · {answer.wordCount} words
            </p>
            <p className="mt-1 whitespace-pre-wrap font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">
              {answer.answerText}
            </p>
          </div>
          {answer.delivery && <DeliveryCard delivery={answer.delivery} />}
          <FeedbackCard feedback={answer.feedback} />
          {remaining !== null && (
            <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{remaining} AI feedback left today</p>
          )}
          {submit.isError && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
              {gdpiErrorMessage(submit.error, 'Could not get feedback.')}
            </p>
          )}
          <Guidance item={question} />
          <div className="flex flex-wrap gap-2">
            {answer.feedback.fallback && (
              <button
                type="button"
                disabled={submit.isPending}
                onClick={() => send(answer.answerText)}
                className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[13px] font-semibold disabled:opacity-50"
              >
                {submit.isPending ? 'Getting feedback…' : 'Try feedback again'}
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="btn-primary ml-auto cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
            >
              {last ? 'See session summary' : 'Next question'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div role="group" aria-label="How do you want to answer?" className="flex flex-wrap gap-2">
            <Pill active={mode === 'text'} onClick={() => setMode('text')}>
              Type
            </Pill>
            <Pill active={mode === 'voice'} onClick={() => setMode('voice')}>
              Speak
            </Pill>
          </div>
          {mode === 'voice' ? (
            <>
              <VoiceAnswer pending={voice.isPending} disabled={mbaStatus(voice.error) === 429} onSend={sendVoice} />
              {voice.isError && (
                <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
                  {gdpiErrorMessage(voice.error, 'Could not get feedback on your recording.')}
                </p>
              )}
            </>
          ) : (
            <>
              <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
                Your answer
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  maxLength={PI_MAX_CHARS}
                  disabled={submit.isPending}
                  placeholder="Type your answer as you would say it to the panel."
                  className="mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-3 text-[14px] font-normal leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)] disabled:bg-[var(--neutral-50)]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
                <span>{wordCount(text)} words</span>
                <span>
                  {text.length.toLocaleString('en-IN')}/{PI_MAX_CHARS.toLocaleString('en-IN')} characters
                </span>
              </div>
              {submit.isError && (
                <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
                  {gdpiErrorMessage(submit.error, 'Could not get feedback.')}
                </p>
              )}
              <button
                type="button"
                disabled={trimmed.length < MIN_ANSWER_CHARS || submit.isPending || mbaStatus(submit.error) === 429}
                onClick={() => send(trimmed)}
                className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submit.isPending ? 'Getting feedback…' : 'Submit for feedback'}
              </button>
            </>
          )}
        </>
      )}
    </article>
  );
}

function Summary({ session, onRestart }: { session: GdpiSession; onRestart: () => void }) {
  const { summary } = session;
  return (
    <div className="space-y-4">
      <section className="ss-panel space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ss-eyebrow text-[var(--neutral-500)]">Session summary</p>
            <h2 className="ss-display mt-1 text-[20px] text-[var(--ink)]">{session.title}</h2>
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              {summary.answered} of {summary.total} questions answered
            </p>
          </div>
          {summary.overall !== null && (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              Average{' '}
              <strong className="ss-display block text-[28px] text-[var(--ink)]">{summary.overall.toFixed(1)}/5</strong>
            </p>
          )}
        </div>
        {summary.averageScores && <ScoreBars scores={summary.averageScores} />}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            Start another mock
          </button>
          <Link
            to="/mba/gdpi?tab=history"
            className="btn-secondary px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            All my sessions
          </Link>
          <Link
            to="/mba/shortlist?request=mock_interview#counsellor"
            className="btn-secondary px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            Book a mock with a counsellor
          </Link>
        </div>
      </section>
      {session.questions.map((q, i) => {
        const answer = session.answers.find((a) => a.questionId === q.id);
        return (
          <details key={q.id} className="ss-panel p-4 md:p-5">
            <summary className="cursor-pointer list-none">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]">Q{i + 1}</span>
                <GroupChip group={q.group} />
                {answer?.feedback.scores && (
                  <span className="ml-auto font-[Poppins] text-[12px] font-bold text-[var(--ink)]">
                    {(
                      (answer.feedback.scores.structure +
                        answer.feedback.scores.clarity +
                        answer.feedback.scores.relevance +
                        answer.feedback.scores.completeness) /
                      4
                    ).toFixed(1)}
                    /5
                  </span>
                )}
              </span>
              <span className="mt-1.5 flex items-start justify-between gap-3 font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
                {q.prompt}
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neutral-500)]" aria-hidden />
              </span>
            </summary>
            {answer ? (
              <div className="mt-3 space-y-3">
                <p className="whitespace-pre-wrap font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">
                  {answer.answerText}
                </p>
                {answer.delivery && <DeliveryCard delivery={answer.delivery} />}
                <FeedbackCard feedback={answer.feedback} />
              </div>
            ) : (
              <p className="mt-3 font-[Poppins] text-[12px] text-[var(--neutral-500)]">Not answered.</p>
            )}
          </details>
        );
      })}
    </div>
  );
}

function Runner({ session, onRestart }: { session: GdpiSession; onRestart: () => void }) {
  const firstOpen = session.questions.findIndex((q) => !session.answers.some((a) => a.questionId === q.id));
  // The step on screen: stays on a just-answered question (to read its feedback) until "Next".
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const index = viewIndex ?? firstOpen;

  if (index === -1 || index >= session.questions.length) return <Summary session={session} onRestart={onRestart} />;
  const question = session.questions[index];
  const answer = session.answers.find((a) => a.questionId === question.id);
  return (
    <QuestionStep
      key={question.id}
      session={session}
      index={index}
      answer={answer}
      remaining={remaining}
      onSubmitted={(left) => {
        setRemaining(left);
        setViewIndex(index);
      }}
      onNext={() => setViewIndex(index + 1 < session.questions.length ? index + 1 : session.questions.length)}
    />
  );
}

export default function MbaGdpiInterview() {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const query = useGdpiSession(sessionId);

  let body;
  if (!sessionId) body = <Setup onStarted={(id) => setParams({ session: id }, { replace: true })} />;
  else if (query.isPending) body = <Skeleton rows={2} />;
  else if (query.isError)
    body = (
      <StateBlock
        tone="error"
        title={mbaStatus(query.error) === 404 ? 'Session not found' : "Couldn't load this session"}
        detail={gdpiErrorMessage(query.error, 'Please try again.')}
        action={{ label: 'Start a new mock', onClick: () => setParams({}) }}
      />
    );
  else if (query.data.kind !== 'pi')
    body = (
      <StateBlock
        tone="info"
        title="This is a WAT session"
        action={{
          label: 'Open it',
          href: `/mba/gdpi/wat?session=${query.data.id}`,
        }}
      />
    );
  else body = <Runner key={query.data.id} session={query.data} onRestart={() => setParams({})} />;

  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <BackLink />
      <SkyBanner
        eyebrow="AI mock interview"
        title="Practise your personal interview"
        lead="Answer honestly and specifically — the feedback only uses what you write."
      />
      {body}
    </div>
  );
}
