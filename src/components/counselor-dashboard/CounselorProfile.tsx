import { useEffect, useState, useRef } from 'react';
import { getCounselorProfileById, updateCounselorProfile, uploadCounselorPhoto } from '@/api/counselor-Dashboard';
import type { CounselorProfileData } from '@/types/counselorProfile';
import { X, Edit, CheckCircle2, Loader2, PenSquare, ChevronLeft } from 'lucide-react';
import type { User } from '@/types/user';
import EditableField from './EditableField';
import EditableWorkSchedule from './EditableWorkSchedule';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateTimeSlots } from '@/utils/time';
import toast from 'react-hot-toast';


const LANGUAGES_OPTIONS = [
  { label: 'English', value: 'English' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Marathi', value: 'Marathi' },
  { label: 'Bengali', value: 'Bengali' },
  { label: 'Malayalam', value: 'Malayalam' },
];

const WORKING_DAYS_OPTIONS = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

const STATE_OPTIONS = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
  { label: 'Assam', value: 'Assam' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh' },
  { label: 'Goa', value: 'Goa' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Manipur', value: 'Manipur' },
  { label: 'Meghalaya', value: 'Meghalaya' },
  { label: 'Mizoram', value: 'Mizoram' },
  { label: 'Nagaland', value: 'Nagaland' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Sikkim', value: 'Sikkim' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Tripura', value: 'Tripura' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Uttarakhand', value: 'Uttarakhand' },
  { label: 'West Bengal', value: 'West Bengal' },
  { label: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands' },
  { label: 'Chandigarh', value: 'Chandigarh' },
  { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
  { label: 'Ladakh', value: 'Ladakh' },
  { label: 'Lakshadweep', value: 'Lakshadweep' },
  { label: 'Puducherry', value: 'Puducherry' },
];

interface CounselorProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  token: string;
}

const SubscriptionPlan = ({ 
  name, price, seats, textColor, backgroundGradient, borderGradient }
  : { 
    name: string; 
    price: number; 
    seats: string; 
    textColor: string; 
    backgroundGradient: string; 
    borderGradient: string; }) => ( 
      <div 
        className="flex-1 md:w-[116px] h-auto md:h-[48px] rounded-lg p-2 md:p-[1px]" 
        style={{ background: borderGradient }} 
      > 
        <div 
          className="w-full h-full rounded-[7px] p-1 flex flex-col justify-center items-center text-center" 
          style={{ background: backgroundGradient }} 
        > 
          <p className={`text-[10px] md:text-xs ${textColor}`}> 
            <span className="font-normal">{name} </span> 
            <span className="font-medium">₹{price.toLocaleString('en-IN')}</span> 
          </p> 
          <p className="text-[10px] font-normal text-[#FA660F] mt-1 hidden md:block"> {seats} seats left </p> 
        </div> 
      </div>
    );

const START_TIME_OPTIONS = generateTimeSlots(8, 11, 30);
const END_TIME_OPTIONS = generateTimeSlots(15, 20, 30);

export default function CounselorProfile({ isOpen, onClose, user, token }: CounselorProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<Partial<CounselorProfileData>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();



  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { data: counselor, isLoading } = useQuery({
    queryKey: ['counselorProfile', user.userName],
    queryFn: () => getCounselorProfileById(user.userName!, token),
    enabled: isOpen && !!user.userName && !!token,
  });

  useEffect(() => {
    if (counselor) {
      setEditableData(counselor);
    }
  }, [counselor]);

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } = useMutation({
    mutationFn: (payload: Partial<CounselorProfileData>) => {
      return updateCounselorProfile(user.userName!, payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselorProfile', user.userName] });
      toast.success('Profile updated!');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  });

  const { mutateAsync: uploadPhotoMutation, isPending: isUploadingPhoto } = useMutation({
    mutationFn: (file: File) => {
      return uploadCounselorPhoto(user.userName!, file, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselorProfile', user.userName] });
      toast.success('Photo updated!');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo.');
    }
  });
  
  const isUpdating = isUpdatingProfile || isUploadingPhoto;



  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'city') {
      const defaultAddress = { role: null, officeNameFloorBuildingAndArea: null, city: null, state: null, pinCode: null, latCoordinate: null, longCoordinate: null };
      setEditableData(prev => ({...prev, fullOfficeAddress: {...defaultAddress, ...prev.fullOfficeAddress, city: value,},}));
    } else {
      setEditableData(prev => ({...prev, [name]: value,}));
    }
  };

  const handleMultiSelectChange = (name: string, value: string[]) => {
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };
  
  const handleUpdate = async () => {
    if (!user.userName) return;
    
    try {
      if (selectedFile) {
        await uploadPhotoMutation(selectedFile);
      }

      const payload: Partial<CounselorProfileData> = {
        organisationName: editableData.organisationName,
        stateOfCounsellor: editableData.stateOfCounsellor,
        languagesKnow: editableData.languagesKnow,
        description: editableData.description,
        experience: editableData.experience,
        fullOfficeAddress: editableData.fullOfficeAddress,
        workingDays: editableData.workingDays,
        officeStartTime: editableData.officeStartTime,
        officeEndTime: editableData.officeEndTime,
      };
      await updateProfileMutation(payload);

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Update failed", error);
    }
  };
  
  const getWorkingDays = () => {
      if (!counselor?.workingDays || counselor.workingDays.length === 0) return "Not specified";
      if (counselor.workingDays.length === 7) return "Mon - Sun";
      if (counselor.workingDays.length === 5 && ["Saturday", "Sunday"].every((d: string) => !counselor.workingDays.includes(d))) return "Mon - Fri";
      return counselor.workingDays.map((d: string) => d.slice(0, 3)).join(', ');
  }

  const planStyles = { plus: { textColor: 'text-[#1447E7]', backgroundGradient: 'linear-gradient(266.79deg, rgba(222, 237, 255, 0.4) 0.46%, rgba(126, 136, 211, 0.4) 130.49%)', borderGradient: 'linear-gradient(265.56deg, rgba(113, 142, 191, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)' }, pro: { textColor: 'text-[#1447E7]', backgroundGradient: 'linear-gradient(257.67deg, rgba(244, 232, 255, 0.4) 1.56%, rgba(250, 244, 255, 0.4) 100%)', borderGradient: 'linear-gradient(265.56deg, rgba(232, 212, 255, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)' }, elite: { textColor: 'text-[#B94C00]', backgroundGradient: 'linear-gradient(257.67deg, rgba(255, 245, 206, 0.4) 1.56%, rgba(255, 250, 230, 0.4) 100%)', borderGradient: 'linear-gradient(265.56deg, rgba(255, 251, 237, 0.4) -99.75%, rgba(234, 197, 145, 0.4) 91.52%)' } };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-0 md:p-4">
      <div className="relative w-full h-full md:max-w-[1000px] md:h-auto md:max-h-[95vh] overflow-y-auto scrollbar-hide bg-white rounded-none md:rounded-2xl shadow-lg p-0 md:p-10">        
        <div className="sticky top-0 md:static z-10 bg-white flex items-center justify-between p-4 md:p-0 border-b border-gray-100 md:border-none">
          <button
            onClick={onClose}
            className="block md:hidden text-gray-800 hover:cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-semibold text-lg md:text-2xl text-[#343C6A] md:absolute md:left-10 md:top-10">
            {isEditing ? 'Edit Profile' : 'Counsellor Profile'}
          </h2>
          <div className="md:absolute md:top-7 md:right-7">
            {!isEditing ? (
                <button 
                onClick={() => {
                  if (counselor) { 
                    setEditableData(counselor);
                    setIsEditing(true);
                  }
                } } 
                className="block md:hidden text-[#13097D] hover:cursor-pointer"
              >
                <Edit size={18} />
              </button>
            ) : (
              <div className="w-6 h-6 block md:hidden"></div>
            )}
            
              <button
              onClick={onClose}
              className="w-10 h-10 rounded-full items-center justify-center text-gray-800 transition-colors duration-200
                         bg-gray-100 hover:bg-black hover:text-white hover:cursor-pointer
                         hidden md:flex"
            >
              <X size={24} />
            </button>
          </div>
        </div>


        <div className="mt-0 md:mt-8 p-4 md:p-6 rounded-none md:rounded-2xl md:border md:border-[#EFEFEF]" style={{ background: 'linear-gradient(180deg, #F7F7FF 0%, #FFFFFF 100%)' }}>
          {isLoading ? ( <div className="h-[574px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div> ) : !counselor ? ( <div className="h-[574px] flex items-center justify-center">Failed to load profile.</div> ) : (
            <>
              <div className="relative flex flex-col items-center md:flex-row md:items-start gap-4 md:gap-8">
                <div className="relative w-24 h-24 md:w-[155px] md:h-[155px] shrink-0">
                  <img loading="lazy" decoding="async"
                    src={previewUrl || counselor.photoUrl || '/counselor.png'}
                    alt={`${counselor.firstName} ${counselor.lastName}`}
                    className="w-full h-full rounded-full border-2 border-white object-cover shadow-md"
                  />
                  {isEditing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 md:bottom-1 md:right-1 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors hover:cursor-pointer"
                        aria-label="Edit profile picture"
                      >
                        <PenSquare className="w-4 h-4 md:w-5 md:h-5 text-[#13097D]" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                        className="hidden"
                        accept="image/png, image/jpeg"
                      />
                    </>
                  )}
                </div>

                <div className="flex-1 mt-2 text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">{`${counselor.firstName} ${counselor.lastName}`}</h3>
                  <p className="text-sm md:text-base text-[#718EBF] mt-1">Career Counsellor, {isEditing ? editableData.experience : counselor.experience}+ years of experience</p>
                  
                  <p className={`text-sm text-gray-600 mt-3 max-w-2xl ${isEditing ? 'hidden md:block' : ''}`}>
                    {isEditing ? editableData.description : counselor.description}
                  </p>
                  
                  <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2"> <span className="text-[#232323]">Email:</span> <span className="text-[#718EBF]">{counselor.email}</span> {counselor.emailOtpVerified && <CheckCircle2 size={16} className="text-green-500" />} </div>
                    <div className="flex items-center gap-2"> <span className="text-[#232323]">Contact:</span> <span className="text-[#718EBF]">{counselor.phoneNumber}</span> {counselor.phoneOtpVerified && <CheckCircle2 size={16} className="text-green-500" />} </div>
                  </div>
                </div>

                 {!isEditing && (
                    <button onClick={() => {
                      if (counselor) {
                        setEditableData(counselor);
                        setIsEditing(true);
                      }
                    }} className="absolute top-0 right-0 items-center gap-2 text-[#13097D] font-semibold text-sm md:text-base
                                /* This class hides it on mobile */
                                hidden md:flex hover:cursor-pointer"> 
                        <Edit size={18} />
                        <span className="hidden md:block">Edit</span>
                    </button>
                 )}
              </div>



              <div className="my-6 md:my-8">
                  {/* --- EDITABLE FIELDS GRID (Updated) --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
              
              {/* Bio field, only visible on mobile when editing */}
                {isEditing && (
                  <div className="block md:hidden">
                    <EditableField 
                      label="Bio" 
                      name="description" 
                      value={editableData.description || ''} 
                      isEditing={isEditing} 
                      onChange={handleInputChange} 
                      as="textarea"
                    />
                  </div>
                )}
                
                <EditableField 
                  label="Address" 
                  name="city" 
                  value={editableData.fullOfficeAddress?.city || ''} 
                  isEditing={isEditing} 
                  onChange={handleInputChange} 
                  as="textarea"
                />
                
                <EditableField 
                  label="Location" 
                  name="stateOfCounsellor" 
                  value={editableData.stateOfCounsellor || []} 
                  isEditing={isEditing}
                  as="multiselect"
                  multiSelectOptions={STATE_OPTIONS}
                  onMultiChange={(selected) => handleMultiSelectChange('stateOfCounsellor', selected)}
                />
                
                <EditableField 
                  label="Organisation" 
                  name="organisationName" 
                  value={editableData.organisationName || ''} 
                  isEditing={isEditing} 
                  onChange={handleInputChange} 
                />

                {/* --- Working Days & Time --- */}
                <EditableWorkSchedule 
                  isEditing={isEditing}
                  data={editableData}
                  onChange={handleInputChange}
                  onMultiChange={handleMultiSelectChange}
                  daysOptions={WORKING_DAYS_OPTIONS}
                  startTimeOptions={START_TIME_OPTIONS}
                  endTimeOptions={END_TIME_OPTIONS}
                  displayValue={isLoading || !counselor ? 'Loading...' : `${getWorkingDays()}, ${counselor.officeStartTime} - ${counselor.officeEndTime}`}
                />
                
                <EditableField 
                  label="Languages" 
                  name="languagesKnow" 
                  value={editableData.languagesKnow || []} 
                  isEditing={isEditing}
                  as="multiselect"
                  multiSelectOptions={LANGUAGES_OPTIONS}
                  onMultiChange={(selected) => handleMultiSelectChange('languagesKnow', selected)}
                />
                
                <div>
                  <label className="text-xs md:text-sm text-[#858585] md:text-[#232323]">Subscription Plans</label>
                  <div className="mt-1 md:mt-2 flex flex-row gap-2 md:gap-4">
                      <SubscriptionPlan name="Plus" price={counselor.plusAmount} seats={counselor.plusSeats} {...planStyles.plus} />
                      <SubscriptionPlan name="Pro" price={counselor.proAmount} seats={counselor.proSeats} {...planStyles.pro} />
                      <SubscriptionPlan name="Elite" price={counselor.eliteAmount} seats={counselor.eliteSeats} {...planStyles.elite} />
                  </div>
                </div>
              </div>
              

              </div>
              
              {isEditing && (
                <div className="sticky md:static bottom-0 -mx-4 -mb-4 md:mx-0 md:mb-0 p-4 bg-white md:mt-8 
                              flex flex-col md:flex-row md:justify-end gap-4 border-t border-gray-100">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 md:flex-none px-6 py-2.5 md:py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold block hover:cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleUpdate}
                        disabled={isUpdating}
                      className="flex-1 md:flex-none md:w-auto px-6 py-2.5 text-nowrap md:py-2 rounded-lg bg-[#13097D] text-white font-semibold flex items-center justify-center gap-2 disabled:bg-indigo-300 hover:cursor-pointer"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" /> : 'Update Profile'}
                    </button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
    </div>
  );
}