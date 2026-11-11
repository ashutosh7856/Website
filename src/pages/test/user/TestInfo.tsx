import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTestSeriesByIdForUser } from "@/api/userTestSeries";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

interface SectionData {
  sectionName: string;
  totalQuestionsSupposedToBeAdded: number;
  totalQuestionsAdded: number;
  sectionDurationInMinutes: number;
  pointsForCorrectAnswer?: number;
  negativeMarks?: number;
}

interface TestAttemptSummary {
  attemptId: string;
  status: string;
  score?: number;
  maxScore?: number;
  attemptDateAndTime: { seconds: number };
}

interface InstructionItem {
  id: number;
  title: string;
  description?: string;
  points?: (string | { icon?: string; text: string })[];
  steps?: { label: string; text: string; isWarning?: boolean }[];
  footer?: string;
  footerPoints?: string[];
  sections?: { subtitle: string; points: string[] }[];
}

const getGeneralInstructions = (
  sectionSwitchingAllowed: boolean
): InstructionItem[] => [
    {
      id: 1,
      title: "Test Timer.",
      points: [
        "The test timer is controlled by the server.",
        "A countdown timer will be visible at the top of your screen showing the remaining time.",
        "Once the timer reaches zero, the test will automatically end.",
        "You are not required to manually submit the test."
      ]
    },
    {
      id: 2,
      title: "Question Palette (Bottom Nav of the Screen).",
      description: "The Question Palette helps you track the status of each question using different symbols:",
      points: [
        { icon: "blue-circle", text: "You are currently on this question" },
        { icon: "green-circle", text: "You have answered the question." },
        { icon: "orange-circle", text: "Marked for review (answer not saved)." },
        { icon: "gray-circle", text: "Unanswered (not yet answered)." }
      ]
    },
    {
      id: 3,
      title: "Navigating and Answering Questions",
      description: "You can answer questions in the following ways:",
      steps: [
        { label: "A.", text: "Click on a question number in the Question Palette to jump directly to that question." },
        { label: "⚠️", text: "Note: This does not save your current answer automatically.", isWarning: true },
        { label: "B.", text: "Click Save & Next to save your answer and move to the next question. Only this saves your answer for evaluation." },
        { label: "C.", text: "Click Mark & Next to flag the question for later review and move to the next question. This does NOT save your answer." }
      ],
      footer: "An answer will only be considered for scoring if you click:",
      footerPoints: ["Save & Next"]
    },
    {
      id: 4,
      title: "Mark for Review",
      points: [
        "Mark & Next is only for flagging questions you want to revisit.",
        "Marking does NOT save your answer - it is just a visual reminder.",
        "If you want your answer to be evaluated, you MUST click Save & Next.",
        "Marked questions without saved answers will NOT be counted in results."
      ]
    },
    {
      id: 5,
      title: "Reset Answer (Unattempt)",
      points: [
        "If you have selected an answer but want to remove it, use the Clear Response button.",
        "This will reset the question to unattempted state.",
        "Unattempted questions will not receive any marks or negative marking.",
        "You can re-attempt the question anytime before submitting."
      ]
    },
    {
      id: 6,
      title: "Marking Scheme",
      points: [
        "Each section has its own marking scheme displayed in the section table above.",
        "Correct marks (+) and negative marks (-) vary by section.",
        "Please check the section details for specific marking values.",
        "Unattempted questions do not receive any marks or negative marking."
      ]
    },
    {
      id: 7,
      title: "Section Navigation",
      points: sectionSwitchingAllowed
        ? [
          "You can freely navigate between sections.",
          "You can move back and forth between any section and question.",
          "Each section has its own time limit."
        ]
        : [
          "Section navigation is sequential only.",
          "You cannot go back to a previous section once you move forward.",
          "When section time expires, you will automatically move to the next section.",
          "Plan your time carefully for each section."
        ]
    }
  ];

