import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Sparkles, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { MyAnswerItem } from '@/types/community';
import { formatTimeAgo } from '@/utils/time';
import { deleteAnswer } from '@/api/community';
import { useAuthStore } from '@/store/AuthStore';
import { toast } from 'react-hot-toast';
import EditAnswerModal from './EditAnswerModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface MyActivityAnswerCardProps {
  answerItem: MyAnswerItem;
  onAnswerUpdated?: () => void;
}

const MyActivityAnswerCard: React.FC<MyActivityAnswerCardProps> = ({ answerItem, onAnswerUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isLiked, setIsLiked] = useState(answerItem.answerLikedByMe || false);
  const [likesCount, setLikesCount] = useState(answerItem.likesCountOnAnswer || 0);

  useEffect(() => {
    setIsLiked(answerItem.answerLikedByMe || false);
    setLikesCount(answerItem.likesCountOnAnswer || 0);
  }, [answerItem]);

  const userImage = answerItem.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(answerItem.fullName)}`;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('.menu-container')) {
      e.stopPropagation();
      return;
    }
    if (answerItem.questionId) {
      navigate(`/community/question/${answerItem.questionId}`, {
        state: { from: 'my-activity' }
      });
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!token || !userId || !user) {
      toast.error('Please login to delete answer.');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await deleteAnswer(
        answerItem.myAnswerId,
        answerItem.questionId,
        userId,
        getCommunityRole(user),
        token
      );
      
      if (response.status === 'Success') {
        toast.success('Answer deleted successfully!');
        onAnswerUpdated?.(); // Refresh the list
        setIsDeleteModalOpen(false);
      } else {
        throw new Error(response.message || 'Failed to delete answer');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete answer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSuccess = () => {
    onAnswerUpdated?.();
  };

  const displayTimestamp = answerItem.answerUpdated 
    ? answerItem.answerUpdatedTimestamp 
    : answerItem.answerTimestamp;

  return (
    <div 
      onClick={handleClick}
      className="w-full max-w-[860px] mx-auto p-4 md:p-5 rounded-lg cursor-pointer bg-[#F5F6FF] border-b-2 border-white"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3 md:gap-4">
          <img loading="lazy" decoding="async"
            src={userImage}
            alt={answerItem.fullName}
            className="w-9 h-9 md:w-[42px] md:h-[42px] rounded-full"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-medium text-[#242645]">
                {answerItem.fullName}
              </span>
              {displayTimestamp?.seconds && (
                <span className="text-xs md:text-sm text-[#8C8CA1] md:ml-6">
                  {formatTimeAgo(displayTimestamp.seconds)}
                  {answerItem.answerUpdated && " (edited)"}
                </span>
              )}
            </div>
            <span className="text-sm text-[#242645]">
              {answerItem.interestedCourse || 'Student'}
            </span>
          </div>
        </div>
        <div className="relative menu-container" ref={menuRef}>
          <button
            onClick={handleMenuToggle}
            className="text-gray-500 cursor-pointer hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isDeleting}
          >
            <MoreVertical size={20} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-sm cursor-pointer text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 md:mt-[30px] text-base md:text-xl font-semibold text-[#242645] leading-snug md:leading-[26px]">
        {answerItem.question}
      </p>
      <p className="mt-2 text-sm md:text-lg font-medium text-[#242645]">
        Your Answer
      </p>

      <div className="mt-4">
        {answerItem.myAnswer && (
          <>
            <p
              className={`text-sm md:text-base leading-relaxed md:leading-[26px] mt-2 ${
                !isExpanded && answerItem.myAnswer && answerItem.myAnswer.length > 250 ? 'line-clamp-3' : ''
              }`}
            >
              {answerItem.myAnswer}
            </p>
            
            {!isExpanded && answerItem.myAnswer && answerItem.myAnswer.length > 250 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="font-semibold text-[#242645] underline cursor-pointer"
              >
                Read more
              </button>
            )}

            {answerItem.answerPhotoUrl && (
              <div className="mt-4">
                <img loading="lazy" decoding="async"
                  src={answerItem.answerPhotoUrl}
                  alt="Answer visual"
                  className="w-full h-auto max-h-[400px] rounded-lg object-cover"
                />
              </div>
            )}

            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="mt-1 font-semibold text-[#242645] underline"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
        <div className="flex items-center gap-6 text-gray-600">
          <button 
            className={`flex items-center gap-2 transition-colors cursor-pointer ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-sm">{likesCount}</span>
          </button>
          <button className="flex items-center gap-2 cursor-pointer">
            <MessageSquare size={18} />
            <span className="text-sm">{answerItem.commentCountOnAnswer || 0}</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <span className="text-sm">{answerItem.answerCount || 0} Answers</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Eye size={18} />
          <span className="text-sm">{answerItem.questionViews || 0}</span>
        </div>
      </div>

      <EditAnswerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        answerId={answerItem.myAnswerId}
        currentAnswer={answerItem.myAnswer}
        currentImageUrl={answerItem.answerPhotoUrl}
        onUpdateSuccess={handleUpdateSuccess}
      />

      {/* Added Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MyActivityAnswerCard;