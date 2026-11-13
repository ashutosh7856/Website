import { Link, useNavigate, useParams } from 'react-router-dom';
import SkyBanner from '@/components/school-student/SkyBanner';
import { HintPanel, SafeHtml, SectionChip, Skeleton, StateBlock } from '@/components/mba/ui';
import { PostForm, ThreadList } from '@/components/mba/Doubts';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import { useAskDoubt, useQuestionDoubts } from '@/api/mbaCommunity';

/**
 * /mba/community/questions/:questionId — every doubt on one question, the AI
 * tutor ("ask AI first", same daily quota) and the form to ask a new doubt.
 * Open only once the student has seen the question's answer (server rule).
 */
export default function MbaQuestionDoubts() {
  const { questionId = '' } = useParams();
  const navigate = useNavigate();
  const doubts = useQuestionDoubts(questionId);
  const ask = useAskDoubt(questionId);

  if (doubts.isPending) return <Skeleton rows={3} />;
  if (doubts.isError) {
    const status = mbaStatus(doubts.error);
    return (
      <StateBlock
        tone={status === 403 ? 'info' : 'error'}
        title={status === 403 ? 'Answer this question first' : status === 404 ? 'Question not found' : "Couldn't load doubts"}
        detail={
          status === 403
            ? "Doubts open once you've answered the question in practice, or seen it in a submitted mock — so nobody spoils it for you."
            : mbaErrorMessage(doubts.error)
        }
        action={status === 403 || status === 404 ? { label: 'Go to practice', href: '/mba/practice' } : { label: 'Try again', onClick: () => void doubts.refetch() }}
      />
    );
  }

  const { question, threads } = doubts.data;

  return (
    <div className="mx-auto max-w-[880px] space-y-5">
      <SkyBanner
        eyebrow="Community"
        title="Doubts on this question"
        lead="Ask what you didn't get. Other students can answer, and our faculty answer anything still open after a day."
      />

      <section className="ss-panel space-y-3 p-4 md:p-5" aria-label="The question">
        <div className="flex flex-wrap items-center gap-2">
          {question.section && <SectionChip section={question.section} />}
          {question.number !== null && (
            <span className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]">Question {question.number}</span>
          )}
        </div>
        <SafeHtml html={question.stemHtml} className="max-h-[220px] overflow-y-auto" />
      </section>

      <section className="ss-panel space-y-3 p-4 md:p-5" aria-labelledby="ai-first-heading">
        <h2 id="ai-first-heading" className="ss-display text-[16px] text-[var(--ink)]">
          Ask the AI tutor first
        </h2>
        <p className="font-[Poppins] text-[13px] text-[var(--neutral-600)]">
          Often quicker: get a nudge, the approach or the full working. It uses your daily AI hint limit.
        </p>
        <HintPanel questionId={question.id} />
      </section>

      <section className="ss-panel p-4 md:p-5" aria-label="Ask a doubt">
        <PostForm
          label="Still stuck? Ask a doubt"
          placeholder="What exactly is unclear? e.g. why option B and not C, or which step you lost track of…"
          submitLabel="Post doubt"
          pending={ask.isPending}
          error={ask.error}
          onSubmit={(text, done) =>
            ask.mutate(text, {
              onSuccess: (d) => {
                done();
                navigate(`/mba/community/doubts/${encodeURIComponent(d.id)}`);
              },
            })
          }
        />
      </section>

      <section aria-labelledby="threads-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="threads-heading" className="ss-display text-[16px] text-[var(--ink)]">
            {threads.length === 0 ? 'No doubts yet' : `${threads.length} ${threads.length === 1 ? 'doubt' : 'doubts'} from students`}
          </h2>
          <Link to="/mba/community" className="font-[Poppins] text-[12px] font-semibold text-[var(--brand-purple-700)]">
            My doubts
          </Link>
        </div>
        <ThreadList threads={threads} emptyText="Be the first to ask. Others who got stuck here will thank you." />
      </section>
    </div>
  );
}
