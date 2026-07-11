import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { User } from '@/types/user';
import { X, SquarePen, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadUserPhoto } from '@/api/user';
import { sendEmailOtp, verifyEmailOtp } from '@/api/auth';
import OtpVerificationModal from '@/components/counselor-signup/OtpVerificationModal';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: { firstName: string; lastName: string; email: string }) => Promise<void>;
  onUploadComplete: () => void;
  requireNameOnly?: boolean; // When true, only name is mandatory (for live sessions/reviews)
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose, onUpdate, requireNameOnly = false }) => {
  const isMandatory = requireNameOnly
  const location = useLocation();
  const isGuruCoolPage = location.pathname === '/gurucool';

  const skipEmailVerification = isGuruCoolPage;
  
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(!!user.email);
  const [isOtpModalOpen, setOtpModalOpen] = useState(false);
  const token = localStorage.getItem('jwt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const handleClose = () => {
    // If requireNameOnly mode (for live sessions/reviews), allow closing freely
    // The action won't proceed without name, but users can close the modal
    if (requireNameOnly) {
      onClose();
      return;
    }
    
    // For other modes, validate before closing
    if (isMandatory && !skipEmailVerification) {
      // If mandatory, only allow closing if name and email are filled
      if (!firstName.trim() || !email.trim()) {
        toast.error('Please complete your profile with name and email before continuing.');
        return;
      }
      if (email !== user.email && !isEmailVerified) {
        toast.error('Please verify your email before continuing.');
        return;
      }
    } else if (isMandatory || skipEmailVerification) {
      // For gurucool page, require name and email but no verification
      if (!firstName.trim() || !email.trim()) {
        toast.error('Please enter your name and email before continuing.');
        return;
      }
    }
    onClose();
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setIsEmailVerified(!!user.email);
      setPhotoPreview(null);
      setSelectedFile(null);
    }
  }, [user, isOpen]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Reset verification status when email changes
    if (e.target.value !== user.email) {
      setIsEmailVerified(false);
    } else {
      setIsEmailVerified(!!user.email);
    }
  };

  const handleVerifyEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      console.log('📧 Sending OTP to email:', email);
      await sendEmailOtp(email);
      setOtpModalOpen(true);
      toast.success('OTP sent to your email!');
    } catch (error) {
      console.error('❌ Failed to send email OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const handleOtpVerification = async (otp: string): Promise<boolean> => {
    try {
      console.log('🔐 Verifying email OTP...');
      await verifyEmailOtp(email, otp);
      setIsEmailVerified(true);
      toast.success('Email verified successfully!');
      setOtpModalOpen(false);
      return true;
    } catch (error) {
      console.error('❌ Email OTP verification failed:', error);
      toast.error('Invalid OTP. Please try again.');
      return false;
    }
  };

  const handleResendOtp = async () => {
    try {
      await sendEmailOtp(email);
      toast.success('OTP resent to your email!');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const handlePhotoEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If requireNameOnly mode (for live sessions/reviews), only require name
    if (requireNameOnly) {
      if (!firstName.trim()) {
        toast.error('Please enter your first name.');
        return;
      }
    } else if (skipEmailVerification) {
      // For gurucool page, require name and email but skip verification
      if (!firstName.trim() || !email.trim()) {
        toast.error('Please enter your name and email.');
        return;
      }
    } else {
      // For other pages, require both name and email
      if (!firstName.trim() || !email.trim()) {
        toast.error('Please fill in all required fields.');
        return;
      }

      // Check if email has changed and needs verification
      if (email !== user.email && !isEmailVerified) {
        toast.error('Please verify your email before saving.');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('📤 EditProfileModal: uploading photo and updating profile...');
      if (selectedFile && user.userName && token) {
        await uploadUserPhoto(user.userName, selectedFile, token);
        console.log('✅ Photo uploaded successfully');
      }
      
      await onUpdate({ firstName, lastName, email: email || user.email || "" });
      console.log('✅ Profile updated successfully');
      
      // The parent component (MainLayout) will handle closing the modal
      // by calling toggleProfileCompletion() after successful update
      onClose();
    } catch (error) {
      console.error('❌ EditProfileModal: Profile update failed:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayPhoto = photoPreview || user.photo || `https://ui-avatars.com/api/?name=${firstName}+${lastName}`;

  const ProfilePicture = ({ isMobile = false }) => (
    <div className={`relative ${isMobile ? 'w-[122px] h-[122px]' : 'w-40 h-40'} mx-auto mb-8`}>
      <img loading="lazy" decoding="async"
        src={displayPhoto}
        alt="Profile"
        className={`w-full h-full object-cover rounded-full border-2 border-white shadow-md`}
      />
      <button 
        type="button" 
        onClick={handlePhotoEditClick}
        className={`absolute bottom-1 right-1 bg-white rounded-md flex items-center justify-center border shadow-sm hover:bg-gray-100 ${isMobile ? 'w-5 h-5 p-0.5' : 'w-8 h-8'}`}
      >
        <SquarePen size={isMobile ? 14 : 16} className="text-[#343C6A] cursor-pointer" />
      </button>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-opacity-50 backdrop-blur-sm"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        style={{ display: 'none' }}
      />
      <div className="md:hidden h-full w-full bg-[#F5F5F7] flex flex-col">
        <header className="shrink-0 flex items-center p-4 bg-white border-b border-gray-200">
          <button onClick={handleClose} className="p-2 mr-2" type="button">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-[#343C6A]">Edit Profile</h2>
          {isMandatory && (
            <span className="ml-auto text-xs text-orange-600 font-medium">Required</span>
          )}
        </header>

        <div className="grow overflow-y-auto p-8">
          <ProfilePicture isMobile />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#2F303280] mb-1">
                First Name {requireNameOnly && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value.trim())}
                required={requireNameOnly}
                className="w-full h-11 px-4 bg-white border border-[#EFEFEF] rounded-xl text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#2F303280] mb-1">Last Name</label>
              <input 
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value.trim())}
                className="w-full h-11 px-4 bg-white border border-[#EFEFEF] rounded-xl text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#2F303280] mb-1">
                Email {(!requireNameOnly && (isMandatory || skipEmailVerification)) && <span className="text-red-500">*</span>}
              </label>
              <div className="relative h-11">
                <input 
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required={!requireNameOnly && (isMandatory || skipEmailVerification)}
                  className="h-full w-full px-4 pr-20 bg-white border border-[#EFEFEF] rounded-xl text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder={skipEmailVerification ? "Enter your email" : ""}
                />
                {!skipEmailVerification && (
                  <button 
                    type="button"
                    onClick={handleVerifyEmail} 
                    disabled={isEmailVerified || !email || isSubmitting}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${
                      isEmailVerified ? 'text-green-600 cursor-default' : 'text-blue-600 hover:text-blue-800 hover:cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    {isEmailVerified ? '✓ Verified' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
            <div className="pt-6">
               <button 
                  type="submit"
                  disabled={isSubmitting}
                className="w-full h-12 bg-(--text-main) text-white font-semibold text-base rounded-xl hover:opacity-90 hover:cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Profile'}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/*desktop-view*/}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="hidden md:block relative w-[747px] h-auto bg-[#F5F7FA] rounded-2xl shadow-lg border border-[#EFEFEF] py-6 px-[42px]"
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 hover:cursor-pointer" type="button">
          <X size={24} />
        </button>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#343C6A]">Edit Profile</h2>
          {isMandatory && (
            <span className="text-sm text-orange-600 font-medium">* Required fields</span>
          )}
        </div>
        <div className="bg-gradient-to-b from-[#8586a76c] to-white/50 rounded-2xl p-7">
          <ProfilePicture />
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#2F303280] mb-2">
                  First Name {requireNameOnly && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.trim())}
                  required={requireNameOnly}
                  className="w-full h-12 px-3 bg-white border border-[#EFEFEF] rounded-xl text-base text-[#718EBF] placeholder-[#718EBF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2F303280] mb-2">Last Name</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.trim())}
                  className="w-full h-12 px-3 bg-white border border-[#EFEFEF] rounded-xl text-base text-[#718EBF] placeholder-[#718EBF]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#2F303280] mb-2">
                  Email {(!requireNameOnly && (isMandatory || skipEmailVerification)) && <span className="text-red-500">*</span>}
                </label>
                <div className="relative h-12">
                  <input 
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    required={!requireNameOnly && (isMandatory || skipEmailVerification)}
                    placeholder={skipEmailVerification ? "Enter your email" : "your@email.com"}
                    className="w-full h-full px-3 pr-20 bg-white border border-[#EFEFEF] rounded-xl text-base text-[#718EBF] placeholder-[#718EBF]"
                  />
                  {!skipEmailVerification && (
                    <button 
                      type="button"
                      onClick={handleVerifyEmail} 
                      disabled={isEmailVerified || !email || isSubmitting}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold ${
                        isEmailVerified ? 'text-green-600 cursor-default' : 'text-blue-600 hover:text-blue-800 hover:cursor-pointer disabled:opacity-50'
                      }`}
                    >
                      {isEmailVerified ? '✓ Verified' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 text-center">
               <button 
                  type="submit"
                  disabled={isSubmitting}
                className="w-[50%] h-12 bg-(--text-main) text-white font-semibold text-base rounded-xl hover:cursor-pointer hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Profile'}
               </button>
            </div>
          </form>
        </div>
      </div>

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        otpLength={6}
        contactInfo={email}
        onVerify={handleOtpVerification}
        onResend={handleResendOtp}
        title="Verify Email"
        description="Enter the OTP sent to"
      />
    </div>
  );
};

export default EditProfileModal;