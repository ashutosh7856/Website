import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { DoubtThreadView } from '@/components/mba/Doubts';
import { mbaErrorMessage, mbaStatus } from '@/api/mba';
import { useDoubt } from '@/api/mbaCommunity';

/** /mba/community/doubts/:doubtId — one doubt or study-group post with its replies. */
export default function MbaDoubt() {
  const { doubtId = '' } = useParams();
  const doubt = useDoubt(doubtId);

  if (doubt.isPending) return <Skeleton rows={3} />;
  if (doubt.isError) {
    const status = mbaStatus(doubt.error);
    return (
      <StateBlock
        tone={status === 403 || status === 404 ? 'info' : 'error'}
        title={status === 404 ? "This post isn't available" : status === 403 ? "You can't open this yet" : "Couldn't load this post"}
        detail={status === 404 ? 'It may have been removed by a moderator.' : mbaErrorMessage(doubt.error)}
        action={status === 403 || status === 404 ? { label: 'Back to community', href: '/mba/community' } : { label: 'Try again', onClick: () => void doubt.refetch() }}
      />
    );
  }

  const d = doubt.data;
  const back =
    d.scope === 'question' && d.questionId
      ? { to: `/mba/community/questions/${encodeURIComponent(d.questionId)}`, label: 'All doubts on this question' }
      : { to: '/mba/community?tab=group', label: 'Back to your study group' };

  return (
    <div className="mx-auto max-w-[880px] space-y-4">
      <Link to={back.to} className="inline-flex items-center gap-1.5 font-[Poppins] text-[13px] font-semibold text-[var(--brand-purple-700)]">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {back.label}
      </Link>
      {d.questionPreview && (
        <p className="rounded-2xl bg-[var(--neutral-50)] px-4 py-3 font-[Poppins] text-[13px] text-[var(--neutral-600)]">
          <span className="font-semibold text-[var(--neutral-700)]">Question: </span>
          {d.questionPreview}
        </p>
      )}
      <DoubtThreadView doubt={d} />
    </div>
  );
}
