import SkyBanner from '@/components/school-student/SkyBanner';
import ProfileForm from '@/components/mba/ProfileForm';
import { useMbaShell } from '@/lib/mbaShellContext';
import { useAuthStore } from '@/store/AuthStore';

export default function MbaProfile() {
  const { profile, firstName, phone } = useMbaShell();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="mx-auto max-w-[920px] space-y-5">
      <SkyBanner eyebrow="Profile" title={firstName ? `${firstName}'s plan` : 'Your plan'} lead="Your CAT goals and weekly rhythm." />

      <section className="ss-panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-[Poppins] text-[15px] font-bold text-[var(--ink)]">{fullName || 'Your account'}</p>
          {phone && <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">{phone}</p>}
          {user?.email && <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">{user.email}</p>}
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn-secondary cursor-pointer px-4 py-2 font-[Poppins] text-[13px] font-semibold"
        >
          Log out
        </button>
      </section>

      <section className="ss-panel p-5 md:p-7">
        <h2 className="ss-display text-[18px] text-[var(--ink)]">Preparation details</h2>
        <div className="mt-4">
          <ProfileForm initial={profile} submitLabel="Save changes" />
        </div>
      </section>
    </div>
  );
}
