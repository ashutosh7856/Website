import { Link } from 'react-router-dom';
import { SectionChip } from '@/components/mba/ui';
import { formatPercent } from '@/components/mba/format';
import { isAppPath } from '@/api/mbaInsights';
import { useMbaConfidence } from '@/api/mbaDrills';
import { CONFIDENCE_LABEL } from './confidenceLabels';

/** Insights card: how well the student's "sure / not sure / guess" ratings match their results. */
export default function ConfidenceCard() {
  const { data, isPending, isError } = useMbaConfidence();
  if (isPending || isError) return null;

  return (
    <section className="ss-panel space-y-3 p-4" aria-labelledby="confidence-insights-heading">
      <h2 id="confidence-insights-heading" className="ss-display text-[17px] text-[var(--ink)]">
        How sure you were
      </h2>
      {data.ratedAnswers === 0 ? (
        <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">
          Tap “Sure”, “Not sure” or “Guess” after answering in practice or a mock. You’ll see here where you are overconfident and which right
          answers were lucky guesses.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {data.levels.map((l) => (
              <div key={l.level} className="rounded-xl bg-[var(--neutral-50)] px-3 py-2">
                <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{CONFIDENCE_LABEL[l.level]}</p>
                <p className="ss-data mt-0.5 text-[16px] text-[var(--ink)]">{formatPercent(l.accuracy === null ? null : l.accuracy * 100)}</p>
                <p className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">
                  {l.correct}/{l.answers} right
                </p>
              </div>
            ))}
          </div>
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-700)]">
            Sure but wrong: <span className="font-semibold">{data.sureButWrong}</span> · Lucky guesses:{' '}
            <span className="font-semibold">{data.luckyGuesses}</span>
            {data.luckyGuessQuestions > 0 && (
              <>
                {' '}
                — {data.luckyGuessQuestions} come back in your{' '}
                <Link to="/mba/mocks/build" className="font-semibold text-[var(--brand-purple-700)]">
                  weak-topics set
                </Link>
                .
              </>
            )}
          </p>
          {data.topics.length > 0 && (
            <ul className="divide-y divide-[var(--borders-default)]">
              {data.topics.map((t) => (
                <li key={`${t.section}-${t.topic}`} className="flex flex-wrap items-center gap-2 py-2 font-[Poppins] text-[12px]">
                  <SectionChip section={t.section} />
                  <span className="font-semibold text-[var(--ink)]">{t.topic}</span>
                  <span className="text-[var(--neutral-500)]">
                    {t.sureButWrong} sure but wrong · {t.luckyGuesses} lucky
                  </span>
                  {isAppPath(t.href) && (
                    <Link to={t.href} className="ml-auto font-semibold text-[var(--brand-purple-700)]">
                      Practise
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
