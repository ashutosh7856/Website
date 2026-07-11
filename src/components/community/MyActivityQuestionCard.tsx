import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MoreVertical, Pencil, Trash2, Bookmark } from 'lucide-react';
import type { CommunityDashboardItem } from '@/types/community';
import { formatTimeAgo } from '@/utils/time';
import { useAuthStore } from '@/store/AuthStore';
import { deleteQuestion, bookmarkQuestion } from '@/api/community';
import { toast } from 'react-hot-toast';
import EditQuestionModal from './EditQuestionModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface MyActivityQuestionCardProps {
  question: CommunityDashboardItem;
  onQuestionUpdated?: () => void;
  isBookmarkView?: boolean;
}

const MyActivityQuestionCard: React.FC<MyActivityQuestionCardProps> = ({ 
  question, 
  onQuestionUpdated,
  isBookmarkView = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Menu & Modal States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user, userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isLiked, setIsLiked] = useState(question.answerLikedByMe || false);
  const [likesCount, setLikesCount] = useState(question.likesCountOnAnswer || 0);
  const [isBookmarked, setIsBookmarked] = useState(question.questionBookmarkedByMe || false);

  useEffect(() => {
    setIsLiked(question.answerLikedByMe || false);
    setLikesCount(question.likesCountOnAnswer || 0);
    setIsBookmarked(question.questionBookmarkedByMe || false);
  }, [question]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || !token) return;

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      const response = await bookmarkQuestion(
        userId,
        question.questionId,
        getCommunityRole(user),
        token
      );
      
      if (response.status === 'Success') {
        setIsBookmarked(response.isBookmarked);
        toast.success(response.message);
        if (isBookmarkView && !response.isBookmarked) {
             onQuestionUpdated?.();
        }
      } else {
        setIsBookmarked(previousState);
      }
    } catch (error) {
      console.error(error);
      setIsBookmarked(previousState);
      toast.error("Failed to update bookmark");
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEditClick = (e: React.MouseEvent) => {
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
    if (!userId || !token) {
      toast.error("Please login to delete.");
      return;
    }
    try {
      setIsDeleting(true);
      const response = await deleteQuestion(userId, question.questionId, token);
      
      if (response.status === 'Success') {
        toast.success("Question deleted successfully");
        setIsDeleteModalOpen(false);
        onQuestionUpdated?.();
      } else {
        toast.error(response.message || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('.menu-container')) {
      e.stopPropagation();
      return;
    }
    if (question.questionId) {
      navigate(`/community/question/${question.questionId}`, { 
        state: { from: 'my-activity' } 
      });
      
    }
  };

  const userImage = question.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(question.fullName)}`;
  const canEdit = (question.answerCount || 0) === 0;

  const displayTimestamp = question.questionUpdated 
    ? question.questionUpdatedTimestamp 
    : question.questionTimestamp;

  return (
    <>
      <div 
        onClick={handleClick}
        className="w-full max-w-[860px] mx-auto p-4 md:p-5 rounded-lg cursor-pointer bg-[#F5F6FF] border-b-2 border-white"
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3 md:gap-4">
            <img loading="lazy" decoding="async"
              src={userImage}
              alt={question.fullName}
              className="w-9 h-9 md:w-[42px] md:h-[42px] rounded-full object-cover"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-medium text-[#242645]">
                  {question.fullName}
                </span>
                {displayTimestamp?.seconds && (
                  <span className="text-xs md:text-sm text-[#8C8CA1] md:ml-4">
                    {formatTimeAgo(displayTimestamp.seconds)}
                    {question.questionUpdated && (
                      <span className="ml-1 text-xs italic">(edited)</span>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs md:text-sm text-[#242645]">
                {question.interestedCourse || 'Student'}
              </span>
            </div>
          </div>

          <div className="relative menu-container" ref={menuRef}>
            {isBookmarkView ? (
               <button 
                onClick={handleBookmark}
                className={`transition-colors cursor-pointer p-1 ${isBookmarked ? 'text-[#655E95]' : 'text-gray-500 hover:text-indigo-600'}`}
               >
                 <Bookmark size={24} fill={isBookmarked ? "#655E95" : "none"} />
               </button>
            ) : (
              <>
                <button
                  onClick={handleMenuToggle}
                  className="text-gray-500 cursor-pointer hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                    <button
                      onClick={handleEditClick}
                      disabled={!canEdit}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 
                        ${!canEdit ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}`}
                      title={!canEdit ? "Cannot edit question with answers" : ""}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                    
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 text-left text-sm cursor-pointer text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-4 md:mt-6 text-base md:text-xl font-semibold text-[#242645] leading-snug md:leading-[26px]">
          {question.question}
        </p>

        {question.topAnswer ? (
          <div className="mt-4">
            <p className={`text-sm md:text-base leading-relaxed md:leading-[26px] ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {question.topAnswer}
            </p>
            {!isExpanded && question.topAnswer.length > 250 && (
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className="font-semibold text-[#242645] underline cursor-pointer">
                Read more
              </button>
            )}
            {question.answerPhotoUrl && (
              <img loading="lazy" decoding="async" src={question.answerPhotoUrl} alt="Answer visual" className="mt-4 w-full h-auto max-h-[400px] rounded-lg object-cover" />
            )}
            {isExpanded && (
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="mt-1 font-semibold text-[#242645] underline">
                Show less
              </button>
            )}
          </div>
        ) : (
          question.question && question.question.length > 250 && (
            <div className="mt-4">
              <p className={`text-base text-[#242645] leading-[26px] ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {question.question}
              </p>
              {!isExpanded && (
                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className="font-semibold text-[#242645] underline cursor-pointer">
                  Read more
                </button>
              )}
              {isExpanded && (
                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="mt-1 font-semibold text-[#242645] underline">
                  Show less
                </button>
              )}
            </div>
          )
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center gap-6 text-gray-600">
            <button 
              className={`flex items-center gap-2 transition-colors cursor-pointer ${isLiked ? 'text-red-500' : ''}`}
              disabled={!question.topAnswerId}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-sm">{likesCount}</span>
            </button>
            <button className="flex items-center cursor-pointer gap-2">
              <img loading="lazy" decoding="async" src="/msg_comm.svg" alt="comment" />
              <span className="text-sm">{question.commentCountOnAnswer || 0}</span>
            </button>
            <div className="flex items-center gap-2">
              <img loading="lazy" decoding="async" src="/bulb_comm.svg" alt="answers" />
              <span className="text-sm">{question.answerCount || 0} Answers</span>
            </div>
          </div>
        </div>
      </div>

      <EditQuestionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        questionId={question.questionId}
        currentQuestion={question.question}
        onUpdateSuccess={() => onQuestionUpdated?.()} 
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
      />
    </>
  );
};

export default MyActivityQuestionCard;