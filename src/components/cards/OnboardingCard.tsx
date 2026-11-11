import { useState, useEffect } from "react";
import { Search, Check, ChevronLeft, Loader2, X } from "lucide-react";
import { getSates, getCoursesOnborading, updateUser, schoolStudentSignup } from "@/api/auth";
import type { SchoolStudentSignupPayload } from "@/api/auth";
import { SchoolStudentDetailsStep } from "@/components/cards/SchoolStudentSteps";
import toast from "react-hot-toast";
import type { CousrseApiLogin, StatesApiResponse } from "@/types";
import { useAuthStore } from "@/store/AuthStore";
import { MBA_STUDENT_ROLE, forgetIntendedCourse, isMbaCourse, readIntendedCourse } from "@/lib/mbaCourse";
import { captureLeadFromUser, captureSchoolStudentLead } from "@/api/leads";
import { isSchoolCourse } from "@/lib/schoolCourse";

/**
 * A course tile's artwork.
 *
 * The backend does not have an image for every course — `ssc_ththth` ships
 * `imageStorage: null` today — and a bare `<img>` with a null src renders as a
 * broken-image glyph, which looks like a bug rather than a missing asset. This
 * draws a mark instead, and it also catches URLs that 404 later via `onError`,
 * so one dead file in storage can never put a broken icon in the grid.
 *
 * School courses get the satchel; everything else gets a book.
 */
