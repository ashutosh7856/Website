import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, FileText, X } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { formatDate } from '@/components/mba/format';
import ShellPortal from '@/components/mba/ShellPortal';
import { mbaErrorMessage, useMbaAttempts, useMbaTests, type MbaTest } from '@/api/mba';

function StartPanel({ test, resuming, onClose }: { test: MbaTest; resuming: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <ShellPortal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal aria-labelledby="mba-start-title">
      <div className="ss-panel w-full max-w-[520px] rounded-b-none p-5 sm:rounded-b-[inherit] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="mba-start-title" className="ss-display text-[19px] text-[var(--ink)]">
            {resuming ? 'Resume' : 'Start'} {test.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-lg p-1 hover:bg-[var(--neutral-100)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
          <li>
            {test.questionCount} questions · {test.durationMinutes} minutes · sections: {test.sections.join(', ')}.
          </li>
          <li>Each section has its own timer. When it runs out, the section is submitted for you and the next one opens.</li>
          <li>Your answers save automatically. If you close the tab or lose connection, come back and resume where you left off — the clock keeps running.</li>
          <li>Answers and solutions appear only after you submit the whole test. The AI tutor is not available during a mock.</li>
        </ul>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold">
            Not now
          </button>
          <button
            type="button"
            onClick={() => navigate(`/mba/exam/${encodeURIComponent(test.id)}`)}
            className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
          >
            {resuming ? 'Resume test' : 'Start test'}
          </button>
        </div>
      </div>
    </div>
    </ShellPortal>
  );
}

export default function MbaMocks() {
  const tests = useMbaTests();
  const attempts = useMbaAttempts();
  const [selected, setSelected] = useState<MbaTest | null>(null);

  const inProgress = new Set(
    (attempts.data?.attempts ?? []).filter((a) => a.status === 'in_progress').map((a) => a.testId),
  );
  const past = (attempts.data?.attempts ?? []).filter((a) => a.status === 'submitted');

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="Mock tests"
        title="Real CAT papers, real timing"
        lead="Full mocks and sectionals built from official CAT papers, scored with the official marking scheme."
      />

      {tests.isPending ? (
        <Skeleton rows={3} />
      ) : tests.isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load mock tests"
          detail={mbaErrorMessage(tests.error)}
          action={{ label: 'Try again', onClick: () => void tests.refetch() }}
        />
      ) : tests.data.tests.length === 0 ? (
        <StateBlock
          tone="empty"
          title="Mocks are being prepared"
          detail="We're building mocks from official CAT papers. They'll appear here as soon as each paper is checked and published."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.data.tests.map((t) => {
            const resuming = inProgress.has(t.id);
            return (
              <article key={t.id} className="ss-panel flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--brand-purple-50)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--brand-purple-700)]">
                    {t.kind === 'full_mock' ? 'Full mock' : 'Sectional'}
                  </span>
                  {resuming && (
                    <span className="rounded-full bg-[var(--gold-100)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--gold-600)]">
                      In progress
                    </span>
                  )}
                </div>
                <h3 className="ss-display text-[16px] text-[var(--ink)]">{t.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {t.sections.map((s) => (
                    <SectionChip key={s} section={s} />
                  ))}
                </div>
                <p className="flex items-center gap-3 font-[Poppins] text-[12px] text-[var(--neutral-500)]">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {t.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {t.durationMinutes} min
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className={`${resuming ? 'btn-gold text-white' : 'btn-primary'} mt-auto cursor-pointer rounded-xl px-4 py-2.5 font-[Poppins] text-[13px] font-semibold`}
                >
                  {resuming ? 'Resume' : 'Start'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <section className="ss-panel p-5">
        <h2 className="ss-display text-[17px] text-[var(--ink)]">Your results</h2>
        {attempts.isPending ? (
          <div className="mt-3">
            <Skeleton rows={1} />
          </div>
        ) : attempts.isError ? (
          <p role="alert" className="mt-2 font-[Poppins] text-[13px] text-[var(--red-500)]">
            {mbaErrorMessage(attempts.error)}
          </p>
        ) : past.length === 0 ? (
          <p className="mt-2 font-[Poppins] text-[13px] text-[var(--neutral-500)]">Submitted mocks will be listed here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--borders-default)]">
            {past.map((a) => (
              <li key={a.id}>
                <Link to={`/mba/results/${a.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{a.title}</span>
                    <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">{formatDate(a.submittedAt)}</span>
                  </span>
                  {a.score != null && a.maxScore != null && (
                    <span className="ss-data text-[16px] text-[var(--ink)]">
                      {a.score}
                      <span className="text-[12px] text-[var(--neutral-400)]">/{a.maxScore}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && <StartPanel test={selected} resuming={inProgress.has(selected.id)} onClose={() => setSelected(null)} />}
    </div>
  );
}
