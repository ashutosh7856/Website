import { useState } from 'react';
import type { User } from '@/types/user';
import type { CousrseApiLogin, StatesApiResponse } from '@/types/academic';
import { useAuthStore } from '@/store/AuthStore';
import { updateUser, getCoursesOnborading, getSates } from '@/api/auth';
import toast from 'react-hot-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PatchUser } from '@/types';

// Helper functions for styling - Removed unused functions

interface EditCourseViewProps {
  selectedCourse: string | null;
  onCourseSelect: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const EditCourseView: React.FC<EditCourseViewProps> = ({
  selectedCourse,
  onCourseSelect,
  onSubmit,
  isSubmitting,
}) => {
  const { data: courses = [], isLoading: loading } = useQuery({
    queryKey: ['coursesOnboarding'],
    queryFn: getCoursesOnborading,
    staleTime: 1000 * 60 * 5,
  });


  if (loading) {
    return (
      <div className="text-center p-10 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#13097D]" />
        <span className="ml-2 text-sm md:text-base">Loading courses...</span>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg md:text-2xl font-semibold md:font-bold text-[#343C6A] mb-3 md:mb-6">Select Preferred Course</h2>
      <div className="flex-1 overflow-y-auto pr-2 p-1">
        <div className="grid grid-cols-2 gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: CousrseApiLogin) => {
            const isSelected = selectedCourse === course.name;
            return (
              <button
                key={course.courseId}
                onClick={() => onCourseSelect(course.name)}
                className={`relative transform rounded-xl border p-3 md:p-5 text-center transition-all duration-200 hover:cursor-pointer ${
                  isSelected 
                    ? 'border-[#FA660F] bg-orange-50 shadow-lg ring-2 ring-[#FA660F] ring-offset-0' 
                    : 'bg-white hover:shadow-lg border-gray-200'
                }`}
              >
                <img loading="lazy" decoding="async" src={course.imageStorage} alt={`${course.name} icon`} className="mb-2 md:mb-4 h-16 w-16 md:h-24 md:w-24 object-contain mx-auto" />
                <h3 className={`text-sm md:text-lg font-bold ${isSelected ? 'text-[#FA660F]' : 'text-gray-800'} line-clamp-2`}>
                  {course.name}
                </h3> 
                <p className={`text-xs md:text-sm ${isSelected ? 'text-orange-600' : 'text-gray-500'} line-clamp-1`}>
                  {course.duration}
                </p>
                <p className={`mt-1 md:mt-2 text-xs md:text-sm ${isSelected ? 'text-orange-600' : 'text-gray-500'} line-clamp-2`}>
                  {course.tagline}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-[#FA660F] text-white">
                    <Check size={14} className="md:w-4 md:h-4" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-auto pt-4 md:pt-6 border-t border-gray-200">
        <div className="flex justify-center md:justify-end">
          <button
            onClick={onSubmit}
            className="w-full md:w-auto rounded-lg bg-[#FA660F] px-6 md:px-12 py-2.5 md:py-3 font-semibold text-white transition-colors hover:bg-orange-600 hover:cursor-pointer disabled:bg-orange-300 md:min-w-[160px] text-sm md:text-base"
            disabled={!selectedCourse || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Update Course'}
          </button>
        </div>
      </div>
    </>
  );
};

interface EditStatesViewProps {
  selectedStates: string[];
  onStateSelect: (stateName: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const EditStatesView: React.FC<EditStatesViewProps> = ({
  selectedStates,
  onStateSelect,
  onSubmit,
  isSubmitting,
}) => {
  const { data: states = [], isLoading: loading } = useQuery({
    queryKey: ['statesOnboarding'],
    queryFn: getSates,
    staleTime: 1000 * 60 * 5,
  });
  const isSelected = (name: string) => selectedStates.includes(name);

  if (loading) {
    return (
      <div className="text-center p-10 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#13097D]" />
        <span className="ml-2 text-sm md:text-base">Loading states...</span>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg md:text-2xl font-semibold md:font-bold text-[#343C6A] mb-3 md:mb-6">Select Preferred States</h2>
      <div className="flex-1 overflow-y-auto pr-2 p-1">
        <div className="grid grid-cols-2 gap-2 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((state: StatesApiResponse) => (
            <button
              key={state.name}
              onClick={() => onStateSelect(state.name)}
              className={`relative flex flex-col items-center justify-center hover:cursor-pointer rounded-xl border p-3 md:p-6 transition-colors duration-200
                ${
                  isSelected(state.name) ? 'border-transparent bg-[#13097D] text-white' : 'bg-white hover:shadow-lg border-gray-200'
                }`}
            >
              <img loading="lazy" decoding="async" src={state.imageStorage} alt={`${state.name} icon`} className="mb-2 md:mb-3 h-10 w-10 md:h-12 md:w-12 object-contain" />
              <h3 className="text-xs md:text-base font-semibold text-center line-clamp-2">{state.name}</h3>
              <div
                className={`absolute right-2 top-2 md:right-3 md:top-3 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded border-2 ${
                  isSelected(state.name) ? 'border-white bg-white text-[#13097D]' : 'border-gray-300'
                }`}
              >
                {isSelected(state.name) && <Check size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-4 md:pt-6 border-t border-gray-200">
        <div className="flex justify-center md:justify-end">
          <button
            onClick={onSubmit}
            className="w-full md:w-auto rounded-lg hover:cursor-pointer bg-[#FA660F] px-6 md:px-12 py-2.5 md:py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:bg-orange-300 md:min-w-[160px] text-sm md:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Update States'}
          </button>
        </div>
      </div>
    </>
  );
};

interface EditPreferencesModalProps {
  mode: 'course' | 'states';
  currentUser: User;
  onClose: () => void;
}

const EditPreferencesModal: React.FC<EditPreferencesModalProps> = ({ mode, currentUser, onClose }) => {
  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState(currentUser.interestedCourse || null);
  const [selectedStates, setSelectedStates] = useState(currentUser.userInterestedStateOfCounsellors || []);

  const { mutate: updateUserMutation, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: PatchUser) => {
      if (!userId || !token) throw new Error('Authentication error.');
      return updateUser(userId, payload, token);
    },
    onSuccess: () => {
      toast.success('Preferences updated!');
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setTimeout(onClose, 500);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update.');
    },
  });

  const handleCourseSelect = (name: string) => {
    setSelectedCourse(name);
  };

  const handleStateSelect = (stateName: string) => {
    setSelectedStates((prev: string[]) =>
      prev.includes(stateName)
        ? prev.filter((s: string) => s !== stateName)
        : [...prev, stateName]
    );
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const finalPayload: PatchUser = {
      interestedCourse: selectedCourse,
      userInterestedStateOfCounsellors: selectedStates || [],
    };

    updateUserMutation(finalPayload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 md:backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-[200]" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#F5F7FA] p-4 md:p-8 shadow-lg flex flex-col max-h-[95vh] md:max-h-[90vh] h-auto md:h-[700px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-600 hover:cursor-pointer hover:text-gray-900 z-10 p-1"><X size={20} className="md:w-6 md:h-6" /></button>
        
        {mode === 'course' && (
          <EditCourseView
            selectedCourse={selectedCourse}
            onCourseSelect={handleCourseSelect}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        
        {mode === 'states' && (
          <EditStatesView
            selectedStates={selectedStates}
            onStateSelect={handleStateSelect}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default EditPreferencesModal;