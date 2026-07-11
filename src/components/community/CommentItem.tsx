import { getCommunityRole } from '@/lib/communityRole';
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { getRepliesForComment, likeComment } from '@/api/community';
import type { Comment, CommentReply } from '@/types/community';
import { toast } from 'react-hot-toast';
import ReplyItem from './ReplyItem';
import { formatTimeAgo } from '@/utils/time';

interface CommentItemProps {
  comment: Comment;
  onReplyClick: (
      targetId: string, 
      userName: string, 
      targetUserId: string, 
      userImage: string | null, 
      text: string, 
      parentCommentId: string
  ) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplyClick }) => {
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  
  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isLiked, setIsLiked] = useState(comment.commentLikedByMe || false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

  const userImage = comment.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userFullName)}`;

  const handleCommentLike = async () => {
    if (!userId || !token) {
      toast.error("Please login to like");
      return;
    }
    const previousLikedState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLikedState);
    setLikesCount(previousLikedState ? previousCount - 1 : previousCount + 1);

    try {
      const response = await likeComment(userId, comment.commentId, getCommunityRole(user), token);
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
      toast.error("Failed to like comment");
    }
  };

  const handleViewReplies = async () => {
    if (areRepliesVisible) {
      setAreRepliesVisible(false);
      return;
    }
    if (replies && replies.length > 0) {
      setAreRepliesVisible(true);
      return;
    }
    if (!userId || !token) return;

    try {
      setIsLoadingReplies(true);
      const response = await getRepliesForComment(comment.commentId, userId, token);
      if (response.status === 'Success') {
        setReplies(response.data.replies || []);
        setAreRepliesVisible(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const shouldShowReplyButton = comment.replyCount === undefined || comment.replyCount > 0;

  const displayTimestamp = comment.updated 
    ? comment.updatedCommentTimestamp 
    : comment.commentTimestamp;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <img loading="lazy" decoding="async" src={userImage} alt={comment.userFullName} className="w-8 h-8 rounded-full bg-[#D9D9D9] shrink-0 mt-1" />
        <div className="flex flex-col w-full">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-[Montserrat] font-semibold text-sm md:text-[16px] text-[#242645] leading-[125%]">
                    {comment.userFullName}
                </span>
                {displayTimestamp?.seconds && (
                  <span className="text-xs text-[#8C8CA1] ml-2">
                    {formatTimeAgo(displayTimestamp.seconds)}
                    {comment.updated && " (edited)"}
                  </span>
                )}
            </div>
            <p className="font-[Montserrat] font-normal text-xs md:text-sm text-[#8C8CA1] leading-[125%] mt-1">
                {comment.commentText}
            </p>
            
            <div className="flex items-center justify-between mt-2">
                <div className="flex gap-4 text-xs md:text-sm font-medium text-[#242645]">
                     <button 
                        onClick={() => 
                            onReplyClick(
                                comment.commentId, 
                                comment.userFullName, 
                                comment.userIdCommented, 
                                userImage, 
                                comment.commentText, 
                                comment.commentId
                            )
                        }
                        className="hover:underline cursor-pointer"
                     >
                        Reply
                     </button>
                     
                     {shouldShowReplyButton && (
                       <button onClick={handleViewReplies} className="text-[#8C8CA1] hover:text-[#242645] transition-colors cursor-pointer">
                          {isLoadingReplies ? 'Loading...' : (areRepliesVisible ? 'Hide replies' : 'View replies')}
                       </button>
                     )}
                </div>

                <button onClick={handleCommentLike} className="flex items-center gap-1 transition-colors cursor-pointer hover:opacity-75">
                    <Heart size={14} fill={isLiked ? "#F44336" : "none"} color={isLiked ? "#F44336" : "#F44336"} />
                    <span className={`text-xs font-bold ${isLiked ? "text-[#F44336]" : "text-[#F44336]"}`}>{likesCount}</span>
                </button>
            </div>
        </div>
      </div>

      {areRepliesVisible && replies?.length > 0 && (
        <div className="pl-10 md:pl-12 flex flex-col gap-3 mt-2">
           {replies.map((reply) => (
               <ReplyItem 
                 key={reply.replyId} 
                 reply={reply} 
                 onReplyClick={(rId, rName, rUid, rImage, rText) => 
                     onReplyClick(rId, rName, rUid, rImage, rText, comment.commentId)
                 }
               />
           ))}
        </div>
      )}
      {areRepliesVisible && (!replies || replies.length === 0) && !isLoadingReplies && (
         <div className="pl-12 text-xs text-gray-400 italic">No replies yet.</div>
      )}
    </div>
  );
};

export default CommentItem;