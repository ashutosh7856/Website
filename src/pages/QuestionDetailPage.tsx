import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/AuthStore';
import { getCommunityRole } from '@/lib/communityRole';
import { getAllAnswersForSpecificQuestion, QuestionNotFoundError } from '@/api/community';
import ErrorState from '@/components/common/ErrorState';
import type { QuestionDetailData, CommunityQuestion } from '@/types/community';
import QuestionCard from '@/components/community/QuestionCard';
import AnswerCard from '@/components/community/AnswerCard';
// import CategorySidebar from '@/components/community/CategorySidebar';
// import RightSideAds from '@/components/community/RightSideAds';
// import CommunityBreadcrumbs from "@/components/community/CommunityBreadcrumbs";
// import type { BreadcrumbPath } from '@/components/community/CommunityBreadcrumbs';

export default function QuestionDetailPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const communityRole = getCommunityRole(user);
  // const location = useLocation();

  const [details, setDetails] = useState<QuestionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!questionId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);
      // No token → the API layer sends this to the unauthenticated twin of the
      // endpoint, so a logged-out visitor can read the thread.
      const response = await getAllAnswersForSpecificQuestion(
        questionId,
        userId ?? undefined,
        token ?? undefined,
        communityRole
      );

      setDetails(response.data);
    } catch (err) {
      console.error(err);
      if (err instanceof QuestionNotFoundError) {
        setNotFound(true);
      } else {
        setError('An error occurred while fetching question details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchDetails is recreated every render; refetch only when the question changes
  }, [questionId]);

  const questionForCard: CommunityQuestion | null = details
    ? {
        questionId: details.questionId,
        question: details.question,
        userIdQuestionAsked: details.questionAskeduserId,
        timestamp: details.timestamp,
        myQuestion: details.loggedInUserId === details.questionAskeduserId,
        userFullName: details.questionAskedFullName,
        userPhotoUrl: details.questionAskedPhotoUrl,
        questionBookmarkedByMe: details.questionBookmarkedByMe
      }
    : null;
  {/*
  const getBreadcrumbs = (): BreadcrumbPath[] => {
    const basePaths: BreadcrumbPath[] = [
      { name: "Community Dashboard", link: "/community" }
    ];

    if (location.state?.from === 'my-activity') {
      basePaths.push({ name: "My Activity", link: "/community/my-activity" });
    }

    basePaths.push({ name: "Question Details" });
    return basePaths;
  };

  */}

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-[1440px] mx-auto flex justify-center gap-3">
        <div className="hidden lg:block w-[191px] shrink-0">
          {/* <CategorySidebar selectedCategory={null} onSelectCategory={() => {}}/> */}
        </div>
        <div className="flex flex-col w-full md:w-[800px] shrink-0">
          {/*<CommunityBreadcrumbs paths={getBreadcrumbs()} showMobileBack={true} /> */}
          <div className="w-full bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            
            {isLoading && (
              <div className="p-20 text-center">Loading details...</div>
            )}

            {notFound && (
              <ErrorState
                variant="inline"
                title="Question not found"
                message="This question may have been deleted by the person who asked it."
                backLabel="Back to community"
                onBack={() => navigate('/community')}
              />
            )}

            {error && (
              <ErrorState
                variant="inline"
                title="Couldn't load this question"
                message="Something went wrong while loading the discussion. Please try again in a moment."
                onRetry={fetchDetails}
                onBack={() => navigate('/community')}
                backLabel="Back to community"
              />
            )}

            {details && questionForCard && (
              <div className="flex flex-col gap-5">
                <QuestionCard questionData={details} />

                {details.answerStructure.length > 0 ? (
                  details.answerStructure.map((answer) => (
                    <AnswerCard key={answer.answerId} answer={answer} questionId={details.questionId} onAnswerUpdated={fetchDetails} />
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-500">
                    Be the first to answer this question!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ads */}
        <div className="hidden xl:block w-[250px] shrink-0">
          {/* <RightSideAds /> */}
        </div>

      </div>
    </div>
  );
}
