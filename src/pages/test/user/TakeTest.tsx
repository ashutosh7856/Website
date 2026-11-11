import { Section } from "@/components/create-test/user/Section";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Question } from "@/components/create-test/user/Question";
import { Option } from "@/components/create-test/user/Option";
import { Timer } from "@/components/create-test/user/Timer";
import { SubmitTestModal } from "@/components/modals/SubmitTestModal";
import toast from "react-hot-toast";
import {
  getAllQuestionsUserOfAllSection,
  getTestSeriesByIdForUser,
  startTest,
  saveOrMarkForReviewAnswer,
  submitTestAndCalculateScore,
  resumeTest,
  resetAnswer
} from "@/api/userTestSeries";

interface QuestionType {
  questionId: string;
  questionText: string;
  questionImageUrls?: string[];
  multipleAnswer: boolean;
  subjective: boolean;
  options: Array<{
    optionId: string;
    value: string;
    imageUrl: string | null;
    isCorrect?: boolean;
  }> | null;
  correctAnswerIds: string[] | null;
  isMultipleAnswer?: boolean; // some API responses use this name instead of multipleAnswer
}

interface SectionType {
  sectionName: string;
  totalQuestions: number;
  questions: QuestionType[];
  pointsForCorrectAnswer?: number;
  negativeMarks?: number;
}

interface QuestionState {
  questionId: string;
  sectionName: string;
  status: "NOT_VISITED" | "ATTEMPTED" | "MARKED_FOR_REVIEW" | "CURRENT";
  selectedAnswers: string[];
}

import { TestResult, type ResultData, type SectionScore } from "./TestResult";

