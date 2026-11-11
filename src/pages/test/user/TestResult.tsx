import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { resumeTest } from "@/api/userTestSeries";
import toast from "react-hot-toast";

export interface SectionScore {
  sectionName: string;
  totalMarks: number;
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
}

export interface ResultData {
  attemptId: string;
  score: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  maxMarks: number;
  actualDurationTakenToCompleteTest: string;
  sectionScores?: SectionScore[];
}

interface TestResultProps {
  resultData?: ResultData | null;
  onExit?: () => void;
  onRetake?: () => void;
}

export function TestResult({ resultData: propResultData, onExit, onRetake }: TestResultProps) {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fetchedResultData, setFetchedResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  const finalResultData = propResultData || fetchedResultData;

  const userId = localStorage.getItem("phone") || "";
  const attemptId = searchParams.get("attemptId");

  useEffect(() => {
    if (propResultData) {
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      // Prioritize location.state data as it has sectionScores
      const stateData = location.state?.resultData;

      if (stateData) {
        setFetchedResultData(stateData);
        setLoading(false);
        return;
      }

      if (attemptId && userId) {
        try {
          // Use resumeTest to get result details (since it returns attempt info including scores)
          const response = await resumeTest(userId, attemptId);
          if (response.status && response.data?.attempt) {
            const att = response.data.attempt;
            if (att.status === 'SUBMITTED') {
              setFetchedResultData({
                attemptId: att.userTestAttemptsDataId,
                score: att.score || 0,
                totalQuestions: att.totalQuestions || 0,
                correct: att.correctCount || 0,
                wrong: att.wrongCount || 0,
                unattempted: att.unattemptedCount || 0,
                maxMarks: att.maxMarks || 0,
                actualDurationTakenToCompleteTest: att.actualDurationTakenToCompleteTest || "N/A"
              });
            } else {
              toast.error("Test not submitted yet");
              navigate(`/take-test/${testId}`);
            }
          } else {
            toast.error("Failed to load result");
          }
        } catch (error) {
          console.error(error);
          toast.error("Error loading result");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        if (!fetchedResultData) navigate("/t");
      }
    };

    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchedResultData is set by this effect; depending on it would refetch in a loop
  }, [location, attemptId, userId, navigate, testId, propResultData]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!finalResultData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">No result found.</p>
        <button onClick={onExit || (() => navigate(-1))} className="text-blue-600 ml-4">Go Back</button>
      </div>
    );
  }

  const percentage = ((finalResultData.score / finalResultData.maxMarks) * 100).toFixed(0);

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 font-sans backdrop-blur-sm z-[100]">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">


        {/* Header */}
        <div className="flex-none p-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900 pr-8">
            Test Completed
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Submitted on {new Date().toLocaleDateString()} {/* Replace with actual date if available */}
          </p>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">

          {/* Score Banner */}
          <div className="bg-[#F3F4F6] rounded-2xl p-4 flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Score</p>
              <p className="text-2xl font-bold text-[#6C2BD9]">
                {finalResultData.score}<span className="text-gray-400 text-lg">/{finalResultData.maxMarks}</span>
              </p>
            </div>
            <div className="w-px h-10 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-1">Percentage</p>
              <p className="text-2xl font-bold text-[#6C2BD9]">
                {percentage}%
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {/* Correct */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-3 h-3 rounded-full bg-green-500 mb-2"></div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 mb-1 leading-none">
                {finalResultData.correct}
              </span>
              <p className="text-xs text-gray-500 font-medium">Correct</p>
            </div>

            {/* Incorrect */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-3 h-3 rounded-full bg-red-500 mb-2"></div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 mb-1 leading-none">
                {finalResultData.wrong}
              </span>
              <p className="text-xs text-gray-500 font-medium">Incorrect</p>
            </div>

            {/* Unattempted */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-3 h-3 rounded-full bg-gray-200 mb-2"></div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 mb-1 leading-none">
                {finalResultData.unattempted}
              </span>
              <p className="text-xs text-gray-500 font-medium">Unattempted</p>
            </div>

            {/* Time Taken */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-3 h-3 rounded-full bg-purple-400 mb-2"></div>
              <span className="text-sm md:text-lg font-bold text-gray-900 mb-1 leading-tight">
                {finalResultData.actualDurationTakenToCompleteTest.replace(/\s*min[a-z]*/gi, "m").replace(/\s*sec[a-z]*/gi, "s")}
              </span>
              <p className="text-xs text-gray-500 font-medium">Time Taken</p>
            </div>
          </div>

          {/* Section-wise Score */}
          <div className="mb-6">
            <h4 className="text-base font-bold text-gray-900 mb-4 text-left">
              Section-wise Score
            </h4>
            <div className="space-y-4">
              {finalResultData.sectionScores ? (
                finalResultData.sectionScores.map((section, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#6C2BD9]" />
                      <span className="font-semibold text-sm text-gray-800">
                        {section.sectionName}
                      </span>
                    </div>
                    <span className="text-[#6C2BD9] font-bold text-sm">
                      {section.score}/{section.totalMarks}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Section details available in analysis.</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex-none p-6 pt-2 flex gap-4 bg-white">
          {onRetake && (
            <button
              onClick={onRetake}
              className="flex-1 py-3 px-4 rounded-full border border-gray-800 text-gray-900 text-xs md:text-base font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              Retake Test
            </button>
          )}
          <button
            onClick={() => {
              // Exit fullscreen if active
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
              }
              // Navigate
              if (onExit) {
                onExit();
              } else {
                const testGroupId = location.state?.testGroupId;
                navigate(`/test-info/${testId}`, { state: { testGroupId } });
              }
            }}
            className="flex-1 py-3 px-4 rounded-full bg-[#00C55E] text-white text-xs md:text-base font-bold hover:opacity-90 transition-opacity shadow-lg shadow-green-200 cursor-pointer"
          >
            Exit Test
          </button>
        </div>

      </div>
    </div>
  );
}