export function TestInfo() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [testGroupId, setTestGroupId] = useState<string | undefined>(location.state?.testGroupId);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("Mock Test");
  const [pointsPerQuestion, setPointsPerQuestion] = useState(4);
  const [sectionSwitchingAllowed, setSectionSwitchingAllowed] = useState(false);
  // New state for attempts
  const [attempts, setAttempts] = useState<TestAttemptSummary[]>([]);
  // Pagination state
  const [visibleAttempts, setVisibleAttempts] = useState(3);

  const hasCompletedAttempts = attempts.some(a => a.status === 'SUBMITTED');

  const userId = localStorage.getItem("phone") || "";

  // Exit fullscreen when TestInfo page loads (after coming back from test)
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
  }, []);

  // Persist testGroupId to sessionStorage
  useEffect(() => {
    const sessionKey = `test_group_context_${testId}`;
    if (testGroupId) {
      sessionStorage.setItem(sessionKey, testGroupId);
    } else {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) setTestGroupId(saved);
    }
  }, [testGroupId, testId]);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await getTestSeriesByIdForUser(userId, testId!);
        if (response.status && response.data) {
          const data = response.data;

          // Set test details
          setTestName(data.testName || "Mock Test");
          setPointsPerQuestion(data.pointsForCorrectAnswer || 4);
          setSectionSwitchingAllowed(data.sectionSwitchingAllowed || false);

          // Extract section information from listOfSection
          setSections(data.listOfSection || []);
        }

        if (response.attempts) {
          // Sort attempts by date descending (latest first)
          const sortedAttempts = response.attempts.sort((a: TestAttemptSummary, b: TestAttemptSummary) =>
            (b.attemptDateAndTime?.seconds || 0) - (a.attemptDateAndTime?.seconds || 0)
          );
          setAttempts(sortedAttempts);
        }
      } catch (error) {
        toast.error("Failed to load test information");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTestData();
    }
  }, [testId, userId]);

  const totalDuration = sections.reduce(
    (sum, row) => sum + (row.sectionDurationInMinutes || 0),
    0
  );
  const totalQuestions = sections.reduce(
    (sum, row) => sum + (row.totalQuestionsSupposedToBeAdded || 0),
    0
  );
  const totalMarks = sections.reduce(
    (sum, row) => sum + ((row.totalQuestionsSupposedToBeAdded || 0) * (row.pointsForCorrectAnswer ?? pointsPerQuestion)),
    0
  );

  // Logic to determine button state
  const inProgressAttempt = attempts.find(a => a.status === "IN_PROGRESS");

  // Handler for Start/Resume button
  const handleMainAction = () => {
    if (inProgressAttempt) {
      // Resume
      navigate(`/take-test/${testId}`, { state: { attemptId: inProgressAttempt.attemptId, isResume: true, testGroupId } });
    } else {
      // Start New
      navigate(`/take-test/${testId}`, { state: { testGroupId } }); // TakeTest will handle creation
    }
  };

  const handleAnalysis = (attemptId: string) => {
    navigate(`/t/analysis/${testId}/${attemptId}`, { state: { testGroupId } });
  };

  const handleShowMore = () => {
    setVisibleAttempts(prev => prev + 3);
  };

  const handleShowLess = () => {
    setVisibleAttempts(3);
  };

  const displayedAttempts = attempts.slice(0, visibleAttempts);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading test information...</p>
      </div>
    );
  }

  return (
    <div className="pt-4 w-full mx-auto max-w-7xl h-full flex flex-col items-center gap-4 px-3 pb-4">
      {/* Back Button */}
      <div className="w-full max-w-[800px] lg:max-w-[1200px]">
        <button
          onClick={() => {
            if (testGroupId) {
              navigate(`/courses/test-group/${testGroupId}`);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      <h1 className="text-(text-app-primary) font-semibold text-[1rem] md:text-2xl">
        {testName}
      </h1>

      <div className="w-full max-w-[800px] lg:max-w-[1200px] border border-t-0 border-[#E4E8EC] rounded-2xl bg-white overflow-hidden">
        {/* Scrollable table container for mobile */}
        <div className="overflow-x-auto">
          {/* HEADER */}
          <div className="grid grid-cols-6 min-w-[500px] gap-x-1 md:gap-x-4 bg-[#F8F9FA] text-center text-(--text-muted) rounded-tr-[15px] rounded-tl-[15px] rounded-b-2xl">
            {["Section", "Qs", "Time", "+ve", "-ve", "Total"].map((h, idx) => (
              <div
                key={h}
                className={`px-1 md:px-2 py-3 md:py-4 font-normal text-[9px] md:text-sm ${idx === 0 ? "text-left pl-2 md:pl-6" : ""
                  }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* BODY */}
          {sections?.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-6 min-w-[500px] gap-x-1 md:gap-x-4 text-center border-b border-gray-100 last:border-b-0"
            >
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm text-left pl-2 md:pl-6 truncate">
                {row.sectionName}
              </div>
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm">
                {row.totalQuestionsSupposedToBeAdded}
              </div>
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm">
                {row.sectionDurationInMinutes}m
              </div>
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm text-green-600">
                +{row.pointsForCorrectAnswer ?? pointsPerQuestion}
              </div>
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm text-red-600">
                {(row.negativeMarks ?? 0) > 0 ? `-${row.negativeMarks}` : '0'}
              </div>
              <div className="px-1 md:px-2 py-2 md:py-3 font-semibold text-[9px] md:text-sm">
                {(row.totalQuestionsSupposedToBeAdded || 0) * (row.pointsForCorrectAnswer ?? pointsPerQuestion)}
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="border-t border-[#E4E8EC]">
          <div className="px-4 md:px-6 py-4">
            <div className="flex gap-4 md:gap-8 flex-wrap">
              <div className="flex flex-col md:flex-row md:gap-2">
                <p className="text-xs font-normal md:text-sm text-(--text-muted)">
                  Total Time:
                </p>
                <p className="text-sm font-semibold md:text-[1rem] text-(--text-app-primary)">
                  {totalDuration} min
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:gap-2">
                <p className="text-xs font-normal md:text-sm text-(--text-muted)">
                  Total Questions:
                </p>
                <p className="text-sm font-semibold md:text-[1rem] text-(--text-app-primary)">
                  {totalQuestions}
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:gap-2">
                <p className="text-xs font-normal md:text-sm text-(--text-muted)">
                  Max Marks:
                </p>
                <p className="text-sm font-semibold md:text-[1rem] text-(--text-app-primary)">
                  {totalMarks}
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:gap-2">
                <p className="text-xs font-normal md:text-sm text-(--text-muted)">
                  Section Navigation:
                </p>
                <p className={`text-sm font-semibold md:text-[1rem] ${sectionSwitchingAllowed ? 'text-green-600' : 'text-orange-600'}`}>
                  {sectionSwitchingAllowed ? 'Free Switching' : 'Sequential Only'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Attempts Section */}
      {attempts.length > 0 && (
        <div className="w-full max-w-[800px] lg:max-w-[1200px] mt-2">
          <h2 className="text-(--text-app-primary) font-semibold text-lg md:text-xl mb-3 pl-2">
            Previous Attempts
          </h2>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-[#E4E8EC] rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Date/Time</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedAttempts.map((attempt) => (
                  <tr
                    key={attempt.attemptId}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    onClick={() => {
                      if (attempt.status === 'SUBMITTED') handleAnalysis(attempt.attemptId);
                      else handleMainAction();
                    }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(attempt.attemptDateAndTime.seconds * 1000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attempt.status === 'SUBMITTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {attempt.status === 'SUBMITTED' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {attempt.status === 'SUBMITTED' ? `${attempt.score}/${attempt.maxScore}` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Compact design, fully clickable */}
          <div className="md:hidden space-y-2">
            {displayedAttempts.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="bg-white border border-[#E4E8EC] rounded-lg px-3 py-2.5 shadow-sm active:bg-gray-50 cursor-pointer flex items-center justify-between gap-3"
                onClick={() => {
                  if (attempt.status === 'SUBMITTED') handleAnalysis(attempt.attemptId);
                  else handleMainAction();
                }}
              >
                {/* Left - Date and Status */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {new Date(attempt.attemptDateAndTime.seconds * 1000).toLocaleDateString()} • {new Date(attempt.attemptDateAndTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${attempt.status === 'SUBMITTED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {attempt.status === 'SUBMITTED' ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                {/* Right - Score */}
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">
                    {attempt.status === 'SUBMITTED' ? `${attempt.score}/${attempt.maxScore}` : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Buttons */}
          {attempts.length > 3 && (
            <div className="flex justify-center mt-3">
              {visibleAttempts < attempts.length ? (
                <button
                  onClick={handleShowMore}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer py-1 px-3"
                >
                  Show More <ChevronDown size={16} />
                </button>
              ) : (
                <button
                  onClick={handleShowLess}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer py-1 px-3"
                >
                  Show Less <ChevronUp size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* General Instructions Section */}
      <div className="w-full max-w-[800px] lg:max-w-[1200px] mt-2 mb-4">
        <h2 className="text-(--text-app-primary) font-semibold text-lg md:text-2xl mb-2 text-center">
          General Instructions
        </h2>

        <div className="p-6 md:p-8 space-y-6">
          {getGeneralInstructions(sectionSwitchingAllowed).map((instruction) => (
            <div key={instruction.id} className="text-left">
              <h3 className="font-medium text-base md:text-[1.25rem] text-(--text-app-primary) mb-3">
                {instruction.id}. {instruction.title}
              </h3>

              {instruction.description && (
                <p className="text-sm md:text-base text-(--text-app-primary) mb-2 ml-4 font-normal">
                  {instruction.description}
                </p>
              )}

              {instruction.points && (
                <ul className="ml-8 space-y-2">
                  {instruction.points.map((point, idx) => (
                    <li key={idx} className="text-sm md:text-base text-(--text-app-primary) list-disc font-normal">
                      {typeof point === 'string' ? (
                        point
                      ) : (
                        <div className="flex items-start gap-2">
                          {point.icon && (
                            <span className={`inline-block w-3 h-3 rounded-full mt-1 ${point.icon === 'blue-circle' ? 'bg-blue-500' :
                              point.icon === 'green-circle' ? 'bg-green-500' :
                                point.icon === 'orange-circle' ? 'bg-[#F69E23]' :
                                  point.icon === 'gray-circle' ? 'bg-[#EAEDF0]' : ''
                              }`}></span>
                          )}
                          <span>{point.text}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {instruction.steps && (
                <div className="ml-4 space-y-2">
                  {instruction.steps.map((step, idx) => (
                    <div key={idx} className={`flex gap-2 text-sm md:text-base ${step.isWarning ? 'text-yellow-600 font-medium' : 'text-(--text-app-primary) font-normal'
                      }`}>
                      <span className="font-semibold">{step.label}</span>
                      <span>{step.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {instruction.footer && (
                <div className="ml-4 mt-3">
                  <p className="text-sm md:text-base text-(--text-app-primary) mb-2 font-medium">
                    {instruction.footer}
                  </p>
                  <ul className="ml-4 space-y-1">
                    {instruction.footerPoints?.map((point, idx) => (
                      <li key={idx} className="text-sm md:text-base text-(--text-app-primary) list-disc font-normal">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}


            </div>
          ))}
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 flex
              items-center justify-center w-full bg-white border-t 
              py-2.5 px-5 border-[#D6D6D6] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]
              z-50 rounded-tr-xl rounded-tl-xl"
      >
        <button
          onClick={handleMainAction}
          className="bg-(--btn-primary) w-full md:w-auto md:min-w-[166px] py-2.5 px-6 text-white font-medium text-xs md:text-lg shadow-[0px_2px_4px_0px_#FA660F33] rounded-[12px] md:rounded-2xl cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {inProgressAttempt ? "Resume Test" : (hasCompletedAttempts ? "Retake Test" : "Start Test")}
        </button>
      </div>
    </div>
  );
}
