import { useState, useEffect } from "react";
import { Search, Check, ChevronLeft, Loader2, X } from "lucide-react";
import { getSates, getCoursesOnborading, updateUser } from "@/api/auth";
import toast from "react-hot-toast";
import type { CousrseApiLogin, StatesApiResponse } from "@/types";
import { useAuthStore } from "@/store/AuthStore";
import { captureLeadFromUser } from "@/api/leads";

interface SelectCourseStepProps {
  selectedCourseName: string | null;
  onCourseSelect: (name: string) => void;
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
                onClick={() => onCourseSelect(course.name)}
                className={`relative transform rounded-xl border p-3 md:p-5 text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#FA660F] bg-orange-50 shadow-lg ring-2 ring-[#FA660F] ring-offset-0"
                    : "bg-white hover:shadow-lg border-gray-200"
                }`}
              >
                <img loading="lazy" decoding="async"
                  src={course.imageStorage}
                  alt={`${course.name} icon`}
                  className="mb-2 md:mb-4 h-16 w-16 md:h-24 md:w-24 object-contain mx-auto"
                />
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

const OnboardingCard = ({ onComplete }: { onComplete?: () => void }) => {
  const [step, setStep] = useState(1);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(
    null
  );
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const {
    userId,
    setNeedsOnboarding,
    tempJwt,
    completeOnboarding,
    cancelOnboarding,
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

  const handleCourseSelect = (name: string) => {
    setSelectedCourseName(name);
    setTimeout(() => setStep(2), 300);
  };

  const handleStateSelect = (stateName: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateName)
        ? prev.filter((s) => s !== stateName)
        : [...prev, stateName]
    );
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
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

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-80">
        <div className="w-full max-w-4xl rounded-2xl bg-[#F5F7FA] p-4 md:p-8 shadow-lg flex flex-col max-h-[95vh] md:max-h-[90vh] h-full relative">
          {step === 1 && (
            <SelectCourseStep
              selectedCourseName={selectedCourseName}
              onCourseSelect={handleCourseSelect}
              setNeedsOnboarding={setNeedsOnboarding}
              cancelOnboarding={cancelOnboarding}
            />
          )}
          {step === 2 && (
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
