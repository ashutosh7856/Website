import { getCommunityRole } from '@/lib/communityRole';
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { likeReply } from '@/api/community';
import type { CommentReply } from '@/types/community';
import { toast } from 'react-hot-toast';
import { formatTimeAgo } from '@/utils/time';

interface ReplyItemProps {
  reply: CommentReply;
  onReplyClick: (
      replyId: string, 
      userName: string, 
      userId: string, 
      userImage: string | null, 
      replyText: string
  ) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply, onReplyClick }) => {
  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isLiked, setIsLiked] = useState((reply as any).replyLikedByMe || false);
  const [likesCount, setLikesCount] = useState((reply as any).likesCount || 0);

  const handleLike = async () => {
    if (!userId || !token) {
      toast.error("Please login to like");
      return;
    }
    const previousLikedState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLikedState);
    setLikesCount(previousLikedState ? previousCount - 1 : previousCount + 1);

    try {
      const response = await likeReply(userId, reply.replyId, getCommunityRole(user), token);
      if (response.status === 'Success') {
        setIsLiked(response.isLiked);
      } else {
        setIsLiked(previousLikedState);
        setLikesCount(previousCount);
      }
    } catch (error) {
      setIsLiked(previousLikedState);
      setLikesCount(previousCount);
      toast.error("Failed to like reply");
    }
  };

  const userImage = reply.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userFullName)}`;

  const displayTimestamp = reply.updated 
    ? reply.updatedTimestamp 
    : reply.timestamp;

  return (
    <div className="flex gap-3">
      <img loading="lazy" decoding="async" src={userImage} alt={reply.userFullName} className="w-6 h-6 rounded-full bg-[#D9D9D9] shrink-0 mt-1" />
      <div className="flex flex-col w-full">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-[Montserrat] font-semibold text-xs md:text-sm text-[#242645]">
            {reply.userFullName}
            <span className="text-[#8C8CA1] text-[10px] md:text-xs ml-1">replying to {reply.replyTo}</span>
          </span>
          {displayTimestamp?.seconds && (
            <span className="text-[10px] md:text-xs text-[#8C8CA1]">
              {formatTimeAgo(displayTimestamp.seconds)}
              {reply.updated && " (edited)"}
            </span>
          )}
        </div>
        <p className="font-[Montserrat] font-normal text-xs md:text-[13px] text-[#8C8CA1] mt-0.5">{reply.replyText}</p>
        <div className="flex justify-between items-center mt-1">
          <button
            onClick={() => 
                onReplyClick(
                    reply.replyId, 
                    reply.userFullName, 
                    reply.userIdReplied, 
                    userImage, 
                    reply.replyText
                )
            }
            className="text-xs md:text-sm font-medium cursor-pointer text-[#242645] hover:underline"
          >
            Reply
          </button>
          
          <button onClick={handleLike} className="flex items-center gap-1 transition-colors hover:opacity-75">
            <Heart size={12} fill={isLiked ? "#F44336" : "none"} color={isLiked ? "#F44336" : "#F44336"} />
            <span className={`text-xs font-bold ${isLiked ? "text-[#F44336]" : "text-[#F44336]"}`}>{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;