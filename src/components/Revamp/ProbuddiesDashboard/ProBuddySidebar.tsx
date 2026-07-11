import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, GraduationCap, MapPin, Instagram, Linkedin, User, X, Plus, Upload } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import { probuddiesApi, type UpdateProBuddyProfilePayload } from '@/api/pro-buddies';
import type { ProBuddyProfileForProBuddy } from '@/types/probuddies';
import toast from 'react-hot-toast';

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown, fallback = 'NA'): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const getLinkByType = (source: unknown, linkType: string): AnyRecord | null => {
  if (!isRecord(source) || !Array.isArray(source.links)) return null;

  const found = source.links.find((entry) => {
    if (!isRecord(entry)) return false;
    return String(entry.type ?? '').toUpperCase() === linkType;
  });

  return isRecord(found) ? found : null;
};

const ProBuddySidebar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialStep, setModalInitialStep] = useState(0);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const idCardUploadRef = React.useRef<HTMLInputElement>(null);
  const proBuddyId = useMemo(() => localStorage.getItem('phone') || '', []);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['probuddy-sidebar-profile', proBuddyId],
    queryFn: () => probuddiesApi.profileForProBuddy(proBuddyId),
    enabled: Boolean(proBuddyId),
  });

  const guestProfileQuery = useQuery({
    queryKey: ['probuddy-guest-profile', proBuddyId],
    queryFn: () => probuddiesApi.profileGuest(proBuddyId),
    enabled: Boolean(proBuddyId),
  });

  const profileData = useMemo<ProBuddyProfileForProBuddy | null>(() => {
    // ProBuddy-side API: has exclusive fields (collegeId, priority, etc.) but may miss rate/schedule
    const proBuddyPayload = profileQuery.data;
    const proBuddySide = (() => {
      if (isRecord(proBuddyPayload) && isRecord(proBuddyPayload.data)) return proBuddyPayload.data as ProBuddyProfileForProBuddy;
      if (isRecord(proBuddyPayload)) return proBuddyPayload as unknown as ProBuddyProfileForProBuddy;
      return null;
    })();

    // Guest/user-side API: reliably has all common fields including rate, workingDays, etc.
    const guestSide = guestProfileQuery.data ?? null;

    if (!guestSide && !proBuddySide) return null;

    return {
      ...(guestSide ?? {}),
      // Overlay ProBuddy-exclusive fields from the JWT-protected endpoint
      priority: proBuddySide?.priority ?? null,
      dateCreated: proBuddySide?.dateCreated ?? null,
      lastDateAndTimeModified: proBuddySide?.lastDateAndTimeModified ?? null,
      lastLoginDateAndTime: proBuddySide?.lastLoginDateAndTime ?? null,
      collegeId: proBuddySide?.collegeId ?? null,
      referralCode: proBuddySide?.referralCode ?? null,
      t3ReferralCode: proBuddySide?.t3ReferralCode ?? null,
      photoUrlSmall: proBuddySide?.photoUrlSmall ?? null,
      idCardPhotoUrl: proBuddySide?.idCardPhotoUrl ?? null,
      phoneOtpVerified: proBuddySide?.phoneOtpVerified ?? false,
      emailOtpVerified: proBuddySide?.emailOtpVerified ?? false,
      platform: proBuddySide?.platform ?? null,
    } as ProBuddyProfileForProBuddy;
  }, [profileQuery.data, guestProfileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({
      payload,
      photoFile,
    }: {
      payload: UpdateProBuddyProfilePayload;
      photoFile: File | null;
    }) => {
      if (!proBuddyId) {
        throw new Error('proBuddyId is required');
      }

      if (photoFile) {
        await probuddiesApi.uploadPhoto(proBuddyId, photoFile);
      }

      return probuddiesApi.updateProfile(proBuddyId, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['probuddy-sidebar-profile', proBuddyId] }),
        queryClient.invalidateQueries({ queryKey: ['probuddy-guest-profile', proBuddyId] }),
        queryClient.invalidateQueries({ queryKey: ['probuddy-dashboard-profile', proBuddyId] }),
        queryClient.invalidateQueries({ queryKey: ['probuddy-dashboard-profile-mapped', proBuddyId] }),
      ]);
      toast.success('Profile updated successfully');
      setIsModalOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    },
  });

  const displayName = useMemo(() => {
    const firstName = toText(profileData?.firstName, 'NA');
    const lastName = toText(profileData?.lastName, 'NA');

    if (firstName === 'NA' && lastName === 'NA') {
      return 'NA';
    }

    if (firstName === 'NA') {
      return lastName;
    }

    if (lastName === 'NA') {
      return firstName;
    }

    return `${firstName} ${lastName}`;
  }, [profileData]);

  const college = toText(profileData?.collegeName, 'NA');

  const location = useMemo(() => {
    const city = toText(profileData?.city, 'NA');
    const state = toText(profileData?.state, 'NA');

    if (city === 'NA' && state === 'NA') {
      return 'NA';
    }

    if (city === 'NA') {
      return state;
    }

    if (state === 'NA') {
      return city;
    }

    return `${city}, ${state}`;
  }, [profileData]);

  const photoUrl = profileData?.photoUrl?.trim() || null;
  const idCardUrl = profileData?.idCardPhotoUrl?.trim() || null;

  const instagramLink = getLinkByType(profileData, 'INSTAGRAM');
  const linkedinLink = getLinkByType(profileData, 'LINKEDIN');

  const instagramUrl = toText(instagramLink?.url, '#');
  const linkedinUrl = toText(linkedinLink?.url, '#');

  const handleSaveProfile = async (payload: UpdateProBuddyProfilePayload, photoFile: File | null) => {
    await updateProfileMutation.mutateAsync({ payload, photoFile });
  };

  const openModalAtStep = (step: number) => {
    setModalInitialStep(step);
    setIsModalOpen(true);
  };

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proBuddyId) return;
    try {
      setIsUploadingIdCard(true);
      await probuddiesApi.uploadIdCard(proBuddyId, file);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['probuddy-sidebar-profile', proBuddyId] }),
        queryClient.invalidateQueries({ queryKey: ['probuddy-dashboard-profile', proBuddyId] }),
      ]);
      toast.success('ID card uploaded successfully');
    } catch {
      toast.error('Failed to upload ID card. Please try again.');
    } finally {
      setIsUploadingIdCard(false);
      if (idCardUploadRef.current) idCardUploadRef.current.value = '';
    }
  };

  return (
    <>
      <div className="w-full max-w-[320px] xl:w-62 min-h-0 sm:min-h-148.5 bg-white rounded-2xl shadow-sm flex flex-col items-center pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6 font-poppins relative z-20 mx-auto xl:mx-0">

        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute w-7 h-7 sm:w-8 sm:h-8 top-2.5 right-2.5 sm:top-3 sm:right-3 rounded-lg p-1 flex items-center justify-center transition-colors brightness-95 cursor-pointer"
          style={{
            background: 'linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(0deg, rgba(198, 221, 240, 0.25), rgba(198, 221, 240, 0.25))'
          }}
        >
          <img loading="lazy" decoding="async"
            src='/edit2.svg'
            alt='edit profile'
            className='w-5 h-5 sm:w-6 sm:h-6 text-[#2F43F2]'
          />
        </button>

        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
          {photoUrl ? (
            <img loading="lazy" decoding="async"
              src={photoUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
          )}
        </div>

        <h2 className="w-full sm:w-35.25 text-[18px] sm:text-[20px] font-semibold text-[#0E1629] leading-none text-center mb-3 truncate">
          {displayName}
        </h2>

        <hr className="w-full border-[#E5E5E5] mb-2.5" />

        <div className="w-full flex flex-col gap-2 sm:gap-3 mb-2.5">
          <h3 className="text-[16px] font-medium text-[#0E1629] leading-none">
            College
          </h3>
          <div className="flex items-center gap-2 text-[#6B7280]">
            <GraduationCap className="w-5 h-5" />
            <span className="text-[15px] sm:text-[16px] font-medium leading-none truncate">{college}</span>
          </div>
        </div>

        <hr className="w-full border-[#E5E5E5] mb-2.5" />

        <div className="w-full flex flex-col gap-2 sm:gap-3 mb-2.5">
          <h3 className="text-[16px] font-medium text-[#0E1629] leading-none">
            Location
          </h3>
          <div className="flex items-center gap-2 text-[#6B7280]">
            <MapPin className="w-5 h-5" />
            <span className="text-[15px] sm:text-[16px] font-medium leading-none truncate">{location}</span>
          </div>
        </div>

        <hr className="w-full border-[#E5E5E5] mb-2.5" />

        <div className="w-full flex flex-col gap-2 sm:gap-3 mb-2.5">
          <h3 className="text-[16px] font-medium text-[#0E1629] leading-none">
            ID Card
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {idCardUrl && (
              <button
                type="button"
                onClick={() => setIsIdCardOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#0E1629] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                View ID Card
              </button>
            )}
            <input
              ref={idCardUploadRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleIdCardUpload}
            />
            <button
              type="button"
              onClick={() => idCardUploadRef.current?.click()}
              disabled={isUploadingIdCard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#2F43F2] px-3 py-2 text-sm font-medium text-[#2F43F2] transition-colors hover:bg-[#EEF1FF] cursor-pointer disabled:opacity-50"
            >
              {isUploadingIdCard ? (
                <span className="text-xs">Uploading…</span>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  {idCardUrl ? 'Replace' : 'Upload ID Card'}
                </>
              )}
            </button>
          </div>
        </div>

        <hr className="w-full border-[#E5E5E5] mb-2.5" />

        <div className="w-full flex flex-col gap-2 sm:gap-3">
          <h3 className="text-[16px] font-medium text-[#0E1629] leading-none">
            Social Media Links
          </h3>
          <div className="flex items-center gap-3">
            {instagramUrl && instagramUrl !== '#' ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title={instagramUrl}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors hover:bg-[#E8EDF3] cursor-pointer"
              >
                <Instagram className="w-5 h-5 text-pink-600" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => openModalAtStep(2)}
                aria-label="Add Instagram link"
                title="Add Instagram link"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors hover:bg-[#E8EDF3] cursor-pointer relative"
              >
                <Instagram className="w-5 h-5 text-pink-300" />
                <Plus className="w-3 h-3 text-[#2F43F2] absolute bottom-1 right-1" />
              </button>
            )}
            {linkedinUrl && linkedinUrl !== '#' ? (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                title={linkedinUrl}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors hover:bg-[#E8EDF3] cursor-pointer"
              >
                <Linkedin className="w-5 h-5 text-blue-600" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => openModalAtStep(2)}
                aria-label="Add LinkedIn link"
                title="Add LinkedIn link"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors hover:bg-[#E8EDF3] cursor-pointer relative"
              >
                <Linkedin className="w-5 h-5 text-blue-300" />
                <Plus className="w-3 h-3 text-[#2F43F2] absolute bottom-1 right-1" />
              </button>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalInitialStep(0); }}
        profileData={profileData}
        isSaving={updateProfileMutation.isPending}
        onSave={handleSaveProfile}
        initialStep={modalInitialStep}
      />

      {isIdCardOpen && idCardUrl ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={() => setIsIdCardOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-[#0E1629]">ID Card</h3>
                <p className="text-sm text-[#6B7280]">Preview of the uploaded ID card</p>
              </div>
              <button
                type="button"
                onClick={() => setIsIdCardOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[#F8FAFC] p-4 sm:p-6">
              <div className="max-h-[75vh] overflow-auto rounded-2xl border border-[#E5E7EB] bg-white p-3">
                <img loading="lazy" decoding="async"
                  src={idCardUrl}
                  alt="ID Card"
                  className="mx-auto h-auto w-full max-w-full rounded-xl object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ProBuddySidebar;
