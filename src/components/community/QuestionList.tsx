import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getQuestionsList } from '@/api/community';
import { useAuthStore } from '@/store/AuthStore';
import type { CommunityQuestion } from '@/types/community';
import AnswerFeedCard from './AnswerFeedCard';
import { Loader2 } from 'lucide-react';

interface QuestionListProps {
  selectedCategory?: string | null;
}

const QuestionList: React.FC<QuestionListProps> = ({ selectedCategory }) => {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isMoreLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextPageToken) {
          handleLoadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleLoadMore is recreated every render; adding it would re-attach the observer on every render
    [isLoading, isMoreLoading, nextPageToken]
  );

  useEffect(() => {
    if (!userId || !token) {
      setError('You must be logged in to see questions.');
      setIsLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getQuestionsList(userId, token);
        
        if (response.status === 'Success') {
          setQuestions(response.data);
          setNextPageToken(response.nextPageToken);
        } else {
          setError('Failed to load questions.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching questions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [userId, token]);

  const handleLoadMore = async () => {
    if (!userId || !token || !nextPageToken || isMoreLoading) return;

    try {
      setIsMoreLoading(true);
      const response = await getQuestionsList(userId, token, nextPageToken);

      if (response.status === 'Success') {
        setQuestions((prev) => [...prev, ...response.data]);
        setNextPageToken(response.nextPageToken);
      } else {
        setNextPageToken(null);
      }
    } catch (err) {
      console.error('Pagination error:', err);
      setNextPageToken(null);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const displayedQuestions = selectedCategory
    ? questions.filter((q) => {
        const subject = (q as { subject?: string }).subject || ''; 
        const mainCategories = ['Colleges', 'Courses', 'Exams'];

        if (selectedCategory === 'Other') {
          return !mainCategories.includes(subject);
        }
        
        return subject === selectedCategory;
      })
    : questions;

  if (isLoading) {
    return (
      <div className="w-full max-w-[900px] p-20 bg-white rounded-lg text-center flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#13097D] mb-4" />
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="w-full max-w-[900px] p-20 bg-white rounded-lg text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px]">
      <div className="bg-white rounded-lg p-5 flex flex-col gap-5">
        {displayedQuestions.length > 0 ? (
          displayedQuestions.map((question) => (
            <AnswerFeedCard key={question.questionId} question={question} />
          ))
        ) : (
          <div className="p-10 text-center text-gray-500">
            {questions.length === 0 
               ? "No questions found. Be the first to ask!"
               : `No questions found for category "${selectedCategory}".`
            }
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mt-4 pb-8">
        {nextPageToken && (
          <div ref={lastElementRef} className="h-16 flex justify-center items-center w-full">
            {isMoreLoading && (
              <Loader2 className="w-6 h-6 animate-spin text-[#13097D]" />
            )}
          </div>
        )}

        {!nextPageToken && questions.length > 0 && (
          <div className="h-16 flex justify-center items-center">
            <p className="text-sm text-gray-400">You have reached the end</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionList;