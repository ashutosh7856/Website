import { Link } from 'react-router-dom';
import { ArrowRight, Info, Sparkles } from 'lucide-react';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import {
  isAppPath,
  useAttemptAnalysis,
  useExplainAnalysis,
  type AiAnalysis,
  type DeterministicAnalysis,
  type QuestionRef,
} from '@/api/mbaInsights';
import { formatDuration, formatPercent, SECTION_SHORT } from './format';

const OUTCOME_LABEL = { correct: 'correct', incorrect: 'wrong', skipped: 'skipped' } as const;
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', unrated: 'Unrated' } as const;
const pct = (v: number | null) => formatPercent(v === null ? null : v * 100);
const qLabel = (q: QuestionRef) => `${SECTION_SHORT[q.section]} Q${q.number}`;

function explainError(err: unknown): string {
  switch (mbaStatus(err)) {
    case 429:
      return 'Daily AI limit reached. The numbers above are complete; try the explanation again tomorrow.';
    case 503:
      return 'The AI explanation is not available right now. Everything above is computed from your answers and stays accurate.';
    default:
      return mbaErrorMessage(err, 'Could not get the explanation.');
  }
}

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--borders-default)] p-4">
      <p className="ss-eyebrow text-[var(--neutral-500)]">{title}</p>
      <div className="mt-2 font-[Poppins] text-[13px] text-[var(--ink)]">{children}</div>
    </div>
  );
}

