import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, ExternalLink, Lightbulb, XCircle } from 'lucide-react';
import {
  mbaErrorMessage,
  mbaStatus,
  useBookmark,
  useHint,
  usePracticeAnswer,
  type HintLevel,
  type HintResponse,
  type PracticeAnswerResult,
  type QuestionPublic,
  type QuestionSet,
  type SectionId,
  type Source,
} from '@/api/mba';
import { SECTION_SHORT, SECTION_TONE, sanitizeHtml } from './format';

// ── Basics ────────────────────────────────────────────────────────────────────

/** Sanitised HTML. Never pass API HTML to dangerouslySetInnerHTML directly. */
export function SafeHtml({
  html,
  className = '',
  as: Tag = 'div',
}: {
  html: string | undefined | null;
  className?: string;
  /** `span` where the HTML sits inside a button. */
  as?: 'div' | 'span';
}) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <Tag
      className={`mba-html font-[Poppins] text-[14px] leading-relaxed break-words [&_pre]:overflow-x-auto text-[var(--neutral-800)] [&_img]:max-w-full [&_img]:h-auto [&_p]:mb-2 [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-[var(--borders-default)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--borders-default)] [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export function StateBlock({
  tone,
  title,
  detail,
  action,
}: {
  tone: 'empty' | 'error' | 'info';
  title: string;
  detail?: string;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  const icon = tone === 'error' ? '⚠️' : tone === 'empty' ? '📚' : 'ℹ️';
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className="ss-panel mx-auto flex max-w-[640px] flex-col items-center gap-2 p-8 text-center"
    >
      <span className="text-[28px]" aria-hidden>
        {icon}
      </span>
      <h2 className="ss-display text-[18px] text-[var(--ink)]">{title}</h2>
      {detail && (
        <p className="font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-500)]">{detail}</p>
      )}
      {action &&
        (action.href ? (
          <Link to={action.href} className="btn-primary mt-2 px-5 py-2.5 font-[Poppins] text-[13px] font-semibold">
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="btn-primary mt-2 cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-[96px] animate-pulse rounded-[16px] bg-[#EDEFF6]" />
      ))}
    </div>
  );
}

export function SectionChip({ section }: { section: SectionId }) {
  const tone = SECTION_TONE[section];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {SECTION_SHORT[section]}
    </span>
  );
}

export function SourceLine({
  source,
  year,
  slot,
}: {
  source?: Source | null;
  year?: number | null;
  slot?: number | null;
}) {
  if (!source) return null;
  const meta = [year ? `CAT ${year}` : null, slot ? `Slot ${slot}` : null].filter(Boolean).join(' · ');
  if (source.kind === 'original') {
    // Written by ProCounsel faculty, not taken from an official paper.
    return (
      <p className="flex flex-wrap items-center gap-1.5 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
        <span className="rounded-full bg-[var(--brand-purple-50)] px-2 py-0.5 font-semibold text-[var(--brand-purple-700)]">
          ProCounsel original
        </span>
        {source.title}
      </p>
    );
  }
  return (
    <p className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
      {meta && <span>{meta} · </span>}
      Source:{' '}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 underline decoration-dotted"
        >
          {source.title}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        source.title
      )}
    </p>
  );
}

export function SetPanel({ set }: { set: QuestionSet }) {
  const label = set.kind === 'passage' ? 'Passage' : set.kind === 'dilr_set' ? 'Set' : 'Data';
  return (
    <section className="ss-panel max-h-[70vh] overflow-y-auto p-4 md:p-5" aria-label={label}>
      <p className="ss-eyebrow text-[var(--neutral-400)]">{label}</p>
      {set.title && <h3 className="ss-display mt-1 text-[15px] text-[var(--ink)]">{set.title}</h3>}
      <SafeHtml html={set.contentHtml} className="mt-2" />
      {set.images?.map((src) => (
        <img key={src} src={src} alt="" className="mt-3 max-w-full rounded-lg" loading="lazy" />
      ))}
    </section>
  );
}

// ── Answer input ──────────────────────────────────────────────────────────────

export type RevealState = { correctAnswer: string; yourAnswer: string | null } | null;

/**
 * MCQ options or a TITA box. With `reveal`, options are coloured: the correct
 * one green, a wrong pick red. Disabled once revealed.
 */
export function AnswerInput({
  question,
  value,
  onChange,
  reveal = null,
  disabled = false,
}: {
  question: QuestionPublic;
  value: string | null;
  onChange: (next: string | null) => void;
  reveal?: RevealState;
  disabled?: boolean;
}) {
  const locked = disabled || !!reveal;

  if (question.type === 'TITA') {
    return (
      <div className="space-y-2">
        <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Type your answer
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value ?? ''}
            disabled={locked}
            onChange={(e) => {
              const next = e.target.value.replace(/[^0-9.\-/]/g, '');
              onChange(next === '' ? null : next);
            }}
            className="mt-1.5 block w-full max-w-[260px] rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[15px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)] disabled:bg-[var(--neutral-50)]"
          />
        </label>
        {reveal && (
          <p className="font-[Poppins] text-[13px]">
            <span className="text-[var(--neutral-500)]">Correct answer: </span>
            <strong className="text-[var(--green-600)]">{reveal.correctAnswer}</strong>
            {reveal.yourAnswer !== null && reveal.yourAnswer !== reveal.correctAnswer && (
              <>
                <span className="text-[var(--neutral-500)]"> · Yours: </span>
                <strong className="text-[var(--red-500)]">{reveal.yourAnswer}</strong>
              </>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2" role="radiogroup" aria-label="Options">
      {(question.options ?? []).map((option, index) => {
        const selected = value === option.id;
        const isCorrect = reveal?.correctAnswer === option.id;
        const isWrongPick = !!reveal && reveal.yourAnswer === option.id && !isCorrect;
        const border = isCorrect
          ? 'var(--green-500)'
          : isWrongPick
            ? 'var(--red-500)'
            : selected
              ? 'var(--brand-purple-500)'
              : 'var(--borders-default)';
        const bg = isCorrect
          ? 'var(--green-50)'
          : isWrongPick
            ? 'var(--red-100)'
            : selected
              ? 'var(--brand-purple-50)'
              : '#fff';
        return (
          <li key={option.id}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={locked}
              onClick={() => onChange(selected ? null : option.id)}
              className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-colors disabled:cursor-default"
              style={{ borderColor: border, background: bg }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-[Poppins] text-[12px] font-bold"
                style={{
                  background: selected || isCorrect ? border : 'var(--neutral-100)',
                  color: selected || isCorrect ? '#fff' : 'var(--neutral-600)',
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <SafeHtml as="span" html={option.textHtml} className="block min-w-0 flex-1 pt-0.5" />
              {isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--green-600)]" />}
              {isWrongPick && <XCircle className="h-5 w-5 shrink-0 text-[var(--red-500)]" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ── AI hint ───────────────────────────────────────────────────────────────────

const HINT_LEVELS: { level: HintLevel; label: string }[] = [
  { level: 1, label: 'Nudge' },
  { level: 2, label: 'Approach' },
  { level: 3, label: 'Full explanation' },
];

function hintErrorMessage(err: unknown): string {
  switch (mbaStatus(err)) {
    case 429:
      return "Daily hint limit reached. Hints reset tomorrow.";
    case 403:
      return mbaErrorMessage(err, 'Hints open once you have answered this question outside a live mock.');
    case 503:
      return 'The AI tutor is not available right now. Please try again later.';
    default:
      return mbaErrorMessage(err, 'The tutor is unavailable right now.');
  }
}

/**
 * "Get a hint" — only rendered once the student has answered (the API refuses
 * otherwise, and never during a live mock).
 */
export function HintPanel({ questionId, studentAnswer }: { questionId: string; studentAnswer?: string | null }) {
  const hint = useHint();
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const remaining = hints.length ? hints[hints.length - 1].remainingToday : null;
  const [limitHit, setLimitHit] = useState(false);
  const outOfQuota = limitHit || (remaining !== null && remaining <= 0);

  const ask = (level: HintLevel) => {
    setError(null);
    hint.mutate(
      { questionId, level, studentAnswer: studentAnswer ?? undefined },
      {
        onSuccess: (res) => setHints((prev) => [...prev.filter((h) => h.level !== res.level), res]),
        onError: (err) => {
          if (mbaStatus(err) === 429) setLimitHit(true);
          setError(hintErrorMessage(err));
        },
      },
    );
  };

  return (
    <section className="rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 font-[Poppins] text-[13px] font-bold text-[var(--ink)]">
          <Lightbulb className="h-4 w-4 text-[var(--gold-500)]" />
          Get a hint
        </h4>
        {remaining !== null && (
          <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            {remaining} left today
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {HINT_LEVELS.map(({ level, label }) => (
          <button
            key={level}
            type="button"
            disabled={hint.isPending || outOfQuota}
            onClick={() => ask(level)}
            className="btn-secondary cursor-pointer px-3 py-1.5 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {level}. {label}
          </button>
        ))}
      </div>
      {hint.isPending && (
        <p className="mt-3 font-[Poppins] text-[12px] text-[var(--neutral-500)]" aria-live="polite">
          Thinking…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}
      {hints
        .slice()
        .sort((a, b) => a.level - b.level)
        .map((h) => (
          <div key={h.level} className="mt-3 rounded-xl bg-white p-3">
            <p className="ss-eyebrow text-[var(--brand-purple-600)]">
              Level {h.level} · {HINT_LEVELS[h.level - 1]?.label}
            </p>
            <p className="mt-1 whitespace-pre-wrap font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">
              {h.text}
            </p>
          </div>
        ))}
    </section>
  );
}

// ── Practice question card ────────────────────────────────────────────────────

/**
 * One practice question end to end: answer → submit → reveal + solution,
 * bookmark, and the AI hint once answered. Key it by question id so state
 * resets between questions.
 */
export function PracticeQuestionCard({
  question,
  index,
  total,
  initialBookmarked = false,
  onAnswered,
  footer,
}: {
  question: QuestionPublic;
  index?: number;
  total?: number;
  initialBookmarked?: boolean;
  onAnswered?: (result: PracticeAnswerResult) => void;
  footer?: ReactNode;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<PracticeAnswerResult | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string | null>(null);
  const shownAt = useRef(Date.now());
  const submit = usePracticeAnswer();
  const bookmark = useBookmark();

  const onSubmit = () => {
    if (answer === null) return;
    setError(null);
    const sent = answer;
    submit.mutate(
      { questionId: question.id, answer: sent, timeSpentMs: Date.now() - shownAt.current },
      {
        onSuccess: (res) => {
          setResult(res);
          setSubmittedAnswer(sent);
          onAnswered?.(res);
        },
        onError: (err) =>
          setError(
            mbaStatus(err) === 403
              ? "This question is part of a mock you're taking — finish your mock first, then practise it here."
              : mbaErrorMessage(err, 'Could not submit your answer.'),
          ),
      },
    );
  };

  const toggleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    bookmark.mutate(
      { questionId: question.id, on: next },
      {
        onSuccess: (res) => setBookmarked(res.bookmarked),
        onError: () => setBookmarked(!next),
      },
    );
  };

  const correct = result
    ? (result.isCorrect ?? submittedAnswer === result.correctAnswer)
    : null;

  const body = (
    <div className="ss-panel space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <SectionChip section={question.section} />
        {question.topic && (
          <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            {question.topic}
            {question.subtopic ? ` · ${question.subtopic}` : ''}
          </span>
        )}
        <span className="font-[Poppins] text-[11px] text-[var(--neutral-400)]">
          {question.type === 'TITA' ? 'Type in the answer' : 'MCQ'}
        </span>
        {index !== undefined && total !== undefined && (
          <span className="ml-auto font-[Poppins] text-[11px] font-semibold text-[var(--neutral-500)]">
            {index + 1} / {total}
          </span>
        )}
        <button
          type="button"
          onClick={toggleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
          className={`${index === undefined ? 'ml-auto' : ''} cursor-pointer rounded-lg p-1.5 text-[var(--brand-purple-600)] hover:bg-[var(--brand-purple-50)]`}
        >
          {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </div>

      <SafeHtml html={question.stemHtml} />

      <AnswerInput
        question={question}
        value={result ? submittedAnswer : answer}
        onChange={setAnswer}
        reveal={result ? { correctAnswer: result.correctAnswer, yourAnswer: submittedAnswer } : null}
      />

      {error && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}

      {!result ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={answer === null || submit.isPending}
          className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submit.isPending ? 'Checking…' : 'Submit answer'}
        </button>
      ) : (
        <div className="space-y-3">
          <p
            className="flex items-center gap-2 font-[Poppins] text-[14px] font-bold"
            style={{ color: correct ? 'var(--green-600)' : 'var(--red-500)' }}
            aria-live="polite"
          >
            {correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {correct ? 'Correct' : 'Not quite'}
            <span className="font-normal text-[12px] text-[var(--neutral-500)]">
              · {result.stats.correct}/{result.stats.attempts} correct on this question so far
            </span>
          </p>
          {result.solutionHtml ? (
            <div className="rounded-xl bg-[var(--neutral-50)] p-4">
              <p className="ss-eyebrow text-[var(--neutral-500)]">Solution</p>
              <SafeHtml html={result.solutionHtml} className="mt-1" />
            </div>
          ) : (
            <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              No official solution is available for this question.
            </p>
          )}
          <HintPanel questionId={question.id} studentAnswer={submittedAnswer} />
        </div>
      )}

      <SourceLine source={question.source} year={question.year} slot={question.slot} />
      {footer}
    </div>
  );

  if (!question.set) return body;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SetPanel set={question.set} />
      {body}
    </div>
  );
}