export function TakeTest() {
  type ActionLoadingType = "SAVE_NEXT" | "MARK_NEXT" | "SAVE" | "MARK" | "CLEAR" | null;

  const { testId } = useParams();
  const location = useLocation();
  const [testGroupId, setTestGroupId] = useState<string | undefined>(location.state?.testGroupId);
  const navigate = useNavigate();

  const [testResult, setTestResult] = useState<ResultData | null>(null);
  const [showMobileSections, setShowMobileSections] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<ActionLoadingType>(null);
  const isProcessingAction = useRef(false);

  // Test data
  const [sections, setSections] = useState<SectionType[]>([]);
  const [sectionDurations, setSectionDurations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState("");
  const [testName, setTestName] = useState("Mock Test");
  const [showSectionChangeModal, setShowSectionChangeModal] = useState(false);
  const [pendingNavigationSection, setPendingNavigationSection] = useState<number | null>(null);
  const [pendingNavigationQuestion, setPendingNavigationQuestion] = useState<number>(0);
  const [sectionSwitchingAllowed, setSectionSwitchingAllowed] = useState(false);

  // Current state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<
    Map<string, QuestionState>
  >(new Map());
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [pendingQuestionState, setPendingQuestionState] = useState<QuestionState | null>(null); // Track pending state for current question
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);
  const isLoadingAnswer = useRef(false); // Track if we're loading answer (to skip auto-save)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now()); // Track when user started viewing current question
  const MAX_TAB_SWITCHES = 3;

  const userId = localStorage.getItem("phone") || "";
  const sessionKey = `test_progress_${testId}_${userId}`;

  // Get current question
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.totalQuestions,
    0
  );

  // Calculate stats
  const getStats = () => {
    let attempted = 0;
    let unanswered = 0;
    let notVisited = 0;
    let markedForReview = 0;

    sections.forEach((section) => {
      section.questions.forEach((q) => {
        // Check if this question has a pending state update
        const isPendingQ = pendingQuestionState && q.questionId === pendingQuestionState.questionId;
        const state = isPendingQ ? pendingQuestionState : questionStates.get(q.questionId);

        // Critical: Use live state for current question
        const isCurrentQ = currentQuestion && q.questionId === currentQuestion.questionId;
        const userSelectedAnswers = isCurrentQ ? selectedAnswers : (state?.selectedAnswers || []);
        const status = state?.status || "NOT_VISITED";

        if (status === "MARKED_FOR_REVIEW") {
          markedForReview++;
        } else if (userSelectedAnswers.length > 0) {
          // If selected answers exist, count as attempted regardless of stored status (which might lag)
          attempted++;
        } else if (status === "ATTEMPTED") {
          attempted++;
        } else if (status === "NOT_VISITED") {
          notVisited++;
        } else {
          unanswered++;
        }
      });
    });

    return { attempted, unanswered, notVisited, markedForReview };
  };
  // Save progress to sessionStorage
  const saveProgress = () => {
    if (!testStarted) return;
    const progress = {
      attemptId,
      testGroupId,
      currentSectionIndex,
      currentQuestionIndex,
      questionStates: Array.from(questionStates.entries()),
      startTime,
      testStarted,
      timeLeft: timeLeft // Note: This might be stale if not updated often, but good for backup
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(progress));
  };

  // Restore progress from sessionStorage
  const restoreProgress = () => {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setAttemptId(progress.attemptId);
        setCurrentSectionIndex(progress.currentSectionIndex);
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setQuestionStates(new Map(progress.questionStates));
        setStartTime(progress.startTime);
        setTestStarted(progress.testStarted);
        setTimeLeft(progress.timeLeft);
        if (progress.testGroupId && !testGroupId) {
          setTestGroupId(progress.testGroupId);
        }
        setShowStartModal(false);
        return true;
      } catch (error) {
        console.error("Failed to restore progress:", error);
      }
    }
    return false;
  };

  // Logic to initialize question states from sections
  const initializeQuestionStates = (sectionsData: SectionType[]) => {
    const statesMap = new Map<string, QuestionState>();
    sectionsData.forEach((section: SectionType) => {
      section.questions.forEach((question: QuestionType) => {
        statesMap.set(question.questionId, {
          questionId: question.questionId,
          sectionName: section.sectionName,
          status: "NOT_VISITED",
          selectedAnswers: [],
        });
      });
    });
    return statesMap;
  }

  // Fetch all questions and test info OR Resume
  useEffect(() => {
    const initTest = async () => {
      try {
        // 1. Fetch Questions & Info (Always needed for structure)
        const [questionsResponse, testInfoResponse] = await Promise.all([
          getAllQuestionsUserOfAllSection(userId, testId!),
          getTestSeriesByIdForUser(userId, testId!)
        ]);

        if (questionsResponse.status && testInfoResponse.status) {
          setSections(questionsResponse.data);

          // Set basic info
          if (testInfoResponse.data.listOfSection) {
            const durations = testInfoResponse.data.listOfSection.map(
              (section: { sectionDurationInMinutes?: number }) => section.sectionDurationInMinutes || 60
            );
            setSectionDurations(durations);
          }
          setTestName(testInfoResponse.data.testName || "Mock Test");
          setSectionSwitchingAllowed(testInfoResponse.data.sectionSwitchingAllowed || false);

          // 2. Check if Resuming (from Location or Session)
          const resumeAttemptId = location.state?.attemptId;
          const isResume = location.state?.isResume;

          if (isResume && resumeAttemptId) {
            // CALL RESUME API
            const resumeData = await resumeTest(userId, resumeAttemptId);
            if (resumeData.status && resumeData.data) {
              const { attempt, answers, timeLeftInSeconds: overallTimeLeft } = resumeData.data;

              // Determine which timer to use: section-specific for sequential, overall for free switching
              let finalTimeLeft = overallTimeLeft;
              const isSwitchingAllowed = testInfoResponse.data.sectionSwitchingAllowed || false;

              if (!isSwitchingAllowed && attempt.currentSectionName && attempt.sectionTimeList) {
                const currentSectionTime = attempt.sectionTimeList.find(
                  (s: { sectionName: string; timeLeftInSeconds?: string }) => s.sectionName === attempt.currentSectionName
                );
                if (currentSectionTime && currentSectionTime.timeLeftInSeconds) {
                  finalTimeLeft = parseInt(currentSectionTime.timeLeftInSeconds);
                }
              }

              setAttemptId(resumeAttemptId);
              setTimeLeft(finalTimeLeft);
              setTestStarted(true);
              setShowStartModal(false); // Skip start modal on resume

              // Restore Question States from 'answers'
              const statesMap = initializeQuestionStates(questionsResponse.data);

              if (answers && answers.attemptedQuestionData) {
                Object.entries(answers.attemptedQuestionData as Record<string, { status?: string; answerIds?: string[] }>).forEach(([qId, qData]) => {
                  if (statesMap.has(qId)) {
                    const currentSt = statesMap.get(qId)!;
                    statesMap.set(qId, {
                      ...currentSt,
                      status: qData.status === "MARKED_FOR_REVIEW" ? "MARKED_FOR_REVIEW" : "ATTEMPTED", // Map API status to local
                      selectedAnswers: qData.answerIds || []
                    });
                  }
                });
              }
              setQuestionStates(statesMap);

              // Restore Position
              if (attempt.currentQuestionIdBeingAttempted) {
                // Find section and question index
                let sIdx = 0, qIdx = 0;
                let found = false;
                questionsResponse.data.forEach((sec: SectionType, si: number) => {
                  sec.questions.forEach((q: QuestionType, qi: number) => {
                    if (q.questionId === attempt.currentQuestionIdBeingAttempted) {
                      sIdx = si;
                      qIdx = qi;
                      found = true;
                    }
                  });
                });
                if (found) {
                  setCurrentSectionIndex(sIdx);
                  setCurrentQuestionIndex(qIdx);
                  // Also set current question status to VISITED if not attempted?
                  // Logic handles it on render/selection
                }
              }

              // Enter Fullscreen
              setTimeout(() => {
                document.documentElement.requestFullscreen?.().catch((err) => {
                  console.error("Fullscreen error:", err);
                });
              }, 500);

              return; // Exit early if resume successful
            } else {
              toast.error("Failed to resume test. Starting fresh.");
            }
          }

          // 3. Fallback to Session Storage if available and not explicitly resuming (or resume failed)
          const restored = restoreProgress();
          if (restored) return;

          // 4. Fresh Start Initialization
          const statesMap = initializeQuestionStates(questionsResponse.data);
          setQuestionStates(statesMap);

          if (questionsResponse.data[0]?.questions[0]) {
            const firstQ = questionsResponse.data[0].questions[0];
            statesMap.set(firstQ.questionId, {
              ...statesMap.get(firstQ.questionId)!,
              status: "CURRENT",
            });
            setQuestionStates(new Map(statesMap));
          }
        }
      } catch (error) {
        toast.error("Failed to load test data");
        console.error(error);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      initTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restoreProgress is recreated each render; init must run only when the test/route changes
  }, [testId, userId, location.state, navigate]);

  // Start test API and enter fullscreen
  const handleStartTest = async () => {
    try {
      const response = await startTest(userId, testId!);
      if (response.status) {
        setAttemptId(response.data.userTestAttemptsDataId);
        setStartTime(Date.now());
        setTestStarted(true);
        setShowStartModal(false);
        // Set initial timer based on mode
        if (sectionSwitchingAllowed) {
          const totalMins = sectionDurations.reduce((a, b) => a + b, 0);
          setTimeLeft(totalMins * 60);
        } else if (sectionDurations.length > 0) {
          setTimeLeft(sectionDurations[0] * 60);
        }

        // Save initial progress
        setTimeout(saveProgress, 100);

        // Enter fullscreen after modal closes
        setTimeout(() => {
          document.documentElement.requestFullscreen?.().catch((err) => {
            console.error("Fullscreen error:", err);
            toast("Please enable fullscreen for the best experience");
          });
        }, 100);
      }
    } catch (error) {
      toast.error("Failed to start test");
      console.error(error);
    }
  };

  // Save answer
  const handleSaveAnswer = async (
    status: "ATTEMPTED" | "MARKED_FOR_REVIEW"
  ) => {
    if (!currentQuestion) return;

    // Calculate elapsed time in seconds
    const elapsedTime = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);

    try {
      await saveOrMarkForReviewAnswer({
        attemptId,
        userId,
        sectionName: currentSection.sectionName,
        questionId: currentQuestion.questionId,
        answerIds: selectedAnswers,
        status,
        elapsedTime,
      });

      // Update question state
      const newStates = new Map(questionStates);
      newStates.set(currentQuestion.questionId, {
        questionId: currentQuestion.questionId,
        sectionName: currentSection.sectionName,
        status: status,
        selectedAnswers: selectedAnswers,
      });
      setQuestionStates(newStates);

      // Save progress after state update
      setTimeout(saveProgress, 100);

      toast.success(
        status === "ATTEMPTED"
          ? "Answer saved"
          : "Marked for review"
      );
    } catch (error) {
      toast.error("Failed to save answer");
      console.error(error);
    }
  };

  // Clear/Reset answer (unattempt)
  const handleClearResponse = async () => {
    if (isProcessingAction.current) return;
    if (!currentQuestion) return;
    if (selectedAnswers.length === 0) {
      toast.error("No answer to clear");
      return;
    }

    isProcessingAction.current = true;
    setActionLoading("CLEAR");
    try {
      await resetAnswer(
        userId,
        currentQuestion.questionId,
        attemptId,
        currentSection.sectionName
      );

      // Clear selected answers
      setSelectedAnswers([]);

      // Update question state to NOT_VISITED (or visited but unattempted)
      const newStates = new Map(questionStates);
      newStates.set(currentQuestion.questionId, {
        questionId: currentQuestion.questionId,
        sectionName: currentSection.sectionName,
        status: "CURRENT",
        selectedAnswers: [],
      });
      setQuestionStates(newStates);

      // Save progress after state update
      setTimeout(saveProgress, 100);

      toast.success("Response cleared");
    } catch (error) {
      toast.error("Failed to clear response");
      console.error(error);
    } finally {
      setActionLoading(null);
      isProcessingAction.current = false;
    }
  };

  // Save and move to next question
  const handleSaveAndNext = async () => {
    if (isProcessingAction.current) return;
    isProcessingAction.current = true;
    setActionLoading("MARK_NEXT");
    try {
      await handleSaveAnswer("MARKED_FOR_REVIEW");

      // Check if last question of last section - submit test
      if (currentSectionIndex === sections.length - 1 &&
        currentQuestionIndex >= currentSection.questions.length - 1) {
        handleOpenSubmitModal();
        return;
      }

      // Check if moving to next section
      if (currentQuestionIndex >= currentSection.questions.length - 1 &&
        currentSectionIndex < sections.length - 1) {
        if (sectionSwitchingAllowed) {
          // Section switching allowed - navigate directly without modal
          setCurrentSectionIndex(currentSectionIndex + 1);
          setCurrentQuestionIndex(0);
        } else {
          // Show warning modal
          setPendingNavigationSection(currentSectionIndex + 1);
          setShowSectionChangeModal(true);
        }
        return;
      }

      // Move to next question within same section
      if (currentQuestionIndex < currentSection.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } finally {
      setActionLoading(null);
      isProcessingAction.current = false;
    }
  };

  // Navigate to next question
  const handleNext = async () => {
    if (isProcessingAction.current) return;
    isProcessingAction.current = true;
    setActionLoading("SAVE_NEXT");
    try {
      // Save current answer if any selected
      if (selectedAnswers.length > 0) {
        await handleSaveAnswer("ATTEMPTED");
      }

      // Check if moving to next section
      if (currentQuestionIndex >= currentSection.questions.length - 1 &&
        currentSectionIndex < sections.length - 1) {
        if (sectionSwitchingAllowed) {
          // Section switching allowed - navigate directly without modal
          setCurrentSectionIndex(currentSectionIndex + 1);
          setCurrentQuestionIndex(0);
        } else {
          // Show warning modal before moving to next section
          setPendingNavigationSection(currentSectionIndex + 1);
          setShowSectionChangeModal(true);
        }
        return;
      }

      // Move to next question within same section
      if (currentQuestionIndex < currentSection.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } finally {
      setActionLoading(null);
      isProcessingAction.current = false;
    }
  };

  const handleSaveOnly = async () => {
    if (isProcessingAction.current) return;
    isProcessingAction.current = true;
    setActionLoading("SAVE");
    try {
      await handleSaveAnswer("ATTEMPTED");
    } finally {
      setActionLoading(null);
      isProcessingAction.current = false;
    }
  };

  const handleMarkOnly = async () => {
    if (isProcessingAction.current) return;
    isProcessingAction.current = true;
    setActionLoading("MARK");
    try {
      await handleSaveAnswer("MARKED_FOR_REVIEW");
    } finally {
      setActionLoading(null);
      isProcessingAction.current = false;
    }
  };

  // Navigate to previous question (within same section only)
  const handlePrevious = () => {
    if (isProcessingAction.current) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    // Don't allow going back to previous section
  };

  // Update current question marker
  const updateCurrentQuestion = () => {
    const newStates = new Map(questionStates);

    // Clear all CURRENT statuses
    newStates.forEach((state, key) => {
      if (state.status === "CURRENT") {
        newStates.set(key, {
          ...state,
          status: state.selectedAnswers.length > 0 ? "ATTEMPTED" : "NOT_VISITED",
        });
      }
    });

    // Set new current
    const nextQuestion = sections[currentSectionIndex]?.questions[currentQuestionIndex];
    if (nextQuestion) {
      const currentState = newStates.get(nextQuestion.questionId);
      newStates.set(nextQuestion.questionId, {
        ...currentState!,
        status: "CURRENT",
      });

      // Load saved answers
      setSelectedAnswers(currentState?.selectedAnswers || []);
    }

    setQuestionStates(newStates);
    // Reset elapsed time for new question
    questionStartTimeRef.current = Date.now();
    setTimeout(() => saveProgress(), 100);
  };

  // Handle section change confirmation
  const handleConfirmSectionChange = () => {
    if (pendingNavigationSection !== null) {
      setCurrentSectionIndex(pendingNavigationSection);
      setCurrentQuestionIndex(pendingNavigationQuestion);

      // Reset timer for the new section if sequential
      if (!sectionSwitchingAllowed && sectionDurations[pendingNavigationSection]) {
        setTimeLeft(sectionDurations[pendingNavigationSection] * 60);
      }

      setPendingNavigationSection(null);
      setPendingNavigationQuestion(0);
      setShowSectionChangeModal(false);
    }
  };

  // Handle timer end - auto move to next section or submit


  // Update current question marker when indices change
  useEffect(() => {
    if (sections.length > 0 && testStarted) {
      updateCurrentQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync the marker only on navigation; adding testStarted/updateCurrentQuestion would re-run it on every state change
  }, [currentSectionIndex, currentQuestionIndex, sections]);

  // Load selected answers when question changes
  useEffect(() => {
    if (currentQuestion) {
      isLoadingAnswer.current = true;
      const state = questionStates.get(currentQuestion.questionId);
      setSelectedAnswers(state?.selectedAnswers || []);
      // Reset flag after state update
      setTimeout(() => { isLoadingAnswer.current = false; }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load saved answers only when the question changes, not on every questionStates update
  }, [currentQuestion?.questionId]);

  // Auto-save answers when they change (with debounce) - ONLY for multi-select questions
  useEffect(() => {
    // Only auto-save for multi-select questions (single-select saves on Next/Clear)
    const isMultiSelect = currentQuestion?.multipleAnswer || currentQuestion?.isMultipleAnswer;

    // Skip if: loading answer, no question, test not started, or single-select
    if (isLoadingAnswer.current || !currentQuestion || !testStarted || !attemptId || !isMultiSelect) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        // If there are selected answers, save them
        if (selectedAnswers.length > 0) {
          const elapsedTime = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
          await saveOrMarkForReviewAnswer({
            attemptId,
            userId,
            sectionName: currentSection.sectionName,
            questionId: currentQuestion.questionId,
            answerIds: selectedAnswers,
            status: "ATTEMPTED",
            elapsedTime,
          });
        } else {
          // If no answers selected, reset on backend
          await resetAnswer(
            userId,
            currentQuestion.questionId,
            attemptId,
            currentSection.sectionName
          );
        }

        // Update local state
        const newStates = new Map(questionStates);
        newStates.set(currentQuestion.questionId, {
          questionId: currentQuestion.questionId,
          sectionName: currentSection.sectionName,
          status: selectedAnswers.length > 0 ? "ATTEMPTED" : "CURRENT",
          selectedAnswers: selectedAnswers,
        });
        setQuestionStates(newStates);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced auto-save keyed on answer/question changes; questionStates is written by this effect
  }, [selectedAnswers, currentQuestion?.questionId, testStarted, attemptId]);

  // Tab switch detection - warn users and auto-submit after MAX_TAB_SWITCHES
  useEffect(() => {
    if (!testStarted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tab or minimized
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            // Auto-submit test after max switches
            toast.error("Test auto-submitted due to multiple tab switches!");
            handleSubmitTest();
          }
          return newCount;
        });
        setShowTabWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listener is attached once per test start; handleSubmitTest changes every render
  }, [testStarted]);

  // Open submit modal - save current question first so stats are accurate
  const handleOpenSubmitModal = async () => {
    // If current question has selected answers, save them first
    if (currentQuestion && selectedAnswers.length > 0) {
      const newState: QuestionState = {
        questionId: currentQuestion.questionId,
        sectionName: currentSection.sectionName,
        status: "ATTEMPTED",
        selectedAnswers: selectedAnswers,
      };
      // Set pending state BEFORE async call so UI updates immediately
      setPendingQuestionState(newState);

      try {
        const elapsedTime = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        await saveOrMarkForReviewAnswer({
          attemptId,
          userId,
          sectionName: currentSection.sectionName,
          questionId: currentQuestion.questionId,
          answerIds: selectedAnswers,
          status: "ATTEMPTED",
          elapsedTime,
        });
        // Update local state
        const newStates = new Map(questionStates);
        newStates.set(currentQuestion.questionId, newState);
        setQuestionStates(newStates);
      } catch (error) {
        console.error("Failed to save current answer before submit:", error);
        // Still show modal even if save fails
      }
    }
    setShowSubmitModal(true);
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // CRITICAL: Save current question's answer before submitting
      if (currentQuestion && selectedAnswers.length > 0) {
        const elapsedTime = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        await saveOrMarkForReviewAnswer({
          attemptId,
          userId,
          sectionName: currentSection.sectionName,
          questionId: currentQuestion.questionId,
          answerIds: selectedAnswers,
          status: "ATTEMPTED",
          elapsedTime,
        });
        // Update local state
        const newStates = new Map(questionStates);
        newStates.set(currentQuestion.questionId, {
          questionId: currentQuestion.questionId,
          sectionName: currentSection.sectionName,
          status: "ATTEMPTED",
          selectedAnswers: selectedAnswers,
        });
        setQuestionStates(newStates);
      }

      const response = await submitTestAndCalculateScore(userId, attemptId);
      // Calculate Result Data locally for immediate display
      const sectionScores: SectionScore[] = [];

      sections.forEach(section => {
        let secCorrect = 0;
        let secWrong = 0;
        let secUnattempted = 0;
        let secScore = 0;

        section.questions.forEach(q => {
          const state = questionStates.get(q.questionId);

          // Critical fix: If this is the current question, use the live 'selectedAnswers' state
          // because 'questionStates' might not be updated yet (especially for the last question).
          const isCurrentQ = currentQuestion && q.questionId === currentQuestion.questionId;
          const userSelectedAnswers = isCurrentQ ? selectedAnswers : (state?.selectedAnswers || []);

          const isAttempted = userSelectedAnswers.length > 0;

          // Find correct options
          const correctOptions = (q.options || []).filter(o => o.isCorrect).map(o => o.optionId);

          if (isAttempted) {
            // Check if all selected answers are correct and no extra incorrect answers are selected
            const isCorrect = userSelectedAnswers.length === correctOptions.length &&
              userSelectedAnswers.every(ansId => correctOptions.includes(ansId));

            if (isCorrect) {
              secCorrect++;
              secScore += (section.pointsForCorrectAnswer || 4); // Default 4 if not set
            } else {
              secWrong++;
              secScore -= (section.negativeMarks || 1); // Default 1 if not set
            }
          } else {
            secUnattempted++;
          }
        });

        sectionScores.push({
          sectionName: section.sectionName,
          totalMarks: section.totalQuestions * (section.pointsForCorrectAnswer || 4),
          score: secScore,
          correct: secCorrect,
          wrong: secWrong,
          unattempted: secUnattempted
        });
      });



      if (response.status && response.data) {
        toast.success("Test submitted successfully!");
        setShowSubmitModal(false);
        // Clear session storage
        sessionStorage.removeItem(sessionKey);

        // Use backend response data directly
        const backendData = response.data;
        const resultData: ResultData = {
          attemptId: backendData.attemptId || attemptId,
          score: backendData.score,
          totalQuestions: backendData.totalQuestions,
          correct: backendData.correct,
          wrong: backendData.wrong,
          unattempted: backendData.unattempted,
          maxMarks: backendData.maxMarks,
          actualDurationTakenToCompleteTest: backendData.actualDurationTakenToCompleteTest,
          sectionScores: backendData.sectionScores || undefined
        };

        // Show result modal on same page
        setTestResult(resultData);
      }
    } catch (error) {
      toast.error("Failed to submit test");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fullscreen protection
  useEffect(() => {
    if (!attemptId) return; // Only after test started

    // Warn before leaving page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Detect fullscreen exit - but don't re-request if test is completed (testResult is set)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !testResult) {
        toast.error("Please stay in fullscreen during the test");
        document.documentElement.requestFullscreen?.();
      }
    };

    // Detect tab switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("User switched tab - logged for monitoring");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attemptId, testResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading test...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">No questions available</p>
      </div>
    );
  }

  const stats = getStats();
  // Section-wise question number (restarts from 1 for each section)
  const sectionQuestionNumber = currentQuestionIndex + 1;

  // Check if current question is the last question
  const isLastQuestion =
    currentSectionIndex === sections.length - 1 &&
    currentQuestionIndex === currentSection?.questions.length - 1;

  // Calculate time taken for submit modal
  const timeTakenMs = Date.now() - startTime;
  const hours = Math.floor(timeTakenMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeTakenMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeTakenString = `${hours}h ${minutes}m`;
  const isActionLoading = actionLoading !== null;
  const renderLoadingButtonContent = (label: string, isLoading: boolean) => (
    <span className="inline-flex items-center justify-center gap-1.5">
      <span
        className={`inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent ${
          isLoading ? "animate-spin opacity-90" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );

  return (
    <>
      {/* Start Test Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8M4 16V18C4 19.1046 4.89543 20 6 20H8M16 4H18C19.1046 4 20 4.89543 20 6V8M16 20H18C19.1046 20 20 19.1046 20 18V16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-(--text-app-primary)">
                Enter Fullscreen Mode
              </h2>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-(--text-muted)">
                This test will run in fullscreen mode to ensure a focused environment.
              </p>
              <ul className="space-y-2 text-sm text-(--text-muted)">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Do not exit fullscreen or switch tabs during the test</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Ensure stable internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Your progress will be saved automatically</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-(--text-app-primary) font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                className="flex-1 py-3 px-6 rounded-xl bg-(--btn-primary) text-white font-medium hover:opacity-90 cursor-pointer"
              >
                I Agree, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Change Warning Modal */}
      {showSectionChangeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-(--text-app-primary)">
                Warning
              </h2>
            </div>
            <p className="text-(--text-muted) mb-6">
              You are about to move to the next section. Once you proceed, you won't be able to return to this section. Are you sure you want to continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSectionChangeModal(false);
                  setPendingNavigationSection(null);
                  setPendingNavigationQuestion(0);
                }}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-(--text-app-primary) font-medium hover:bg-gray-50 cursor-pointer"
              >
                Stay Here
              </button>
              <button
                onClick={handleConfirmSectionChange}
                className="flex-1 py-3 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">
                ⚠️ Tab Switch Detected!
              </h3>
              <p className="text-gray-700 mb-2">
                You switched away from the test. This is not allowed during the exam.
              </p>
              <p className="text-lg font-semibold text-orange-600">
                Warning {tabSwitchCount} of {MAX_TAB_SWITCHES}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {MAX_TAB_SWITCHES - tabSwitchCount > 0
                  ? `${MAX_TAB_SWITCHES - tabSwitchCount} more switch(es) will auto-submit your test!`
                  : 'Your test is being submitted...'
                }
              </p>
            </div>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 cursor-pointer"
            >
              I Understand, Continue Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Test Modal */}
      <SubmitTestModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setPendingQuestionState(null);
        }}
        onConfirm={handleSubmitTest}
        testName={testName}
        attemptedCount={stats.attempted}
        markedForReviewCount={stats.markedForReview}
        unansweredCount={stats.unanswered}
        notVisitedCount={stats.notVisited}
        timeTaken={timeTakenString}
        completionRate={Math.round((stats.attempted / totalQuestions) * 100)}
        sections={sections.map((section) => {
          let secAttempted = 0;
          let secUnanswered = 0;

          section.questions.forEach((q) => {
            // Check if this question has a pending state update
            const isPendingQ = pendingQuestionState && q.questionId === pendingQuestionState.questionId;
            const state = isPendingQ ? pendingQuestionState : questionStates.get(q.questionId);
            const isCurrentQ = currentQuestion && q.questionId === currentQuestion.questionId;
            const userSelectedAnswers = isCurrentQ ? selectedAnswers : (state?.selectedAnswers || []);
            // const status = state?.status || "NOT_VISITED";

            if (userSelectedAnswers.length > 0) {
              secAttempted++;
            } else {
              // Both NOT_VISITED and visited-but-not-answered are unanswered
              secUnanswered++;
            }
          });

          return {
            sectionName: section.sectionName,
            attempted: secAttempted,
            total: section.totalQuestions,
            unanswered: secUnanswered,
          };
        })}
        timeRemaining={timeLeft ? (timeLeft % 60 > 0 ? `${Math.floor(timeLeft / 60)} min ${timeLeft % 60} sec` : `${Math.floor(timeLeft / 60)} min`) : "N/A"}
      />

      {/* Test Content - Hidden when start modal is showing */}
      {!showStartModal && (
        <div
          className="w-screen min-h-screen bg-[#F9FAFB]"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between pb-2 md:items-center w-full h-[90px] border border-[#d6d6d6] px-7.5 bg-white">
              <div></div>
              <h1 className="text-[#343C6A] text-[1rem] md:text-(--text-app-primary) font-semibold md:text-2xl">
                {testName}
              </h1>

              <div className="sm:flex sm:flex-row sm:justify-between sm:items-center">
                {sectionSwitchingAllowed ? (
                  // Section switching ALLOWED - Use collective timer for all sections
                  <Timer
                    initialSeconds={timeLeft ?? (sectionDurations.reduce((a, b) => a + b, 0) * 60)}
                    onSectionClick={() => setShowMobileSections(true)}
                    onTick={(seconds) => setTimeLeft(seconds)}
                    onTimerEnd={() => {
                      toast("Time's up! Auto-submitting your test...");
                      handleSubmitTest();
                    }}
                  />
                ) : (
                  // Section switching NOT ALLOWED - Timer resets for each section
                  <Timer
                    key={currentSectionIndex} // Reset timer when section changes
                    initialSeconds={timeLeft ?? (sectionDurations[currentSectionIndex] * 60)}
                    onSectionClick={() => setShowMobileSections(true)}
                    onTick={(seconds) => setTimeLeft(seconds)}
                    onTimerEnd={() => {
                      if (currentSectionIndex < sections.length - 1) {
                        // Auto move to next section when section time expires
                        const nextIdx = currentSectionIndex + 1;
                        setCurrentSectionIndex(nextIdx);
                        setCurrentQuestionIndex(0);
                        setTimeLeft(sectionDurations[nextIdx] * 60);
                        toast(`Time up for ${currentSection.sectionName}. Moving to next section.`);
                      } else {
                        // Last section - auto submit
                        toast("Time's up! Auto-submitting your test...");
                        handleSubmitTest();
                      }
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex bg-[#F9FAFB] relative min-h-[calc(100vh-90px)]">
              <div className="flex-1 pb-[90px] md:pb-[173px] md:mr-[354px] p-5">
                <div className="flex flex-col">
                  <Question
                    questionId={currentQuestion.questionId}
                    sectionName={currentSection.sectionName}
                    questionNumber={sectionQuestionNumber.toString()}
                    questionText={currentQuestion.questionText}
                    questionImageUrls={currentQuestion.questionImageUrls}
                  />

                  <Option
                    option={currentQuestion.options || []}
                    multipleAnswer={currentQuestion.multipleAnswer || currentQuestion.isMultipleAnswer || false}
                    subjective={currentQuestion.subjective}
                    selectedAnswers={selectedAnswers}
                    onAnswerChange={setSelectedAnswers}
                  />

                  {/* Mobile + Small Laptop prev/next buttons (visible until xl breakpoint) */}
                  <div className="flex xl:hidden flex-wrap gap-2 items-stretch font-medium text-sm mt-4">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1 min-w-[120px] bg-[#DBE0E5] py-3 px-4 text-(--text-muted) rounded-[10px] disabled:opacity-50 h-[44px] flex items-center justify-center cursor-pointer"
                    >
                      Previous
                    </button>
                    {!isLastQuestion ? (
                      <>
                        <button
                          onClick={handleSaveAndNext}
                          disabled={isActionLoading}
                          className="flex-1 min-w-[120px] bg-[#F69E23] py-3 px-4 rounded-[10px] text-white font-medium h-[44px] flex items-center justify-center cursor-pointer"
                        >
                          {renderLoadingButtonContent("Mark & Next", actionLoading === "MARK_NEXT")}
                        </button>
                        <button
                          onClick={handleClearResponse}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="flex-1 min-w-[80px] bg-red-100 py-3 px-3 rounded-[10px] text-red-600 font-medium h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          {renderLoadingButtonContent("Clear", actionLoading === "CLEAR")}
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={isActionLoading}
                          className="flex-1 min-w-[120px] bg-(--btn-primary) py-3 px-4 rounded-[10px] text-white h-[44px] flex items-center justify-center cursor-pointer"
                        >
                          {renderLoadingButtonContent("Save & Next", actionLoading === "SAVE_NEXT")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleClearResponse}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="flex-1 min-w-[80px] bg-red-100 py-3 px-3 rounded-[10px] text-red-600 font-medium h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          {renderLoadingButtonContent("Clear", actionLoading === "CLEAR")}
                        </button>
                        <button
                          onClick={handleSaveOnly}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="flex-1 min-w-[100px] bg-(--btn-primary) py-3 px-4 rounded-[10px] text-white font-medium h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          {renderLoadingButtonContent("Save", actionLoading === "SAVE")}
                        </button>
                        <button
                          onClick={handleMarkOnly}
                          disabled={isActionLoading}
                          className="flex-1 min-w-[100px] bg-[#F69E23] py-3 px-4 rounded-[10px] text-white font-medium h-[44px] flex items-center justify-center cursor-pointer"
                        >
                          {renderLoadingButtonContent("Mark", actionLoading === "MARK")}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Fixed bottom area */}
                <div className="fixed flex items-center justify-center xl:justify-between gap-3 p-4 xl:p-5 left-0 bottom-0 right-0 xl:right-[354px] bg-[#f9fafb] border-t border-[#d6d6d6] z-10">
                  {/* Legend - Only visible on xl+ in bottom bar */}
                  <div className="hidden xl:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-[#1980E5]"></div>
                      <span className="text-sm text-gray-600">Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-[#21C55D]"></div>
                      <span className="text-sm text-gray-600">Attempted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-[#F69E23]"></div>
                      <span className="text-sm text-gray-600">Marked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-[#EAEDF0]"></div>
                      <span className="text-sm text-gray-600">Unanswered</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 xl:gap-3 justify-center flex-nowrap">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="hidden xl:flex bg-[#DBE0E5] py-2.5 px-6 text-(--text-muted) rounded-[10px] font-medium text-sm disabled:opacity-50 h-[40px] items-center justify-center cursor-pointer whitespace-nowrap"
                    >
                      Previous
                    </button>
                    {!isLastQuestion ? (
                      <>
                        <button
                          onClick={handleSaveAndNext}
                          disabled={isActionLoading}
                          className="hidden xl:flex bg-[#F69E23] py-2.5 px-4 rounded-[10px] text-white font-medium text-sm h-[40px] items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Mark & Next", actionLoading === "MARK_NEXT")}
                        </button>
                        <button
                          onClick={handleClearResponse}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="hidden xl:flex bg-red-100 py-2.5 px-4 rounded-[10px] text-red-600 font-medium text-sm h-[40px] items-center justify-center cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Clear", actionLoading === "CLEAR")}
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={isActionLoading}
                          className="hidden xl:flex bg-(--btn-primary) py-2.5 px-6 rounded-[10px] text-white font-medium text-sm h-[40px] items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Save & Next", actionLoading === "SAVE_NEXT")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleClearResponse}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="hidden xl:flex bg-red-100 py-2.5 px-4 rounded-[10px] text-red-600 font-medium text-sm h-[40px] items-center justify-center cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Clear", actionLoading === "CLEAR")}
                        </button>
                        <button
                          onClick={handleSaveOnly}
                          disabled={selectedAnswers.length === 0 || isActionLoading}
                          className="hidden xl:flex bg-(--btn-primary) py-2.5 px-6 rounded-[10px] text-white font-medium text-sm h-[40px] items-center justify-center cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Save", actionLoading === "SAVE")}
                        </button>
                        <button
                          onClick={handleMarkOnly}
                          disabled={isActionLoading}
                          className="hidden xl:flex bg-[#F69E23] py-2.5 px-4 rounded-[10px] text-white font-medium text-sm h-[40px] items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          {renderLoadingButtonContent("Mark", actionLoading === "MARK")}
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleOpenSubmitModal}
                      disabled={isActionLoading}
                      className="bg-[#21C55D] py-3 px-9 rounded-[10px] text-white font-medium text-[1rem] h-[44px] flex items-center justify-center cursor-pointer"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Sections Sidebar */}
              <div className="hidden md:block fixed right-0 top-[90px] h-[calc(100vh-90px)] w-[354px] bg-[#F1F2F4] overflow-y-auto z-20">
                <div className="flex flex-col gap-4 p-5">
                  {/* Legend - Only visible on smaller screens (< xl) in sidebar */}
                  <div className="flex xl:hidden flex-wrap gap-x-4 gap-y-2 pb-3 border-b border-gray-300">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-[#1980E5]"></div>
                      <span className="text-xs text-gray-600">Current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-[#21C55D]"></div>
                      <span className="text-xs text-gray-600">Attempted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-[#F69E23]"></div>
                      <span className="text-xs text-gray-600">Marked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-[#EAEDF0]"></div>
                      <span className="text-xs text-gray-600">Unanswered</span>
                    </div>
                  </div>

                  {sections.map((section, sectionIdx) => (
                    <Section
                      key={sectionIdx}
                      sectionName={section.sectionName}
                      isDisabled={!sectionSwitchingAllowed && sectionIdx < currentSectionIndex}
                      questions={section.questions.map((q, qIdx) => {
                        const state = questionStates.get(q.questionId);
                        return {
                          questionNumber: qIdx + 1,
                          status: state?.status || "NOT_VISITED",
                        };
                      })}
                      onQuestionClick={(questionIdx) => {
                        if (sectionSwitchingAllowed) {
                          // Section switching allowed - navigate directly
                          setCurrentSectionIndex(sectionIdx);
                          setCurrentQuestionIndex(questionIdx);
                        } else {
                          // Logic: Cannot go back to previous sections. Only current or forward (with warning).
                          if (sectionIdx < currentSectionIndex) {
                            toast.error("You cannot navigate back to previous sections.");
                            return;
                          }

                          // Check if navigating to a different section that's ahead
                          if (sectionIdx > currentSectionIndex) {
                            setPendingNavigationSection(sectionIdx);
                            setPendingNavigationQuestion(questionIdx);
                            setShowSectionChangeModal(true);
                          } else {
                            setCurrentSectionIndex(sectionIdx);
                            setCurrentQuestionIndex(questionIdx);
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile Sections Drawer */}
              {showMobileSections && (
                <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-4 h-[90px] border-b border-[#d6d6d6] px-5">
                    <button
                      onClick={() => setShowMobileSections(false)}
                      className="flex items-center gap-2 text-(--text-app-primary) font-medium cursor-pointer"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      Back to Test
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 p-5 border-b border-[#d6d6d6] bg-[#F9FAFB]">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#1980E5]"></div>
                      <p className="text-(--text-app-primary) font-normal text-sm">
                        Current
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#21C55D]"></div>
                      <p className="text-(--text-app-primary) font-normal text-sm">
                        Attempted
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#F69E23]"></div>
                      <p className="text-(--text-app-primary) font-normal text-sm">
                        Marked
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#EAEDF0]"></div>
                      <p className="text-(--text-app-primary) font-normal text-sm">
                        Not Visited
                      </p>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="flex-1 overflow-y-auto bg-[#F1F2F4] p-5">
                    <div className="flex flex-col gap-4">
                      {sections.map((section, sectionIdx) => (
                        <Section
                          key={sectionIdx}
                          sectionName={section.sectionName}
                          isDisabled={!sectionSwitchingAllowed && sectionIdx < currentSectionIndex}
                          questions={section.questions.map((q, qIdx) => {
                            const state = questionStates.get(q.questionId);
                            return {
                              questionNumber: qIdx + 1,
                              status: state?.status || "NOT_VISITED",
                            };
                          })}
                          onQuestionClick={(questionIdx) => {
                            // Logic: close drawer and navigate
                            setShowMobileSections(false);

                            if (sectionSwitchingAllowed) {
                              // Section switching allowed - navigate directly
                              setCurrentSectionIndex(sectionIdx);
                              setCurrentQuestionIndex(questionIdx);
                            } else {
                              if (sectionIdx < currentSectionIndex) {
                                toast.error("You cannot navigate back to previous sections.");
                                return;
                              }
                              if (sectionIdx > currentSectionIndex) {
                                setPendingNavigationSection(sectionIdx);
                                setPendingNavigationQuestion(questionIdx);
                                setShowSectionChangeModal(true);
                              } else {
                                setCurrentSectionIndex(sectionIdx);
                                setCurrentQuestionIndex(questionIdx);
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Modal - Show if present */}
      {
        testResult && (
          <TestResult
            resultData={testResult}
            onRetake={() => window.location.reload()}
            onExit={() => {
              // Exit fullscreen first
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
              }
              navigate(`/test-info/${testId}`, { state: { testGroupId } });
            }}
          />
        )
      }
    </>
  );
}