function Selection({ a }: { a: DeterministicAnalysis }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Fact title="Easy questions missed">
        {a.missedEasy.length === 0 ? (
          <p className="text-[var(--neutral-500)]">None. Every easy question you saw was answered correctly.</p>
        ) : (
          <ul className="space-y-1">
            {a.missedEasy.map((q) => (
              <li key={q.questionId} className="flex justify-between gap-2">
                <span className="font-semibold">{qLabel(q)}</span>
                <span className="text-[var(--neutral-500)]">
                  {OUTCOME_LABEL[q.outcome]}
                  {q.topic ? ` · ${q.topic}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Fact>
      <Fact title="Time sinks (over 2× section median)">
        {a.timeSinks.length === 0 ? (
          <p className="text-[var(--neutral-500)]">No wrong or skipped question took more than twice your usual time.</p>
        ) : (
          <ul className="space-y-1">
            {a.timeSinks.map((q) => (
              <li key={q.questionId} className="flex justify-between gap-2">
                <span className="font-semibold">{qLabel(q)}</span>
                <span className="text-[var(--neutral-500)]">
                  {formatDuration(q.timeSpentMs)} · {q.ratio}× · {OUTCOME_LABEL[q.outcome]}
                  {q.difficulty ? ` · ${q.difficulty}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Fact>
      <Fact title="Accuracy by difficulty">
        <ul className="space-y-1">
          {a.byDifficulty.map((d) => (
            <li key={d.difficulty} className="flex justify-between gap-2">
              <span className="font-semibold">{DIFFICULTY_LABEL[d.difficulty]}</span>
              <span className="text-[var(--neutral-500)]">
                {d.correct}/{d.attempted} · {pct(d.accuracy)} · {d.skipped} skipped
              </span>
            </li>
          ))}
        </ul>
      </Fact>
    </div>
  );
}

function Topics({ a }: { a: DeterministicAnalysis }) {
  const rows = a.byTopic.filter((t) => t.attempted > 0 || t.skipped > 0);
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] font-[Poppins] text-[13px]">
        <thead>
          <tr className="text-left text-[11px] text-[var(--neutral-500)]">
            <th className="py-2 pr-2 font-semibold">Topic</th>
            <th className="px-2 font-semibold">Section</th>
            <th className="px-2 font-semibold">Correct</th>
            <th className="px-2 font-semibold">Accuracy</th>
            <th className="px-2 font-semibold">Skipped</th>
            <th className="pl-2 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={`${t.section}-${t.topic}`} className="border-t border-[var(--borders-default)] text-[var(--ink)]">
              <td className="py-2 pr-2 font-semibold">{t.topic}</td>
              <td className="px-2">{SECTION_SHORT[t.section]}</td>
              <td className="px-2">
                {t.correct}/{t.attempted}
              </td>
              <td className="px-2">{pct(t.accuracy)}</td>
              <td className="px-2 text-[var(--neutral-500)]">{t.skipped}</td>
              <td className="pl-2">{formatDuration(t.timeSpentMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiBlock({ ai }: { ai: AiAnalysis }) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4">
      <p className="ss-eyebrow flex items-center gap-1.5 text-[var(--brand-purple-600)]">
        <Sparkles className="h-3.5 w-3.5" /> AI explanation of the numbers above
      </p>
      <p className="font-[Poppins] text-[14px] leading-relaxed text-[var(--neutral-800)]">{ai.summary}</p>
      {ai.strengths.length > 0 && (
        <div>
          <h4 className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">What went well</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 font-[Poppins] text-[13px] text-[var(--neutral-800)]">
            {ai.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h4 className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">Fix next</h4>
        <ol className="mt-2 space-y-2">
          {ai.priorities.map((p, i) => (
            <li key={`${p.title}-${i}`} className="rounded-xl bg-white p-3">
              <p className="flex items-start gap-2 font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-100)] text-[11px] font-bold text-[var(--brand-purple-700)]">
                  {i + 1}
                </span>
                {p.title}
              </p>
              {p.detail && <p className="mt-1 font-[Poppins] text-[12px] text-[var(--neutral-500)]">{p.detail}</p>}
              {p.nextSteps.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 font-[Poppins] text-[13px] text-[var(--neutral-800)]">
                  {p.nextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              {isAppPath(p.link.href) && (
                <Link
                  to={p.link.href}
                  className="mt-2 inline-flex items-center gap-1 font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]"
                >
                  {p.link.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
      {ai.selectionAdvice && (
        <div>
          <h4 className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">Question selection</h4>
          <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">{ai.selectionAdvice}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Result page: the question-selection analysis (computed by the server from
 * recorded answers and time) plus an optional AI explanation of it. The AI is
 * a layer on top — when it is unavailable the analysis still shows in full.
 */
export default function MockAnalyst({ attemptId }: { attemptId: string }) {
  const { data, isPending, isError, error, refetch } = useAttemptAnalysis(attemptId);
  const explain = useExplainAnalysis(attemptId);

  return (
    <section className="ss-panel space-y-4 p-4" aria-labelledby="analysis-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="analysis-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Mock analysis
        </h2>
        {data && !data.ai && (
          <button
            type="button"
            onClick={() => explain.mutate()}
            disabled={explain.isPending}
            className="btn-secondary flex cursor-pointer items-center gap-1.5 px-3 py-1.5 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {explain.isPending ? 'Explaining…' : 'Explain with AI'}
          </button>
        )}
      </div>
      {isPending ? (
        <div className="h-[120px] animate-pulse rounded-[16px] bg-[#EDEFF6]" aria-busy aria-label="Loading" />
      ) : isError ? (
        <p role="alert" className="font-[Poppins] text-[13px] text-[var(--red-500)]">
          {mbaErrorMessage(error, "Couldn't load the analysis.")}{' '}
          <button type="button" onClick={() => void refetch()} className="cursor-pointer font-semibold underline">
            Try again
          </button>
        </p>
      ) : (
        <>
          {data.analysis.lowEvidence && data.analysis.evidenceNote && (
            <p className="flex items-start gap-2 rounded-xl bg-[var(--gold-50)] p-3 font-[Poppins] text-[12px] text-[#92400E]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {data.analysis.evidenceNote}
            </p>
          )}
          <Selection a={data.analysis} />
          <Topics a={data.analysis} />
          {explain.isError && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
              {explainError(explain.error)}
            </p>
          )}
          {data.ai && <AiBlock ai={data.ai} />}
        </>
      )}
    </section>
  );
}
