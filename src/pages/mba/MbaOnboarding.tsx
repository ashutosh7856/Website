import { Navigate, useNavigate } from 'react-router-dom';
import ProfileForm from '@/components/mba/ProfileForm';
import { useMbaShell } from '@/lib/mbaShellContext';
import { trackEvent } from '@/lib/analytics';

/** Shown when GET /mba/me/profile is 404 — the student has not onboarded. */
export default function MbaOnboarding() {
  const { profile, firstName } = useMbaShell();
  const navigate = useNavigate();

  if (profile) return <Navigate to="/mba/dashboard" replace />;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ink)]">
          <img src="/logo.svg" alt="" className="h-6 w-6" />
        </span>
        <p className="font-[Poppins] text-[15px] font-bold text-[var(--ink)]">ProCounsel · CAT</p>
      </div>
      <h1 className="ss-display mt-6 text-[26px] leading-tight text-[var(--ink)] md:text-[32px]">
        Welcome{firstName ? `, ${firstName}` : ''}. Let&rsquo;s set up your CAT plan.
      </h1>
      <p className="mt-2 font-[Poppins] text-[14px] text-[var(--neutral-500)]">
        A few quick answers. You can change any of them later from your profile.
      </p>
      <div className="ss-panel mt-6 p-5 md:p-7">
        <ProfileForm
          initial={null}
          submitLabel="Start preparing"
          onSaved={(saved) => {
            trackEvent('mba_onboarding_complete', { current_level: saved.currentLevel, weekly_hours: saved.weeklyStudyHours });
            navigate('/mba/dashboard', { replace: true });
          }}
        />
      </div>
    </div>
  );
}
