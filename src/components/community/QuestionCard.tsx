import { getCommunityRole } from '@/lib/communityRole';
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import type { QuestionDetailData } from '@/types/community'; 
import { useAuthStore } from '@/store/AuthStore';
import { formatTimeAgo } from '@/utils/time';
import WriteAnswerModal from './WriteAnswerModal';
import type { AnswerModalDetails } from './WriteAnswerModal';
import { bookmarkQuestion } from '@/api/community';
import { toast } from 'react-hot-toast';

interface QuestionCardProps {
  questionData: QuestionDetailData;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData }) => {
  const { user, userId } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const [isWriteAnswerModalOpen, setIsWriteAnswerModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(questionData.questionBookmarkedByMe || false);

  useEffect(() => {
    setIsBookmarked(questionData.questionBookmarkedByMe || false);
  }, [questionData]);

  const loggedInUserName = user?.firstName || 'User';
  const loggedInUserImage =
    user?.photoSmall || `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInUserName)}`;

  const askerName = questionData.questionAskedFullName || 'ProCounsel Member';
  const askerCourse = questionData.questionAskedInterestedCourse || 'Student';
  const askerImageFromApi = questionData.questionAskedPhotoUrl;
  const askerImage =
    askerImageFromApi || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(askerName)}`;

  const handleWriteAnswerClick = () => {
    setIsWriteAnswerModalOpen(true);
  };

  const handleBookmark = async () => {
    if (!userId || !token) return;

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      const response = await bookmarkQuestion(
        userId,
        questionData.questionId,
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
      toast.error("Failed to bookmark");
    }
  };

  const modalQuestionDetails: AnswerModalDetails = {
    questionId: questionData.questionId,
    questionText: questionData.question,
    userFullName: questionData.questionAskedFullName,
    userPhotoUrl: questionData.questionAskedPhotoUrl,
    askerInterestedCourse: questionData.questionAskedInterestedCourse,
    questionTimestamp: questionData.timestamp,
  };

  // Check if the user has already answered this question
  const hasUserAnswered = questionData.answerStructure?.some(answer => answer.myAnswer === true) || false;

  const displayTimestamp = questionData.updated 
    ? questionData.updatedTimestamp 
    : questionData.timestamp;

  return (
    <>
      <div className="w-full max-w-[860px] mx-auto p-4 md:p-5 rounded-lg bg-[#F5F5F7] border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 md:gap-4">
            <img loading="lazy" decoding="async"
              src={askerImage}
              alt={askerName}
              className="w-9 h-9 md:w-[42px] md:h-[42px] rounded-full object-cover"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base md:text-lg font-medium text-[#242645]">
                  {askerName}
                </span>
                <span className="text-xs md:text-sm text-[#8C8CA1] md:ml-6">
                  {formatTimeAgo(displayTimestamp.seconds)}
                  {questionData.updated && <span className="ml-1 text-xs">(edited)</span>}
                </span>
              </div>
              <span className="text-xs md:text-sm text-[#242645]">{askerCourse}</span>
            </div>
          </div>
          {questionData.questionAskeduserId !== questionData.loggedInUserId && (
            <button 
              onClick={handleBookmark}
              className={`transition-colors cursor-pointer ${isBookmarked ? 'text-[#655E95]' : 'text-[#2F43F2] hover:text-indigo-600'}`}
            >
              <Bookmark size={24} fill={isBookmarked ? "#655E95" : "none"} />
            </button>
          )}
        </div>

        <p className="mt-4 md:mt-[30px] text-base md:text-xl font-semibold text-[#242645] leading-snug md:leading-[26px]">
          {questionData.question}
        </p>

        {!hasUserAnswered && (
          <div className="mt-4 flex flex-col items-center gap-4">
            <img loading="lazy" decoding="async"
              src={loggedInUserImage}
              alt="Logged in user"
              className="w-[42px] h-[42px] rounded-full object-cover"
            />
            <div className="text-center">
              <p className="text-sm md:text-lg font-semibold text-[#242645] text-center">
                {loggedInUserName}, wanna answer?
              </p>
              <p className="text-xs md:text-base text-[#242645] text-center">
                People will be glad to see your answer
              </p>
            </div>

            <button
              onClick={handleWriteAnswerClick}
              className="h-9 flex items-center cursor-pointer justify-center gap-2
                         rounded-xl border border-[#2F43F2] 
                         py-1.5 px-4
                         text-base font-medium text-[#2F43F2]
                         hover:bg-indigo-50"
            >
              <img loading="lazy" decoding="async" src="/write_ans.svg" alt="write answer" />
              <span>Write an answer</span>
            </button>
          </div>
        )}
      </div>

      <WriteAnswerModal
        isOpen={isWriteAnswerModalOpen}
        onClose={() => setIsWriteAnswerModalOpen(false)}
        questionDetails={modalQuestionDetails}
      />
    </>
  );
};

export default QuestionCard;