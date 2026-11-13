import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import SkyBanner from '@/components/school-student/SkyBanner';
import { PracticeQuestionCard, Skeleton, StateBlock } from '@/components/mba/ui';
import { formatDate } from '@/components/mba/format';
import { mbaErrorMessage, mbaKeys, useMbaDaily } from '@/api/mba';
import DailyLeaderboard from '@/components/mba/DailyLeaderboard';
import { trackOnce } from '@/lib/analytics';
import { useAuthStore } from '@/store/AuthStore';

/**
 * The daily set — the same 5–10 official questions for everyone, each answered
 * through the normal practice endpoint.
 */
export default function MbaDaily() {
  const { data, isPending, isError, error, refetch } = useMbaDaily();
  const [index, setIndex] = useState(0);
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const finished = !!data && data.questions.length > 0 && data.completed >= data.questions.length;

  useEffect(() => {
    if (finished && data) trackOnce(`${userId ?? 'anon'}_${data.date}`, 'mba_daily_challenge_done', { questions: data.questions.length });
  }, [finished, data, userId]);

  if (isPending) return <Skeleton rows={2} />;
  if (isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load today's challenge"
        detail={mbaErrorMessage(error)}
        action={{ label: 'Try again', onClick: () => void refetch() }}
      />
    );

  const total = data.questions.length;
  const progress = total ? Math.min(100, (data.completed / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow={`Daily challenge · ${formatDate(data.date)}`}
        title="Today's set"
        lead="Same questions for every CAT aspirant today. A new set tomorrow."
        aside={
          total > 0 ? (
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-white">
              <p className="ss-data text-[28px] leading-none">
                {Math.min(data.completed, total)}/{total}
              </p>
              <p className="mt-1 font-[Poppins] text-[11px] text-white/70">done</p>
            </div>
          ) : undefined
        }
      />

      {total === 0 ? (
        <StateBlock
          tone="empty"
          title="Questions are being added"
          detail="Today's challenge draws from official CAT papers, which are still being loaded. Check back soon."
        />
      ) : (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--neutral-100)]" aria-hidden>
            <div className="h-full rounded-full bg-[var(--green-500)]" style={{ width: `${progress}%` }} />
          </div>
          <PracticeQuestionCard
            key={data.questions[index].id}
            question={data.questions[index]}
            index={index}
            total={total}
            onAnswered={() => {
              void qc.invalidateQueries({ queryKey: mbaKeys.daily });
              void qc.invalidateQueries({ queryKey: ['mba', 'leaderboard'] });
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="btn-secondary flex cursor-pointer items-center gap-1 px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index >= total - 1}
              className="btn-primary flex cursor-pointer items-center gap-1 px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <DailyLeaderboard />
        </>
      )}
    </div>
  );
}
