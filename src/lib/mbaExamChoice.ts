import { useSearchParams } from 'react-router-dom';
import { useMbaShell } from '@/lib/mbaShellContext';
import { MBA_EXAMS, type ExamId } from '@/api/mba';

/**
 * Which exam a mocks / practice / insights page shows. The choices are CAT plus
 * the student's target exams (MBA profile); `?exam=` keeps the choice in the URL
 * so links from the mock analyst land on the right exam. CAT is the default.
 */
export function useExamChoice(): { examId: ExamId; options: ExamId[]; setExamId: (id: ExamId) => void } {
  const profile = useMbaShell()?.profile ?? null; // no shell context (e.g. a page rendered on its own): CAT only
  const [params, setParams] = useSearchParams();
  const targets = (profile?.targetExams ?? []).filter((id) => id !== 'cat');
  const options: ExamId[] = ['cat', ...targets];
  const wanted = params.get('exam');
  // A deep link to an exam outside the profile still works (e.g. from a result page).
  const examId = wanted && MBA_EXAMS.some((e) => e.id === wanted) ? wanted : 'cat';
  if (!options.includes(examId)) options.push(examId);
  const setExamId = (id: ExamId) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === 'cat') next.delete('exam');
        else next.set('exam', id);
        next.delete('section');
        next.delete('topic');
        return next;
      },
      { replace: true },
    );
  return { examId, options, setExamId };
}
