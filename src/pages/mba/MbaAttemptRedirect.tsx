import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { StateBlock } from '@/components/mba/ui';
import { mbaApi, mbaErrorMessage } from '@/api/mba';

/**
 * /mba/mocks/attempts/:attemptId — the link the dashboard priorities use.
 * Reads the attempt and forwards: submitted → its result, in progress → the
 * player (which resumes it via POST /attempts).
 */
export default function MbaAttemptRedirect() {
  const { attemptId = '' } = useParams();
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    mbaApi
      .getAttempt(attemptId)
      .then((a) => {
        if (ignore) return;
        setTarget(
          a.status === 'submitted' ? `/mba/results/${a.id}` : `/mba/exam/${encodeURIComponent(a.testId)}`,
        );
      })
      .catch((err) => {
        if (!ignore) setError(mbaErrorMessage(err, 'Could not open this attempt.'));
      });
    return () => {
      ignore = true;
    };
  }, [attemptId]);

  if (target) return <Navigate to={target} replace />;
  if (error)
    return (
      <StateBlock tone="error" title="Couldn't open this mock" detail={error} action={{ label: 'Back to mock tests', href: '/mba/mocks' }} />
    );
  return (
    <p className="py-10 text-center font-[Poppins] text-[13px] text-[var(--neutral-500)]" aria-busy>
      Opening your mock…
    </p>
  );
}
