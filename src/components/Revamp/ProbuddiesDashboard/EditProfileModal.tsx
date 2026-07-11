import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Loader2, Plus, Trash2, User, X } from 'lucide-react';
import { ImageCropper } from '@/components/common/ImageCropper';
import type { UpdateProBuddyProfilePayload } from '@/api/pro-buddies';
import type { ProBuddyLink, ProBuddyProfileForProBuddy, WorkingDay } from '@/types/probuddies';
import { formatAcademicYearLabel } from '@/lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProBuddyProfileForProBuddy | null;
  isSaving: boolean;
  onSave: (payload: UpdateProBuddyProfilePayload, photoFile: File | null) => Promise<void>;
  /** Open the modal directly on a specific step index (0-based). Default: 0 */
  initialStep?: number;
}

type EditableFormState = UpdateProBuddyProfilePayload;

const WORKING_DAYS: WorkingDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const OFFERING_FIELDS = [
  'Mess Food',
  'Attendance',
  'Campus Vibe',
  'Faculty Quality',
  'Exam Strategy',
] as const;

const LINK_TYPE_OPTIONS = ['INSTAGRAM', 'LINKEDIN', 'CUSTOM'] as const;
const YEAR_OPTIONS = ['1', '2', '3', '4', '5'] as const;

const clampOfferingValue = (value: number) => Math.min(5, Math.max(1, Number.isFinite(value) ? value : 5));

const EMPTY_LINK: ProBuddyLink = {
  type: 'CUSTOM',
  url: '',
  title: '',
  thumbnailUrl: null,
};

const STEPS = [
  { title: 'Basic Info', description: 'Names, contact, and academics' },
  { title: 'Profile Details', description: 'Location, language, and bio' },
  { title: 'Links & Offerings', description: 'Social links and expertise' },
  { title: 'Availability', description: 'Schedule and call pricing' },
];

const normalizeLinks = (links: ProBuddyProfileForProBuddy['links']): ProBuddyLink[] => {
  if (!Array.isArray(links) || links.length === 0) {
    return [{ ...EMPTY_LINK }];
  }

  return links.map((link) => ({
    type: typeof link === 'string' ? 'CUSTOM' : String(link?.type || 'CUSTOM'),
    url: typeof link === 'string' ? link : String(link?.url || ''),
    title: typeof link === 'string' ? link : String(link?.title || ''),
    thumbnailUrl: typeof link === 'string' ? null : link?.thumbnailUrl || null,
  }));
};

const normalizeOfferings = (offerings?: ProBuddyProfileForProBuddy['offerings']) => {
  return Object.fromEntries(
    OFFERING_FIELDS.map((key) => [key, clampOfferingValue(Number(offerings?.[key] ?? 5))])
  );
};

const createInitialState = (profileData: ProBuddyProfileForProBuddy | null): EditableFormState => ({
  firstName: profileData?.firstName || '',
  lastName: profileData?.lastName || '',
  phoneNumber: profileData?.phoneNumber || '',
  email: profileData?.email || '',
  collegeName: profileData?.collegeName || '',
  collegeId: profileData?.collegeId || null,
  currentYear: profileData?.currentYear || '',
  course: profileData?.course || '',
  city: profileData?.city || '',
  state: profileData?.state || '',
  languagesKnow: Array.isArray(profileData?.languagesKnow) ? profileData.languagesKnow : [],
  aboutMe: {
    heading: profileData?.aboutMe?.heading || '',
    subHeading: profileData?.aboutMe?.subHeading || '',
    aboutMe: profileData?.aboutMe?.aboutMe || '',
  },
  whoShouldConnect: profileData?.whoShouldConnect || '',
  links: normalizeLinks(profileData?.links || null),
  offerings: normalizeOfferings(profileData?.offerings),
  ratePerMinute:
    profileData?.ratePerMinute === null || profileData?.ratePerMinute === undefined
      ? null
      : Number(profileData.ratePerMinute) || 0,
  workingDays: Array.isArray(profileData?.workingDays) ? [...profileData.workingDays] : [],
  officeStartTime: profileData?.officeStartTime || '',
  officeEndTime: profileData?.officeEndTime || '',
});

