import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Stepper from "./StepCounter";
import Step1Card from "./Step1Card";
import { useState, type JSX } from "react";
import Step2Card from "./Step2Card";
import Step3Card from "./Step3Card";
import { uploadCourseData, type CourseData } from '@/api/course';
import toast from 'react-hot-toast';
import { useAuthStore } from "@/store/AuthStore";

type Step1Data = {
  courseName: string;
  description: string;
  thumbnail: File | null;
  category: string;
  courseTimeHours: string;
  courseTimeMinutes: string;
};

type Step2Data = {
  courseDurationType: string;
  coursePrice: string;
  discount: string;
  coursePriceAfterDiscount: number;
};

export default function CreateCourseCard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<number>(1);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [courseCreated, setCourseCreated] = useState(false);
  const {userId} = useAuthStore()

  const [step1Data, setStep1Data] = useState<Step1Data>({
    courseName: '',
    description: '',
    thumbnail: null,
    category: '',
    courseTimeHours: '',
    courseTimeMinutes: '',
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    courseDurationType: '',
    coursePrice: '',
    discount: '',
    coursePriceAfterDiscount: 0,
  });

  const validateStep1 = (): boolean => {
    if (!step1Data.courseName.trim()) {
      toast.error('Please enter course name');
      return false;
    }
    if (!step1Data.description.trim()) {
      toast.error('Please enter description');
      return false;
    }
    if (!step1Data.thumbnail) {
      toast.error('Please upload a thumbnail');
      return false;
    }
    // if (!step1Data.category) {
    //   toast.error('Please select a category');
    //   return false;
    // }
    if (!step1Data.courseTimeHours || !step1Data.courseTimeMinutes) {
      toast.error('Please enter course duration');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!step2Data.courseDurationType.trim()) {
      toast.error('Please enter course duration type');
      return false;
    }
    if (!step2Data.coursePrice) {
      toast.error('Please enter course price');
      return false;
    }
    return true;
  };

  const handleSubmitCourse = async () => {
    // Prevent multiple submissions
    if (courseCreated || courseId) {
      toast.error('Course already created! Moving to content management...');
      setStep(3);
      return;
    }

    if (!step1Data.thumbnail) {
      toast.error('Thumbnail is required');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating your course...');

    try {
      const counsellorId = userId as string;

      const courseData: CourseData = {
        counsellorId,
        courseName: step1Data.courseName,
        description: step1Data.description,
        category: 'COURSE',
        courseTimeHours: parseInt(step1Data.courseTimeHours),
        courseTimeMinutes: parseInt(step1Data.courseTimeMinutes),
        courseDurationType: step2Data.courseDurationType,
        coursePrice: parseFloat(step2Data.coursePrice),
        discount: parseFloat(step2Data.discount) || 0,
        coursePriceAfterDiscount: step2Data.coursePriceAfterDiscount,
      };

      const response = await uploadCourseData(courseData, step1Data.thumbnail);

      if (response.status && response.courseId) {
        setCourseId(response.courseId);
        setCourseCreated(true); 
        toast.success('Course created successfully! Now add your content.', { id: toastId });
        
        setTimeout(() => {
          setStep(3);
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error uploading course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload course data',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = ():JSX.Element => {
    switch(step){
      case 1:
        return <Step1Card data={step1Data} onChange={setStep1Data} />
      case 2:
        return <Step2Card data={step2Data} onChange={setStep2Data} />
      case 3:
        return <Step3Card courseId={courseId || ''} />
      default:
        return <Step1Card data={step1Data} onChange={setStep1Data} />
    }
  }
    return (
        <div className="fixed inset-0 z-70 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
        <div 
        className="flex items-center flex-col gap-4 md:gap-8 w-full max-w-250 max-h-[95vh] md:max-h-fit bg-[#F5F7FA] rounded-2xl shadow-xl p-3 md:p-6 relative overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:cursor-pointer">
          <X size={20} />
        </button>

        <h1 className="text-[#343C6A] text-2xl font-semibold">Create Course</h1>
        <Stepper currentStep={step}/>

        {currentCard()}
        
       
         <div className="flex justify-between w-full">
            <button 
              onClick={()=>{
               if(step>1){
                setStep(prev => prev-1)
              }
            }
          }
            disabled={step === 1}
            className='flex gap-3 items-center py-2 px-6 border hover:cursor-pointer rounded-[12px] font-semibold text-[#655E95] border-[#655E95] disabled:opacity-50 disabled:cursor-not-allowed'>
                <ChevronLeft/>
                Prev
            </button>

            <button 
            onClick={async ()=>{
              if(step === 1){
                if(validateStep1()){
                  setStep(2);
                }
              } else if(step === 2){
                if(validateStep2()){
                  if(!courseCreated && !courseId) {
                    await handleSubmitCourse();
                  } else {
                    setStep(3);
                  }
                }
              } else if(step === 3){
                // Publish the course
                setIsLoading(true);
                const toastId = toast.loading('Publishing course...');
                try {
                  const { publishCourse } = await import('@/api/course');
                  const message = await publishCourse({
                    counsellorId: userId as string,
                    courseId: courseId as string
                  });
                  toast.success(message || 'Course published successfully!', { id: toastId });
                  setTimeout(() => {
                    onClose();
                  }, 1000);
                } catch (error) {
                  console.error('Error publishing course:', error);
                  toast.error(
                    error instanceof Error ? error.message : 'Failed to publish course',
                    { id: toastId }
                  );
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            disabled={isLoading}
            className='flex items-center gap-3 py-2 px-6 border bg-[#655E95] font-semibold rounded-[12px] text-[1rem] text-white hover:bg-[#534a7d] hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                {step === 3 ? (isLoading ? 'Publishing...' : 'Publish') : isLoading ? 'Creating...' : step === 2 ? 'Create Course' : 'Next'}
                <ChevronRight/>
            </button>
        </div>
      </div>
        </div>
    );
}

