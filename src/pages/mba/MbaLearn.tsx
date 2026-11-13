import { Link, useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PlayCircle, Star } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import SyllabusPanel from '@/components/mba/SyllabusPanel';
import { useAuthStore } from '@/store/AuthStore';
import { courseDetailPath, useMbaCourses, type MbaCourse } from '@/api/mbaLearn';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function CourseCard({ course }: { course: MbaCourse }) {
  return (
    <Link
      to={courseDetailPath(course.courseId)}
      className="ss-panel group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#EDEFF6]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--brand-purple-500)]">
            <PlayCircle className="h-10 w-10" aria-hidden />
          </div>
        )}
        {(course.enrolled || course.price === 0) && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-white"
            style={{ background: course.enrolled ? '#2F43F2' : '#059669' }}
          >
            {course.enrolled ? 'Enrolled' : 'Free'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="ss-display line-clamp-2 text-[15px] text-[var(--ink)]">{course.courseName}</h3>
        {course.counsellorName && (
          <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">by {course.counsellorName}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 font-[Poppins] text-[13px]">
          {course.enrolled ? (
            <span className="font-semibold text-[var(--brand-purple-500)]">Continue learning →</span>
          ) : course.price === 0 ? (
            <span className="font-semibold text-[var(--green-600)]">Start free →</span>
          ) : (
            <>
              <span className="font-bold text-[var(--ink)]">{inr(course.price)}</span>
              {course.listPrice && (
                <span className="text-[12px] text-[var(--neutral-400)] line-through">{inr(course.listPrice)}</span>
              )}
            </>
          )}
          {course.rating && (
            <span className="ml-auto flex items-center gap-1 text-[12px] text-[var(--neutral-500)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {course.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const TABS = [
  { id: 'courses', label: 'Courses' },
  { id: 'syllabus', label: 'CAT syllabus' },
] as const;

function LearnTabs({ tab, onChange }: { tab: 'courses' | 'syllabus'; onChange: (tab: 'courses' | 'syllabus') => void }) {
  return (
    <div role="tablist" aria-label="Learn sections" className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className="cursor-pointer rounded-full border px-4 py-2 font-[Poppins] text-[13px] font-semibold"
          style={{
            borderColor: tab === t.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
            background: tab === t.id ? 'var(--brand-purple-500)' : '#fff',
            color: tab === t.id ? '#fff' : 'var(--neutral-600)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** /mba/learn — counsellor video courses (default) and the CAT syllabus with notes (?tab=syllabus). */
export default function MbaLearn() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'syllabus' ? 'syllabus' : 'courses';
  const setTab = (next: 'courses' | 'syllabus') => setParams(next === 'courses' ? {} : { tab: next }, { replace: true });

  if (tab === 'syllabus')
    return (
      <div className="mx-auto max-w-[1040px] space-y-5">
        <SkyBanner
          eyebrow="Learn"
          title="CAT syllabus"
          lead="Every CAT topic with short concept notes. Mark lessons completed, keep your own notes, and jump straight to practice."
        />
        <LearnTabs tab={tab} onChange={setTab} />
        <SyllabusPanel />
      </div>
    );
  return <CoursesTab tabs={<LearnTabs tab={tab} onChange={setTab} />} />;
}

function CoursesTab({ tabs }: { tabs: ReactNode }) {
  const { userId } = useAuthStore();
  const { courses, isPending, isError, refetch } = useMbaCourses(userId);
  const free = courses.filter((c) => c.price === 0).length;

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Learn"
        title="CAT & MBA courses"
        lead="Video courses from ProCounsel counsellors. Free ones first; open any course to watch or enrol."
        aside={
          courses.length ? (
            <span className="font-[Poppins] text-[12px] text-white/70">
              {courses.length} course{courses.length === 1 ? '' : 's'}
              {free ? ` · ${free} free` : ''}
            </span>
          ) : undefined
        }
      />
      {tabs}

      {isPending ? (
        <Skeleton rows={3} />
      ) : isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load courses"
          detail="Check your connection and try again."
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : courses.length === 0 ? (
        <StateBlock
          tone="empty"
          title="MBA courses are coming soon"
          detail="Our counsellors are recording CAT and MBA admission courses. Until they're live, keep your prep going with section-wise practice and mocks."
          action={{ label: 'Practice now', href: '/mba/practice' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
