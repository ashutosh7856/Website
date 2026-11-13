import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import ProfileForm from '@/components/mba/ProfileForm';
import ShellPortal from '@/components/mba/ShellPortal';
import { mbaErrorMessage } from '@/api/mba';
import { DELETE_CONFIRM_PHRASE, useDeleteMyMbaData } from '@/api/mbaPrivacy';
import { useMbaShell } from '@/lib/mbaShellContext';
import { useAuthStore } from '@/store/AuthStore';

/** Confirm step for "Delete my MBA data": the student types DELETE. */
function DeleteDataDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const del = useDeleteMyMbaData();
  const ready = typed.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;

  return (
    <ShellPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        role="dialog"
        aria-modal
        aria-labelledby="mba-delete-title"
      >
        <div className="ss-panel w-full max-w-[520px] rounded-b-none p-5 sm:rounded-b-[inherit] md:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="mba-delete-title" className="ss-display text-[19px] text-[var(--ink)]">
              Delete your MBA data?
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={del.isPending}
              aria-label="Close"
              className="cursor-pointer rounded-lg p-1 hover:bg-[var(--neutral-100)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">
            <li>This removes your MBA profile, practice history, mock attempts and results, study plan, shortlist, interview practice and counsellor requests.</li>
            <li>Question reports you sent are kept to fix the questions, but without your name or account.</li>
            <li>Your ProCounsellor account stays. You can set up MBA prep again from scratch.</li>
            <li>This cannot be undone.</li>
          </ul>
          <label htmlFor="mba-delete-confirm" className="mt-4 block font-[Poppins] text-[13px] font-semibold text-[var(--ink)]">
            Type {DELETE_CONFIRM_PHRASE} to confirm
          </label>
          <input
            id="mba-delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[14px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
          />
          {del.isError && (
            <p role="alert" className="mt-2 font-[Poppins] text-[13px] text-rose-700">
              {mbaErrorMessage(del.error)}
            </p>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={del.isPending}
              className="btn-secondary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
            >
              Keep my data
            </button>
            <button
              type="button"
              disabled={!ready || del.isPending}
              onClick={() => del.mutate(undefined, { onSuccess: () => navigate('/mba/onboarding', { replace: true }) })}
              className="cursor-pointer rounded-full bg-rose-600 px-5 py-2.5 font-[Poppins] text-[13px] font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {del.isPending ? 'Deleting…' : 'Delete my MBA data'}
            </button>
          </div>
        </div>
      </div>
    </ShellPortal>
  );
}

export default function MbaProfile() {
  const { profile, firstName, phone } = useMbaShell();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const [deleting, setDeleting] = useState(false);

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

      <section className="ss-panel flex flex-wrap items-center justify-between gap-3 p-5" aria-labelledby="mba-data-title">
        <div className="max-w-[560px]">
          <h2 id="mba-data-title" className="ss-display text-[16px] text-[var(--ink)]">Your MBA data</h2>
          <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-500)]">
            Delete everything ProCounsel MBA saved for you: practice, mocks, plan and shortlist. Your ProCounsellor account stays.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="cursor-pointer rounded-full border border-rose-300 px-4 py-2 font-[Poppins] text-[13px] font-semibold text-rose-700 hover:bg-rose-50"
        >
          Delete my MBA data
        </button>
      </section>
      {deleting && <DeleteDataDialog onClose={() => setDeleting(false)} />}
    </div>
  );
}
