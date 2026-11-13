import { Link } from 'react-router-dom';
import { examLabel, type ExamId } from '@/api/mba';

/** Exam chips (only when the student targets more than CAT) or a nudge to add exams. */
export default function ExamSwitcher({
  examId,
  options,
  onChange,
}: {
  examId: ExamId;
  options: ExamId[];
  onChange: (id: ExamId) => void;
}) {
  if (options.length < 2)
    return (
      <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
        Preparing for XAT, SNAP, NMAT or CMAT too?{' '}
        <Link to="/mba/profile" className="font-semibold text-[var(--brand-purple-700)] underline">
          Add your exams in your profile
        </Link>
        .
      </p>
    );
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Exam">
      {options.map((id) => {
        const active = id === examId;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold whitespace-nowrap"
            style={{
              borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
              background: active ? 'var(--brand-purple-500)' : '#fff',
              color: active ? '#fff' : 'var(--neutral-600)',
            }}
          >
            {examLabel(id)}
          </button>
        );
      })}
    </div>
  );
}
