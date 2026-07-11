import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import type { CommunityQuestion } from '@/types/community';
import WriteAnswerModal from './WriteAnswerModal';
import type { AnswerModalDetails } from './WriteAnswerModal';
import { bookmarkQuestion } from '@/api/community';
import { toast } from 'react-hot-toast';

interface AnswerFeedCardProps {
  question: CommunityQuestion;
}

const AnswerFeedCard: React.FC<AnswerFeedCardProps> = ({ question }) => {
  const { user, userId } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const [isWriteAnswerModalOpen, setIsWriteAnswerModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(question.questionBookmarkedByMe || false);
  const loggedInUserName = user?.firstName || 'User';
  const loggedInUserImage =
    user?.photoSmall ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInUserName)}`;

  useEffect(() => {
    setIsBookmarked(question.questionBookmarkedByMe || false);
  }, [question]);
  
  const handleWriteAnswerClick = () => {
    setIsWriteAnswerModalOpen(true);
  };

  const handleBookmark = async () => {
    if (!userId || !token) {
      toast.error("Please login to bookmark");
      return;
    }

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
      } else {
        setIsBookmarked(previousState);
      }
    } catch (error) {
      setIsBookmarked(previousState);
      toast.error("Failed to update bookmark");
    }
  };

  const modalQuestionDetails: AnswerModalDetails = {
    questionId: question.questionId,
    questionText: question.question,
    userFullName: question.userFullName,
    userPhotoUrl: question.userPhotoUrl,
    askerInterestedCourse: 'Student',
    questionTimestamp: question.timestamp,
    anonymous: question.anonymous,
  };

  return (
    <>
      <div className="w-full max-w-[860px] mx-auto p-4 md:p-5 rounded-lg bg-[#F5F5F7] border border-gray-100">
        <div className="flex justify-between items-start gap-3">
          <p className="mt-1 text-base md:text-xl font-semibold text-[#242645] leading-snug md:leading-[26px]">
            {question.question}
          </p>

          <button 
            onClick={handleBookmark}
            className={`transition-colors cursor-pointer ${isBookmarked ? 'text-[#655E95]' : 'text-[#2F43F2] hover:text-indigo-600'}`}
          >
            <Bookmark size={22} fill={isBookmarked ? "#655E95" : "none"} />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 pt-3">
          <img loading="lazy" decoding="async"
            src={loggedInUserImage}
            alt="Logged in user"
            className="w-9 h-9 md:w-[42px] md:h-[42px] rounded-full object-cover"
          />
          <div className="text-center">
            <p className="text-sm md:text-lg font-semibold text-[#242645]">
              {loggedInUserName}, wanna answer?
            </p>
            <p className="text-xs md:text-base text-[#242645] mt-1">
              People will be glad to see your answer
            </p>
          </div>

          <button
            onClick={handleWriteAnswerClick}
            className="h-9 flex items-center justify-center gap-2
                       rounded-xl bg-[#ffffff] border border-[#2F43F2] 
                       py-1.5 px-4
                       text-sm md:text-base font-medium text-[#2F43F2]
                       hover:bg-indigo-50 cursor-pointer"
          >
            <img loading="lazy" decoding="async" src="/write_ans.svg" alt="write an answer" />
            <span>Write an answer</span>
          </button>
        </div>
      </div>

      <WriteAnswerModal
        isOpen={isWriteAnswerModalOpen}
        onClose={() => setIsWriteAnswerModalOpen(false)}
        questionDetails={modalQuestionDetails}
      />
    </>
  );
};

export default AnswerFeedCard;