const CourseIcon = ({ course }: { course: CousrseApiLogin }) => {
  const [failed, setFailed] = useState(false);
  const school = isSchoolCourse(course);

  if (course.imageStorage && !failed) {
    return (
      <img
        loading="lazy"
        decoding="async"
        src={course.imageStorage}
        alt=""
        onError={() => setFailed(true)}
        className="mb-2 md:mb-4 h-16 w-16 md:h-24 md:w-24 object-contain mx-auto"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="mb-2 md:mb-4 mx-auto flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-2xl"
      style={{ background: school ? "#EFEAFF" : "#F1F3F8" }}
    >
      <svg viewBox="0 0 64 64" className="h-10 w-10 md:h-14 md:w-14" fill="none">
        {school ? (
          <>
            {/* A school building. The satchel this replaced read as a padlock at
                40px — a roof, a door and two windows is unambiguous at any size. */}
            <path d="M32 6v6" stroke="#4C2FD3" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 6l10 3-10 3z" fill="#FA660F" />
            <path d="M32 14 8 28h48z" fill="#4C2FD3" />
            <rect x="12" y="28" width="40" height="26" rx="3" fill="#6C4CF1" />
            <rect x="27" y="38" width="10" height="16" rx="2" fill="#EFEAFF" />
            <rect x="17" y="34" width="7" height="7" rx="1.5" fill="#EFEAFF" />
            <rect x="40" y="34" width="7" height="7" rx="1.5" fill="#EFEAFF" />
          </>
        ) : (
          <>
            <rect x="12" y="14" width="40" height="36" rx="5" fill="#8A93AC" />
            <rect x="12" y="14" width="14" height="36" rx="5" fill="#6C7690" />
            <path d="M32 24h14M32 32h14M32 40h10" stroke="#EEF1F7" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
};

interface SelectCourseStepProps {
  selectedCourseName: string | null;
  onCourseSelect: (course: CousrseApiLogin) => void;
  setNeedsOnboarding: (value: boolean) => void;
  cancelOnboarding: () => void;
}

const SelectCourseStep = ({
  selectedCourseName,
  onCourseSelect,
  setNeedsOnboarding,
  cancelOnboarding,
}: SelectCourseStepProps) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CousrseApiLogin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const CourseData = await getCoursesOnborading();
        setCourses(CourseData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch Courses"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-10 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#13097D]" />
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }
  if (error)
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <>
      <div>
        <div className="mb-3 md:mb-6 flex  justify-between">
          <h1 className="text-lg md:text-2xl font-semibold md:font-bold text-[#343C6A] text-center mb-2">
            Select Course
          </h1>

          {/* <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm font-semibold text-gray-600">
              Step 1 of 2
            </span>
            <div className="mt-1 h-1.5 w-20 md:w-24 rounded-full bg-gray-200">
              <div className="h-full w-1/2 rounded-full bg-[#FA660F]"></div>
            </div>
          </div> */}

          <button
            onClick={() => {
              cancelOnboarding();
              setNeedsOnboarding(false);
            }}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close onboarding"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="relative mb-3 md:mb-6">
          <Search
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#FA660F]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 py-2 md:py-3 pl-10 md:pl-12 pr-4 text-sm md:text-base shadow-2xs focus:border-[#FA660F] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 md:-mr-4 md:pr-4 p-1">
        <div className="grid grid-cols-2 gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isSelected = selectedCourseName === course.name;
            return (
              <button
                key={course.courseId}
                onClick={() => onCourseSelect(course)}
                className={`relative transform rounded-xl border p-3 md:p-5 text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#FA660F] bg-orange-50 shadow-lg ring-2 ring-[#FA660F] ring-offset-0"
                    : "bg-white hover:shadow-lg border-gray-200"
                }`}
              >
                <CourseIcon course={course} />
                <h3
                  className={`text-sm md:text-lg font-bold ${
                    isSelected ? "text-[#FA660F]" : "text-gray-800"
                  } line-clamp-2`}
                >
                  {course.name}
                </h3>
                <p
                  className={`text-xs md:text-sm ${
                    isSelected ? "text-orange-600" : "text-gray-500"
                  } line-clamp-1`}
                >
                  {course.duration}
                </p>
                <p
                  className={`mt-1 md:mt-2 text-xs md:text-sm ${
                    isSelected ? "text-orange-600" : "text-gray-500"
                  } line-clamp-2`}
                >
                  {course.tagline}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-[#FA660F] text-white">
                    <Check
                      size={14}
                      className="md:w-4 md:h-4"
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

interface SelectStatesStepProps {
  selectedStates: string[];
  onStateSelect: (stateName: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  setNeedsOnboarding: (value: boolean) => void;
  cancelOnboarding: () => void;
}

const SelectStatesStep = ({
  selectedStates,
  onStateSelect,
  onBack,
  onSubmit,
  isSubmitting,
  setNeedsOnboarding,
  cancelOnboarding,
}: SelectStatesStepProps) => {
  const [states, setStates] = useState<StatesApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStates = states.filter((state) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const StatesData = await getSates();
        setStates(StatesData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch States"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, []);

  const isSelected = (name: string) => selectedStates.includes(name);

  if (loading) {
    return (
      <div className="text-center p-10 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#13097D]" />
        <span className="ml-2">Loading states...</span>
      </div>
    );
  }
  if (error)
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <>
      <div>
        <div className="mb-3 md:mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-lg md:text-2xl font-semibold md:font-bold text-[#343C6A] hover:text-[#FA660F] transition-colors cursor-pointer flex items-center gap-1 md:gap-2"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            <span>Select States</span>
          </button>
          {/* <div className="flex flex-col items-end">
            <span className="text-xs md:text-sm font-semibold text-gray-600">
              Step 2 of 2
            </span>
            <div className="mt-1 h-1.5 w-20 md:w-24 rounded-full bg-gray-200">
              <div className="h-full w-full rounded-full bg-[#FA660F]"></div>
            </div>
          </div> */}
          <button
            onClick={() => {
              cancelOnboarding();
              setNeedsOnboarding(false);
            }}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close onboarding"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="relative mb-3 md:mb-6">
          <Search
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#FA660F]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search States"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 py-2 md:py-3 pl-10 md:pl-12 pr-4 text-sm md:text-base shadow-2xs focus:border-[#FA660F] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 md:-mr-4 md:pr-4 p-1">
        <div className="grid grid-cols-2 gap-2 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStates.map((state) => (
            <button
              key={state.name}
              onClick={() => onStateSelect(state.name)}
              className={`relative flex flex-col items-center justify-center rounded-xl border p-3 md:p-6 transition-colors duration-200 cursor-pointer
                ${
                  isSelected(state.name)
                    ? "border-transparent bg-[#13097D] text-white"
                    : "bg-white hover:shadow-lg border-gray-200"
                }`}
            >
              <img loading="lazy" decoding="async"
                src={state.imageStorage}
                alt={`${state.name} icon`}
                className="mb-2 md:mb-3 h-10 w-10 md:h-12 md:w-12 object-contain"
              />
              <h3 className="text-xs md:text-base font-semibold text-center line-clamp-2">
                {state.name}
              </h3>
              <div
                className={`absolute right-2 top-2 md:right-3 md:top-3 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded border-2 ${
                  isSelected(state.name)
                    ? "border-white bg-white text-[#13097D]"
                    : "border-gray-300"
                }`}
              >
                {isSelected(state.name) && (
                  <Check
                    size={12}
                    className="md:w-3.5 md:h-3.5"
                    strokeWidth={3}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 md:pt-6 border-t border-gray-200">
        <div className="flex justify-center md:justify-end">
          <button
            onClick={onSubmit}
            disabled={selectedStates.length === 0 || isSubmitting}
            className="w-full md:w-auto rounded-lg bg-[#FA660F] px-6 md:px-12 py-2.5 md:py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed cursor-pointer md:min-w-40 text-sm md:text-base"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-5 h-5 mx-auto" />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

type OnboardingStep = "course" | "states" | "schoolStudent";

const OnboardingCard = ({
  onComplete,
  onSchoolStudentComplete,
}: {
  onComplete?: () => void;
  onSchoolStudentComplete?: () => void;
}) => {
  // Opens straight on the course grid, exactly as it did before the school
  // student role existed. Picking the SSC tile forks to the school path.
  const [step, setStep] = useState<OnboardingStep>("course");
  // A visitor who came from "Start free CAT prep" sees the MBA tile already
  // highlighted; they still pick it (or another course) to continue.
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(
    readIntendedCourse
  );
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const {
    userId,
    setNeedsOnboarding,
    tempJwt,
    tempPhone,
    completeOnboarding,
    cancelOnboarding,
    completeSchoolStudentSignup,
  } = useAuthStore();
  const token = tempJwt || localStorage.getItem("jwt");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("🎯 OnboardingCard mounted!");
    document.body.classList.add("overflow-hidden");
    return () => {
      console.log("🚪 OnboardingCard unmounting...");
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  /**
   * The fork.
   *
   * A school course opens the school-student signup and NEVER touches
   * `selectedCourseName`: that value is the payload for `updateUser`, and a
   * school student has no `users` row to update — signup deletes it. Leaving it
   * unset keeps the two paths from sharing any state.
   */
  const handleCourseSelect = (course: CousrseApiLogin) => {
    if (isSchoolCourse(course)) {
      setStep("schoolStudent");
      return;
    }
    setSelectedCourseName(course.name);
    setTimeout(() => setStep("states"), 300);
  };

  const handleStateSelect = (stateName: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateName)
        ? prev.filter((s) => s !== stateName)
        : [...prev, stateName]
    );
  };

  const handleGoBack = () => {
    if (step === "states") setStep("course");
    if (step === "schoolStudent") setStep("course");
  };

  const handleClose = () => {
    cancelOnboarding();
    setNeedsOnboarding(false);
  };

  /**
   * The whole school-student path: one call, then the store swaps the temporary
   * `users` row for the schoolStudent identity. The card unmounts as soon as the
   * role changes, so navigation is handed back to the layout right after.
   */
  const handleSchoolStudentSubmit = async (payload: SchoolStudentSignupPayload) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await schoolStudentSignup(payload);
      completeSchoolStudentSignup(payload, response);

      // The only point in the SSC path where school and class exist together,
      // so the lead is captured here rather than at login. The backend upserts
      // by phone, so a later login re-sending a thinner version is harmless.
      captureSchoolStudentLead({
        phoneNumber: response.userId?.trim() || payload.phoneNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        school: payload.school,
        className: payload.className,
      });

      toast.success("Welcome to ProCounsel!");
      if (onSchoolStudentComplete) {
        onSchoolStudentComplete();
      }
    } catch (err) {
      console.error("School student signup error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create your account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const payload = {
    userInterestedStateOfCounsellors: selectedStates,
    interestedCourse: selectedCourseName,
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("Submitting preferences...", payload); // Debug log
      await updateUser(userId, payload, token);
      toast.success("Preferences saved successfully!");

      // Complete onboarding - this will move JWT from memory to localStorage
      completeOnboarding();
      forgetIntendedCourse();

      // Picking MBA makes the backend answer role "mbaStudent" from the next
      // login on; switch now so RevampLayout sends them to /mba straight away.
      if (isMbaCourse(selectedCourseName)) {
        const { user } = useAuthStore.getState();
        useAuthStore.setState({
          role: MBA_STUDENT_ROLE,
          ...(user ? { user: { ...user, role: MBA_STUDENT_ROLE } } : {}),
        });
        try {
          localStorage.setItem("role", MBA_STUDENT_ROLE);
        } catch {
          // localStorage may be unavailable; store state still holds the role.
        }
      }

      // Enrich the captured lead with the onboarding selections (backend upserts by phone)
      if (userId) {
        captureLeadFromUser(useAuthStore.getState().user, userId, {
          update: true,
          extra: {
            interestedCourseName: selectedCourseName || "",
            interestedStates: selectedStates,
          },
        });
      }

      // Delay closing the modal to allow toast to show
      setTimeout(() => {
        console.log(
          "🚪 Setting needsOnboarding to false and calling onComplete"
        );
        setNeedsOnboarding(false);
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    } catch (err) {
      console.error("Update user error:", err);
      const error =
        err instanceof Error ? err.message : "Failed to update preferences";
      toast.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // The course and states steps are long scrolling grids and want the tallest
  // dialog they can get. The role question and the school-student form are
  // short — stretching them to 90vh is what made the role card read as a
  // near-fullscreen panel holding two buttons, so those size to their content.
  const isCompactStep = step === "schoolStudent";

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-80">
        <div
          className={`w-full rounded-2xl bg-[#F5F7FA] shadow-lg flex flex-col relative ${
            isCompactStep
              ? "max-w-lg p-5 md:p-7 max-h-[92vh] overflow-y-auto"
              : "max-w-4xl p-4 md:p-8 max-h-[95vh] md:max-h-[90vh] h-full"
          }`}
        >
          {step === "schoolStudent" && (
            <SchoolStudentDetailsStep
              phoneNumber={userId || tempPhone || ""}
              onBack={handleGoBack}
              onClose={handleClose}
              onSubmit={handleSchoolStudentSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          {step === "course" && (
            <SelectCourseStep
              selectedCourseName={selectedCourseName}
              onCourseSelect={handleCourseSelect}
              setNeedsOnboarding={setNeedsOnboarding}
              cancelOnboarding={cancelOnboarding}
            />
          )}
          {step === "states" && (
            <SelectStatesStep
              selectedStates={selectedStates}
              onStateSelect={handleStateSelect}
              onBack={handleGoBack}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              setNeedsOnboarding={setNeedsOnboarding}
              cancelOnboarding={cancelOnboarding}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default OnboardingCard;
