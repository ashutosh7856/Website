import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import SkyBanner from '@/components/school-student/SkyBanner';
import { PracticeQuestionCard, Skeleton, StateBlock } from '@/components/mba/ui';
import { SECTION_SHORT } from '@/components/mba/format';
import {
  mbaErrorMessage,
  SECTIONS,
  useMbaPapers,
  useMbaQuestionPages,
  type PracticeFilter,
  type SectionId,
} from '@/api/mba';

const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unsolved', label: 'Unsolved' },
  { id: 'incorrect', label: 'Got wrong' },
  { id: 'bookmarked', label: 'Bookmarked' },
];

type Filters = { section?: SectionId; year?: number; slot?: number; filter: PracticeFilter };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold whitespace-nowrap"
      style={{
        borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
        background: active ? 'var(--brand-purple-500)' : '#fff',
        color: active ? '#fff' : 'var(--neutral-600)',
      }}
    >
      {children}
    </button>
  );
}

function QuestionStepper({ filters }: { filters: Filters }) {
  const query = useMbaQuestionPages({ ...filters, limit: 20 });
  const [index, setIndex] = useState(0);
  const questions = useMemo(() => query.data?.pages.flatMap((p) => p.questions) ?? [], [query.data]);

  if (query.isPending) return <Skeleton rows={2} />;
  if (query.isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load questions"
        detail={mbaErrorMessage(query.error)}
        action={{ label: 'Try again', onClick: () => void query.refetch() }}
      />
    );

  if (questions.length === 0) {
    const unfiltered = filters.filter === 'all' && !filters.section && !filters.year && !filters.slot;
    if (unfiltered)
      return (
        <StateBlock
          tone="empty"
          title="Questions are being added"
          detail="We're loading official CAT papers into the question bank and checking every answer against its source. Check back soon."
        />
      );
    const detail =
      filters.filter === 'bookmarked'
        ? 'Bookmark questions while you practise and they will collect here.'
        : filters.filter === 'incorrect'
          ? 'Nothing answered wrongly with these filters — nice.'
          : filters.filter === 'unsolved'
            ? "You've solved everything that matches these filters."
            : 'No questions match these filters yet. More papers are being added.';
    return <StateBlock tone="empty" title="Nothing here" detail={detail} />;
  }

  const safeIndex = Math.min(index, questions.length - 1);
  const question = questions[safeIndex];
  const atEnd = safeIndex === questions.length - 1;
  const total = query.hasNextPage ? undefined : questions.length;

  const next = async () => {
    if (!atEnd) return setIndex(safeIndex + 1);
    if (query.hasNextPage) {
      const res = await query.fetchNextPage();
      const loaded = res.data?.pages.flatMap((p) => p.questions).length ?? 0;
      if (loaded > questions.length) setIndex(safeIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      <PracticeQuestionCard
        key={question.id}
        question={question}
        index={total !== undefined ? safeIndex : undefined}
        total={total}
        initialBookmarked={question.bookmarked}
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex(Math.max(0, safeIndex - 1))}
          disabled={safeIndex === 0}
          className="btn-secondary flex cursor-pointer items-center gap-1 px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          Question {safeIndex + 1}
          {total !== undefined ? ` of ${total}` : ''}
        </span>
        <button
          type="button"
          onClick={() => void next()}
          disabled={(atEnd && !query.hasNextPage) || query.isFetchingNextPage}
          className="btn-primary flex cursor-pointer items-center gap-1 px-4 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:opacity-40"
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Next'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {atEnd && !query.hasNextPage && (
        <p className="text-center font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          That&rsquo;s every question matching these filters.
        </p>
      )}
    </div>
  );
}

export default function MbaPractice() {
  const [params] = useSearchParams();
  // /mba/practice?section=QA is the dashboard's "practise your weak section" link.
  const [filters, setFilters] = useState<Filters>(() => {
    const s = params.get('section');
    return { filter: 'all', section: SECTIONS.includes(s as SectionId) ? (s as SectionId) : undefined };
  });
  const papers = useMbaPapers();

  const years = useMemo(
    () =>
      Array.from(
        new Set((papers.data?.papers ?? []).map((p) => p.year).filter((y): y is number => y !== null)),
      ).sort((a, b) => b - a),
    [papers.data],
  );
  const slots = useMemo(
    () =>
      Array.from(
        new Set(
          (papers.data?.papers ?? [])
            .filter((p) => !filters.year || p.year === filters.year)
            .map((p) => p.slot)
            .filter((s): s is number => s !== null),
        ),
      ).sort((a, b) => a - b),
    [papers.data, filters.year],
  );

  const set = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const selectClass =
    'rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[12px] text-[var(--ink)]';

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <SkyBanner
        eyebrow="Practice"
        title="Official CAT questions"
        lead="Answer, check, read the official solution. Ask the tutor for a hint once you've tried."
      />

      <section className="ss-panel space-y-3 p-4" aria-label="Filters">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={!filters.section} onClick={() => set({ section: undefined })}>
            All sections
          </Chip>
          {SECTIONS.map((s) => (
            <Chip key={s} active={filters.section === s} onClick={() => set({ section: s })}>
              {SECTION_SHORT[s]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="mba-year">
            Year
          </label>
          <select
            id="mba-year"
            className={selectClass}
            value={filters.year ?? ''}
            onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined, slot: undefined })}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                CAT {y}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mba-slot">
            Slot
          </label>
          <select
            id="mba-slot"
            className={selectClass}
            value={filters.slot ?? ''}
            onChange={(e) => set({ slot: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">All slots</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                Slot {s}
              </option>
            ))}
          </select>
          <span className="mx-1 hidden h-6 w-px bg-[var(--borders-default)] sm:block" />
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((f) => (
              <Chip key={f.id} active={filters.filter === f.id} onClick={() => set({ filter: f.id })}>
                {f.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <QuestionStepper key={JSON.stringify(filters)} filters={filters} />
    </div>
  );
}