const SectionTitle = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-5">
    <h3 className="text-lg font-semibold text-[#0E1629]">{title}</h3>
    <p className="text-sm text-[#6B7280]">{description}</p>
  </div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-medium text-[#0E1629]">{label}</span>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      className={`h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none ${
        readOnly ? 'bg-[#F9FAFB] text-[#6B7280]' : ''
      }`}
    />
  </label>
);

const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  rows?: number;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-medium text-[#0E1629]">{label}</span>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none resize-none"
    />
  </label>
);

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  isSaving,
  onSave,
  initialStep = 0,
}) => {
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState<EditableFormState>(() => createInitialState(profileData));
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoCropImage, setPhotoCropImage] = useState<string | null>(null);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextState = createInitialState(profileData);
    setFormData(nextState);
    setStep(initialStep);
    setSelectedPhoto(null);
    setPreviewImage(profileData?.photoUrl?.trim() || null);
  }, [isOpen, profileData]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (photoCropImage) {
      URL.revokeObjectURL(photoCropImage);
      setPhotoCropImage(null);
    }
  }, [isOpen, photoCropImage]);

  useEffect(() => {
    return () => {
      if (previewImage?.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }

      if (photoCropImage) {
        URL.revokeObjectURL(photoCropImage);
      }
    };
  }, [previewImage, photoCropImage]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const offeringEntries = useMemo(
    () => OFFERING_FIELDS.map((key) => [key, formData.offerings[key] ?? 5] as const),
    [formData.offerings]
  );

  if (!isOpen) return null;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'ratePerMinute' ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    if (name.startsWith('aboutMe.')) {
      const aboutMeKey = name.split('.')[1] as keyof EditableFormState['aboutMe'];
      setFormData((prev) => ({
        ...prev,
        aboutMe: {
          ...prev.aboutMe,
          [aboutMeKey]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLanguagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const languages = event.target.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      languagesKnow: languages,
    }));
  };

  const handleWorkingDayToggle = (day: WorkingDay) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((entry) => entry !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleLinkChange = (index: number, field: keyof ProBuddyLink, value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((link, currentIndex) =>
        currentIndex === index
          ? {
              ...link,
              [field]: field === 'thumbnailUrl' ? value || null : value,
            }
          : link
      ),
    }));
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { ...EMPTY_LINK }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.length === 1 ? [{ ...EMPTY_LINK }] : prev.links.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleOfferingValueChange = (key: string, value: string) => {
    const parsedValue = value === '' ? 5 : clampOfferingValue(Number(value));
    setFormData((prev) => ({
      ...prev,
      offerings: {
        ...prev.offerings,
        [key]: parsedValue,
      },
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (photoCropImage) {
      URL.revokeObjectURL(photoCropImage);
    }

    setPhotoCropImage(URL.createObjectURL(file));
  };

  const handlePhotoCropComplete = (croppedImage: File) => {
    if (previewImage?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedPhoto(croppedImage);
    setPreviewImage(URL.createObjectURL(croppedImage));

    if (photoCropImage) {
      URL.revokeObjectURL(photoCropImage);
    }

    setPhotoCropImage(null);
  };

  const handlePhotoCropCancel = () => {
    if (photoCropImage) {
      URL.revokeObjectURL(photoCropImage);
    }

    setPhotoCropImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const normalizedPayload: UpdateProBuddyProfilePayload = {
      ...formData,
      links: formData.links.filter((link) => link.url.trim()),
      workingDays: [...formData.workingDays].sort(
        (left, right) => WORKING_DAYS.indexOf(left) - WORKING_DAYS.indexOf(right)
      ),
    };

    await onSave(normalizedPayload, selectedPhoto);
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4 font-poppins">
      <div className="relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[95vh] sm:max-w-5xl sm:rounded-3xl sm:shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={step === 0 ? onClose : () => setStep((prev) => prev - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
            >
              {step === 0 ? <X className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div>
              <h2 className="text-lg font-semibold text-[#0E1629] sm:text-xl">Edit ProBuddy Profile</h2>
              <p className="text-sm text-[#6B7280]">{STEPS[step].title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] transition-colors hover:bg-[#F9FAFB] sm:flex cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col sm:grid sm:grid-cols-[260px_minmax(0,1fr)] sm:overflow-hidden">
          <aside className="hidden border-b border-[#E5E7EB] bg-[#F9FAFB] p-4 sm:block sm:border-b-0 sm:border-r sm:p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                {previewImage ? (
                  <img loading="lazy" decoding="async"
                    src={previewImage}
                    alt="Profile preview"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-9 w-9 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow cursor-pointer"
                >
                  <img loading="lazy" decoding="async" src="/edit2.svg" alt="Edit profile" className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0E1629]">
                  {[formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'ProBuddy'}
                </p>
                <p className="text-xs text-[#6B7280]">{profileData?.proBuddyId || 'Draft'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {STEPS.map((item, index) => {
                const active = index === step;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-[#2F43F2] bg-white shadow-sm'
                        : 'border-transparent bg-transparent hover:bg-white'
                    } cursor-pointer`}
                  >
                    <p className="text-sm font-semibold text-[#0E1629]">
                      {index + 1}. {item.title}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 sm:hidden">
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  {previewImage ? (
                    <img loading="lazy" decoding="async"
                      src={previewImage}
                      alt="Profile preview"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-7 w-7 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow cursor-pointer"
                  >
                    <img loading="lazy" decoding="async" src="/edit2.svg" alt="Edit profile" className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0E1629]">
                    {[formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'ProBuddy'}
                  </p>
                  <p className="text-xs text-[#6B7280]">{profileData?.proBuddyId || 'Draft'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                {STEPS.map((item, index) => {
                  const active = index === step;
                  const completed = index < step;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setStep(index)}
                      className="flex flex-1 flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#2F43F2] text-white'
                            : completed
                              ? 'bg-[#EEF2FF] text-[#2F43F2]'
                              : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`text-center text-[10px] font-medium leading-tight ${
                          active ? 'text-[#2F43F2]' : 'text-[#6B7280]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-1">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= step ? 'bg-[#2F43F2]' : 'bg-[#E5E7EB]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {step === 0 && (
                <div>
                  <SectionTitle title="Basic Info" description="Update the core profile fields exactly as the backend expects." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField label="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                    <InputField label="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    <InputField
                      label="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      readOnly
                    />
                    <InputField label="email" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                    <InputField label="collegeName" name="collegeName" value={formData.collegeName} onChange={handleInputChange} />
                    <InputField label="collegeId" name="collegeId" value={formData.collegeId || ''} onChange={handleInputChange} />
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[#0E1629]">currentYear</span>
                      <div className="relative" ref={yearDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsYearOpen((prev) => !prev)}
                          className="flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none cursor-pointer"
                        >
                          <span className={formData.currentYear ? 'text-[#111827]' : 'text-[#9CA3AF]'}>
                            {formData.currentYear ? formatAcademicYearLabel(formData.currentYear) : 'Select year'}
                          </span>
                          <ChevronLeft className={`h-4 w-4 text-[#6B7280] transition-transform ${isYearOpen ? '-rotate-90' : 'rotate-270'}`} />
                        </button>

                        {isYearOpen && (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
                            {YEAR_OPTIONS.map((year) => (
                              <button
                                key={year}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setFormData((prev) => ({ ...prev, currentYear: year }));
                                  setIsYearOpen(false);
                                }}
                                className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors hover:bg-[#F8FAFF] cursor-pointer ${formData.currentYear === year ? 'font-semibold text-[#2F43F2]' : 'text-[#111827]'}`}
                              >
                                {formatAcademicYearLabel(year)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                    <InputField label="course" name="course" value={formData.course} onChange={handleInputChange} />
                  </div>
                  <p className="mt-3 text-xs text-[#6B7280]">Phone number is locked after registration.</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <SectionTitle title="Profile Details" description="Edit the bio block, location, languages, and target audience." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField label="city" name="city" value={formData.city} onChange={handleInputChange} />
                    <InputField label="state" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[#0E1629]">languagesKnow</span>
                    <input
                      value={formData.languagesKnow.join(', ')}
                      onChange={handleLanguagesChange}
                      placeholder="Hindi, English"
                      className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextAreaField
                      label="aboutMe.heading"
                      name="aboutMe.heading"
                      value={formData.aboutMe.heading}
                      onChange={handleTextAreaChange}
                      rows={3}
                    />
                    <TextAreaField
                      label="aboutMe.subHeading"
                      name="aboutMe.subHeading"
                      value={formData.aboutMe.subHeading}
                      onChange={handleTextAreaChange}
                      rows={3}
                    />
                  </div>
                  <TextAreaField
                    label="aboutMe.aboutMe"
                    name="aboutMe.aboutMe"
                    value={formData.aboutMe.aboutMe}
                    onChange={handleTextAreaChange}
                    rows={6}
                  />
                  <TextAreaField
                    label="whoShouldConnect"
                    name="whoShouldConnect"
                    value={formData.whoShouldConnect}
                    onChange={handleTextAreaChange}
                    rows={4}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <SectionTitle title="Links & Offerings" description="Edit social links with the full URL. The public profile will show only the handle or profile ID." />

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#0E1629]">links</h4>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D1D5DB] px-3 py-1.5 text-sm text-[#111827] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add link
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.links.map((link, index) => (
                        <div key={`${link.type}-${index}`} className="rounded-2xl border border-[#E5E7EB] p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#0E1629]">Link {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(index)}
                              className="text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                            <label className="flex flex-col gap-2">
                              <span className="text-sm font-medium text-[#0E1629]">type</span>
                              <select
                                value={link.type}
                                onChange={(event) => handleLinkChange(index, 'type', event.target.value)}
                                className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none cursor-pointer"
                              >
                                {LINK_TYPE_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <InputField
                              label="url"
                              name={`link-url-${index}`}
                              value={link.url}
                              onChange={(event) => handleLinkChange(index, 'url', event.target.value)}
                              placeholder="https://instagram.com/your-id"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#0E1629]">offerings</h4>
                    </div>

                    <div className="space-y-3">
                      {offeringEntries.map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                          <input
                            value={key}
                            readOnly
                            className="h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-[#111827]"
                          />
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="1"
                            value={value}
                            onChange={(event) => handleOfferingValueChange(key, event.target.value)}
                            placeholder="Rate 1 to 5"
                            className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] focus:border-[#2F43F2] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <SectionTitle title="Availability" description="Set your call pricing, office timings, and working days." />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <InputField
                      label="ratePerMinute"
                      name="ratePerMinute"
                      value={formData.ratePerMinute ?? ''}
                      onChange={handleInputChange}
                      type="number"
                      placeholder="Enter your rate per minute"
                      min={0}
                    />
                    <InputField
                      label="officeStartTime"
                      name="officeStartTime"
                      value={formData.officeStartTime}
                      onChange={handleInputChange}
                      type="time"
                    />
                    <InputField
                      label="officeEndTime"
                      name="officeEndTime"
                      value={formData.officeEndTime}
                      onChange={handleInputChange}
                      type="time"
                    />
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-[#0E1629]">workingDays</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {WORKING_DAYS.map((day) => {
                        const selected = formData.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleWorkingDayToggle(day)}
                            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-[#2F43F2] bg-[#EEF2FF] text-[#1D4ED8]'
                                : 'border-[#E5E7EB] text-[#111827]'
                            } cursor-pointer`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-[#E5E7EB] px-4 py-4 sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={step === 0 ? onClose : () => setStep((prev) => prev - 1)}
                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#111827] sm:flex-none sm:py-2 cursor-pointer"
              >
                {step === 0 ? 'Cancel' : 'Previous'}
              </button>

              <button
                type="button"
                onClick={isLastStep ? handleSubmit : () => setStep((prev) => prev + 1)}
                disabled={isSaving}
                className="inline-flex flex-2 items-center justify-center gap-2 rounded-xl bg-[#0E1629] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70 disabled:cursor-not-allowed sm:flex-none sm:min-w-35 sm:py-2.5 cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isLastStep ? (isSaving ? 'Saving...' : 'Update profile') : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {photoCropImage ? (
        <ImageCropper
          image={photoCropImage}
          aspectRatio={1}
          title="Crop Profile Photo"
          onCropComplete={handlePhotoCropComplete}
          onCancel={handlePhotoCropCancel}
        />
      ) : null}
    </div>
  );
};

export default EditProfileModal;
