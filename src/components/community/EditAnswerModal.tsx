import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { updateAnswer } from '@/api/community';
import { toast } from 'react-hot-toast';

interface EditAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  answerId: string;
  currentAnswer: string;
  currentImageUrl: string | null;
  onUpdateSuccess: () => void;
}

const EditAnswerModal: React.FC<EditAnswerModalProps> = ({
  isOpen,
  onClose,
  answerId,
  currentAnswer,
  currentImageUrl,
  onUpdateSuccess,
}) => {
  const [yourAnswer, setYourAnswer] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    if (isOpen) {
      setYourAnswer(currentAnswer || '');
      setSelectedImage(null);
      setPreviewUrl(currentImageUrl || null);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, currentAnswer, currentImageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateAnswer = async () => {
    if (!yourAnswer.trim() && !selectedImage && !currentImageUrl) {
      toast.error('Please write an answer or add an image.');
      return;
    }

    if (!userId || !token || !user) {
      toast.error('Please login to update answer.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await updateAnswer(
        answerId,
        yourAnswer,
        userId,
        getCommunityRole(user),
        token,
        selectedImage
      );

      if (response && response.answerId) {
        toast.success('Answer updated successfully!');
        onUpdateSuccess();
        onClose();
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
      toast.error(err.message || 'Failed to update answer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitDisabled = (!yourAnswer.trim() && !selectedImage && !currentImageUrl) || isLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23232380] backdrop-blur-[35px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[632px] p-10 bg-white rounded-2xl shadow-xl border border-[#EFEFEF]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 w-9 h-9 flex items-center cursor-pointer justify-center rounded-full text-black hover:bg-black hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center w-full mb-6">
          <h2 className="text-[20px] font-semibold text-[#343C6A]">
            Edit Answer
          </h2>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-center">
            <label
              htmlFor="yourAnswer"
              className="text-base font-semibold text-[#343C6A]"
            >
              Your Answer <span className="text-red-500">*</span>
            </label>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1 text-sm font-medium cursor-pointer text-[#655E95] hover:text-[#4A4478] transition-colors"
            >
              <ImagePlus size={18} />
              {selectedImage ? 'Change Image' : 'Add Image'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <textarea
            id="yourAnswer"
            value={yourAnswer}
            onChange={(e) => setYourAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={previewUrl ? 4 : 6}
            className="w-full resize-none bg-[#F5F7FA] border border-[#EFEFEF] rounded-lg p-3
                       text-base font-medium text-[#242645]
                       placeholder:text-[#8C8CA180] placeholder:font-normal placeholder:text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#13097D]"
          />

          {previewUrl && (
            <div className="relative mt-2 w-fit">
              <img loading="lazy" decoding="async" 
                src={previewUrl} 
                alt="Selected upload" 
                className="max-h-[150px] rounded-lg border border-[#EFEFEF] object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-100 rounded-full 
                           text-red-500 shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center -mb-2">{error}</p>
        )}

        <button
          onClick={handleUpdateAnswer}
          disabled={isSubmitDisabled}
          className={`w-[335px] h-12 mx-auto mt-6 rounded-xl text-white font-semibold transition-all duration-300
                     flex items-center justify-center
                     ${
                       isSubmitDisabled
                         ? 'bg-[#242645] opacity-50 cursor-not-allowed'
                         : 'bg-[#655E95] hover:bg-opacity-90 cursor-pointer'
                     }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Updating...
            </>
          ) : (
            'Update Answer'
          )}
        </button>
      </div>
    </div>
  );
};

export default EditAnswerModal;

