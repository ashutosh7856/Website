import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, SendHorizontal, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { getCommentsForAnswer, addComment, likeAnswer, deleteAnswer } from '@/api/community';
import type { Answer, Comment } from '@/types/community';
import { formatTimeAgo } from '@/utils/time';
import CommentItem from './CommentItem';
import ReplyModal from './ReplyModal';
import EditAnswerModal from './EditAnswerModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { toast } from 'react-hot-toast';

interface AnswerCardProps {
  answer: Answer;
  questionId: string;
  onAnswerUpdated?: () => void;
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, questionId, onAnswerUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReplyToName, setActiveReplyToName] = useState('');
  const [activeCommentId, setActiveCommentId] = useState('');
  const [activeReplyToUserId, setActiveReplyToUserId] = useState('');
  const [activeReplyToImage, setActiveReplyToImage] = useState<string | null>(null);
  const [activeReplyToText, setActiveReplyToText] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isLiked, setIsLiked] = useState(answer.answerLikedByMe || false);
  const [likesCount, setLikesCount] = useState(answer.likesCountOnAnswer || 0);

  useEffect(() => {
    setIsLiked(answer.answerLikedByMe || false);
    setLikesCount(answer.likesCountOnAnswer || 0);
  }, [answer]);

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

  const answererImage = answer.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(answer.userFullName)}`;
  const loggedInUserImage = user?.photoSmall || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || 'User')}`;
  const answerPhoto = answer.answerPhotoUrlList && answer.answerPhotoUrlList.length > 0 ? answer.answerPhotoUrlList[0] : null;

  const handleLike = async () => {
    if (!userId || !token) {
      toast.error("Please login to like answers");
      return;
    }

    const previousLikedState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLikedState);
    setLikesCount(previousLikedState ? previousCount - 1 : previousCount + 1);

    try {
      const response = await likeAnswer(
        userId,
        answer.answerId,
        getCommunityRole(user),
        token
      );

      if (response.status === 'Success') {
        setIsLiked(response.isLiked);
      } else {
        setIsLiked(previousLikedState);
        setLikesCount(previousCount);
      }
    } catch (error) {
      console.error(error);
      setIsLiked(previousLikedState);
      setLikesCount(previousCount);
      toast.error("Failed to update like");
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await getCommentsForAnswer(
        answer.answerId,
        userId ?? undefined,
        token ?? undefined
      );
      if (response.status === 'Success') {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentsClick = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    if (!comments || comments.length === 0) {
      await fetchComments();
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !userId || !token || !user) return;

    try {
      setIsPostingComment(true);
      
      await addComment(
        userId,
        answer.answerId,
        newCommentText,
        getCommunityRole(user),
        token
      );

      toast.success('Comment posted!');
      setNewCommentText('');
      
      const textarea = document.querySelector(`#comment-textarea-${answer.answerId}`) as HTMLTextAreaElement;
      if (textarea) textarea.style.height = 'auto';

      await fetchComments();

    } catch (error) {
      console.error(error);
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleOpenReplyModal = (
    _targetId: string, 
    userName: string, 
    targetUserId: string, 
    userImage: string | null, 
    text: string,
    parentCommentId: string,
  ) => {
      setActiveCommentId(parentCommentId);
      setActiveReplyToName(userName);
      setActiveReplyToUserId(targetUserId);
      setActiveReplyToImage(userImage);
      setActiveReplyToText(text);
      setReplyModalOpen(true);
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewCommentText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
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
      toast.error('You must be logged in to delete.');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteAnswer(
        answer.answerId,
        questionId,
        userId, 
        getCommunityRole(user), 
        token
      );
      
      if (response.status === 'Success') {
        toast.success('Answer deleted successfully!');
        onAnswerUpdated?.();
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

  const displayTimestamp = answer.answerUpdated 
    ? answer.updatedAnswerTimestamp 
    : answer.answerTimestamp;

  return (
    <div className="w-full max-w-[860px] mx-auto p-4 md:p-5 rounded-lg bg-[#F5F6FF] border-b-2 border-white mb-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 md:gap-4">
          <img loading="lazy" decoding="async"
            src={answererImage}
            alt={answer.userFullName}
            className="w-9 h-9 md:w-[42px] md:h-[42px] rounded-full object-cover"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-medium text-[#242645]">
                {answer.userFullName}
              </span>
              <span className="text-xs md:text-sm text-[#8C8CA1] md:ml-6">
                {formatTimeAgo(displayTimestamp.seconds)}
                {answer.answerUpdated && <span className="ml-1 text-xs">(edited)</span>}
              </span>
            </div>
            <span className="text-sm text-[#242645]">
              {answer.userInterestedCourse || 'Student'}
            </span>
          </div>
        </div>
        {answer.myAnswer && (
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
                  className="w-full px-4 py-2 text-left cursor-pointer text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
        )}
      </div>

      <div className="mt-4">
        <p className={`text-sm md:text-base text-[#242645] leading-relaxed md:leading-[26px] ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {answer.answer}
        </p>
        {!isExpanded && answer.answer.length > 250 && (
          <button onClick={() => setIsExpanded(true)} className="font-semibold text-[#242645] underline cursor-pointer">Read more</button>
        )}
        {answerPhoto && (
          <img loading="lazy" decoding="async" src={answerPhoto} alt="Answer visual" className="mt-4 w-full h-auto max-h-[400px] rounded-lg object-cover" />
        )}
        {isExpanded && (
          <button onClick={() => setIsExpanded(false)} className="mt-1 font-semibold text-[#242645] underline cursor-pointer">Show less</button>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
        <div className="flex items-center gap-6 text-gray-600">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-sm">{likesCount}</span>
          </button>
          <button 
            onClick={handleCommentsClick}
            className={`flex items-center cursor-pointer gap-2 hover:text-indigo-600 ${showComments ? 'text-indigo-600' : ''}`}
          >
            <MessageSquare size={18} />
            <span className="text-sm">{answer.commentCountOnAnswer}</span>
          </button>
        </div>
      </div>

      {showComments && (
          <div className="mt-6 pt-4 border-t border-gray-200 animate-in fade-in duration-200">
              <h3 className="font-[Montserrat] font-semibold text-[16px] text-[#242645] mb-4">
                  Comments
              </h3>

              <div className="flex gap-3 mb-8 relative">
                  <img loading="lazy" decoding="async" 
                     src={loggedInUserImage}
                     className="w-7 h-7 rounded-3xl bg-[#D9D9D9] mt-1"
                  />
                  <div className="flex-1 relative">
                       <textarea
                          id={`comment-textarea-${answer.answerId}`}
                          value={newCommentText}
                          onChange={handleInputResize}
                          placeholder="Add a comment"
                          rows={1}
                          disabled={isPostingComment}
                          className="w-full min-h-10 py-2 px-4 pr-10 rounded-[12px] border border-[#EFEFEF] bg-white
                                     resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-[#13097D]
                                     text-sm font-[Montserrat] disabled:opacity-50"
                       />
                       {newCommentText.trim() && (
                           <button 
                              onClick={handlePostComment}
                              disabled={isPostingComment}
                              className="absolute right-3 top-2 text-[#13097D] hover:text-indigo-800 cursor-pointer disabled:opacity-50"
                           >
                               {isPostingComment ? <Loader2 size={20} className="animate-spin"/> : <SendHorizontal size={24} />}
                           </button>
                       )}
                  </div>
              </div>

              {isLoadingComments ? (
                  <div className="text-center py-4 text-gray-500">Loading comments...</div>
              ) : (
                  <div className="flex flex-col gap-6">
                      {comments?.length > 0 ? comments.map(comment => (
                          <CommentItem 
                             key={comment.commentId} 
                             comment={comment}
                             onReplyClick={handleOpenReplyModal} 
                          />
                      )) : (
                          <div className="text-gray-400 text-sm italic ml-10">No comments yet.</div>
                      )}
                  </div>
              )}
          </div>
      )}

      <ReplyModal 
         isOpen={replyModalOpen}
         onClose={() => setReplyModalOpen(false)}
         replyToName={activeReplyToName}
         replyToUserId={activeReplyToUserId}
         commentId={activeCommentId}
         replyToImage={activeReplyToImage}
         replyToText={activeReplyToText}
      />

      {answer.myAnswer && (
        <EditAnswerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          answerId={answer.answerId}
          currentAnswer={answer.answer}
          currentImageUrl={answerPhoto}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AnswerCard;