import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/AuthStore';
import { addReply } from '@/api/community';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyToName: string;
  replyToUserId: string;
  commentId: string;
  replyToImage?: string | null; 
  replyToText?: string; 
}

const ReplyModal: React.FC<ReplyModalProps> = ({
  isOpen,
  onClose,
  replyToName,
  replyToUserId,
  commentId,
  replyToImage,
  replyToText,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    if (isOpen) {
      setReplyText('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!replyText.trim() || !userId || !user || !token) return;
    
    try {
      setIsLoading(true);
      
      await addReply(
        userId,
        replyToUserId,
        commentId,
        replyText,
        getCommunityRole(user),
        token
      );

      toast.success('Reply submitted successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit reply');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayImage = replyToImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(replyToName)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23232380] backdrop-blur-[35px] p-3 md:p-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[632px] p-6 md:p-10 bg-white rounded-2xl shadow-xl border border-[#EFEFEF] max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center cursor-pointer rounded-full text-black hover:bg-black hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center w-full mb-6">
          <h2 className="text-[20px] font-semibold text-[#343C6A]">Reply</h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
             <img loading="lazy" decoding="async" 
                src={displayImage} 
                className="w-8 h-8 rounded-full object-cover bg-gray-200" 
                alt="User"
             />
             <div>
                 <span className="text-sm text-gray-500">Replying to </span>
                 <span className="font-semibold text-[#242645]">{replyToName}</span>
             </div>
        </div>

        {replyToText && (
           <div className="mb-5 p-3 bg-[#F5F7FA] border-l-4 border-[#655E95] rounded-r-lg">
             <p className="text-sm text-[#242645] line-clamp-2 italic">
               "{replyToText}"
             </p>
           </div>
        )}

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-base font-semibold text-[#343C6A]">
            Your Comment
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a comment"
            className="w-full h-[120px] resize-none bg-[#F5F7FA] border border-[#EFEFEF] rounded-lg p-3
                       text-sm md:text-base font-medium text-[#242645]
                       placeholder:text-[#8C8CA180] placeholder:font-normal placeholder:text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#13097D]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!replyText.trim() || isLoading}
          className={`w-full h-12 mx-auto rounded-xl text-white font-semibold transition-all duration-300
                     flex items-center justify-center
                     ${
                       !replyText.trim() || isLoading
                         ? 'bg-[#242645] opacity-50 cursor-not-allowed'
                         : 'bg-[#655E95] hover:bg-opacity-90 cursor-pointer'
                     }`}
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Reply'}
        </button>
      </div>
    </div>
  );
};

export default ReplyModal;