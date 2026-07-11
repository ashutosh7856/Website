import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { QuestionTable } from "@/components/create-test/components/QuestionTable";
import { useAuthStore } from "@/store/AuthStore";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { QuestionPreviewModal } from "@/components/modals/QuestionPreviewModal";

interface Question {
  questionId: string;
  questionText: string;
  questionImageUrls: string[];
  isMultipleAnswer: boolean;
  options: {
    optionId: string;
    value: string;
    imageUrl: string | null;
  }[];
  correctAnswerIds: string[];
}

interface Section {
  sectionName: string;
  totalQuestionsSupposedToBeAdded?: number;
  totalQuestionsAdded?: number;
  sectionDurationInMinutes?: number;
  pointsForCorrectAnswer?: number | null;
  negativeMarks?: number | null;
  totalQuestions?: number;
  questions: Question[];
}

interface TestData {
  testSeriesId: string;
  counsellorId: string;
  testName: string;
  testDescription: string;
  testGroupId?: string;
  listOfSection: Section[];
}

export function AddQuestion() {
  const { testId } = useParams<{ testId: string }>();
  const testSeriesId = testId; // Alias for consistency with API
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  const [testData, setTestData] = useState<TestData | null>(
    location.state?.testData || null
  );
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingTestData, setLoadingTestData] = useState<boolean>(false);

  const [questionType, setQuestionType] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"objective" | "subjective">("objective");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [responseType, setResponseType] = useState<"single" | "multi">("single");
  const [questionText, setQuestionText] = useState<string>("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [existingQuestionImageUrls, setExistingQuestionImageUrls] = useState<string[]>([]);
  const [options, setOptions] = useState([
    { id: "A", text: "", image: null as File | null, imageUrl: null as string | null },
    { id: "B", text: "", image: null as File | null, imageUrl: null as string | null },
    { id: "C", text: "", image: null as File | null, imageUrl: null as string | null },
    { id: "D", text: "", image: null as File | null, imageUrl: null as string | null },
  ]);
  const [correctOption, setCorrectOption] = useState<string>("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [solution, setSolution] = useState<string>("");
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [existingSolutionImageUrl, setExistingSolutionImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ questionId: string; sectionName: string } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ questionId: string; sectionName: string } | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [previewQuestion, setPreviewQuestion] = useState<{
    question: any;
    sectionName: string;
  } | null>(null);

  const toggleCorrectOption = (optionId: string) => {
    if (responseType === "single") {
      setCorrectOption(optionId);
      setCorrectOptions([optionId]);
    } else {
      setCorrectOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  // Fetch test data on mount if not available from navigation state
  useEffect(() => {
    if (!isAuthenticated || !user?.phoneNumber || !testSeriesId) {
      navigate("/");
      return;
    }

    // If test data not available from navigation state, fetch it
    if (!testData) {
      setLoadingTestData(true);
      const myHeaders = new Headers();
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/");
        return;
      }

      myHeaders.append("Authorization", `Bearer ${token}`);
      myHeaders.append("Accept", "application/json");

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/getTestSeriesByIdForCounsellor?counsellorId=${user.phoneNumber}&testSeriesId=${testSeriesId}`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          if (result.status && result.data) {
            setTestData(result.data);
          } else {
            console.error("Failed to fetch test data:", result.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching test data:", error);
        })
        .finally(() => {
          setLoadingTestData(false);
        });
    }
  }, [isAuthenticated, user, testSeriesId, navigate, testData]);

  // Fetch all questions for all sections
  useEffect(() => {
    if (testData && user?.phoneNumber && testSeriesId) {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);
      myHeaders.append("Accept", "application/json");

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/getAllQuestionsForCounsellorOfAllSection?counsellorId=${user.phoneNumber}&testSeriesId=${testSeriesId}`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          if (result.status && result.data) {
            // Merge fetched questions with testData sections
            const updatedSections = testData.listOfSection.map((masterSection: Section) => {
              const fetchedSection = result.data.find(
                (s: Section) => s.sectionName === masterSection.sectionName
              );
              return {
                ...masterSection,
                ...fetchedSection, // Keep fetched data like questions
                totalQuestionsSupposedToBeAdded: masterSection.totalQuestionsSupposedToBeAdded,
                sectionDurationInMinutes: masterSection.sectionDurationInMinutes,
                pointsForCorrectAnswer: masterSection.pointsForCorrectAnswer ?? null,
                negativeMarks: masterSection.negativeMarks ?? null,
                totalQuestionsAdded: fetchedSection?.totalQuestions || 0,
                questions: fetchedSection?.questions || [],
              };
            });
            setSections(updatedSections);
          }
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
        });
    }
  }, [testData, user?.phoneNumber, testSeriesId]);

  // Update sections when testData changes and set first section as default
  useEffect(() => {
    if (testData?.listOfSection) {
      // Initialize with testData sections if no API data yet, or if API failed
      // This serves as a fallback or initial state
      if (sections.length === 0) {
        setSections(testData.listOfSection.map(s => ({
          ...s,
          questions: [],
          totalQuestionsAdded: 0
        })));
      }

      // Set first section as default category only if not already set
      if (!selectedCategory && testData.listOfSection.length > 0) {
        setSelectedCategory(testData.listOfSection[0].sectionName);
      }
    }
  }, [testData]);

  const handleSubmitQuestion = async () => {
    if (!user?.phoneNumber || !testSeriesId || !selectedCategory || !questionText) {
      console.error("Missing required fields");
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate that question text is not empty
    if (!questionText.trim()) {
      toast.error("Please enter question text");
      return;
    }

    // Validate that all options have text
    const emptyOptions = options.filter(opt => !opt.text.trim());
    if (emptyOptions.length > 0) {
      toast.error(`Please fill in text for option(s): ${emptyOptions.map(o => o.id).join(", ")}`);
      return;
    }

    // Validate that at least one correct answer is selected
    if (responseType === "multi") {
      if (correctOptions.length === 0) {
        toast.error("Please select at least one correct answer");
        return;
      }
    } else {
      if (!correctOption) {
        toast.error("Please select the correct answer");
        return;
      }
    }

    setIsSubmitting(true);

    const counsellorId = user.phoneNumber;
    const isEditing = editingQuestion !== null;

    const questionData = {
      questionText,
      questionImageUrls: [],
      multipleAnswer: responseType === "multi",
      subjective: false,
      options: options.map((opt) => ({
        optionId: opt.id,
        value: opt.text,
        imageUrl: null,
      })),
      correctAnswerIds: correctOptions.length > 0 ? correctOptions : (correctOption ? [correctOption] : []),
      solution: solution || "",
    };

    const requestData: any = {
      counsellorId,
      testSeriesId,
      sectionName: selectedCategory,
      question: questionData,
    };

    if (isEditing) {
      requestData.questionId = editingQuestion.questionId;
    }

    const myHeaders = new Headers();
    const token = localStorage.getItem("jwt");
    if (!token) {
      console.error("No authentication token found");
      setIsSubmitting(false);
      return;
    }

    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Accept", "application/json");

    const formdata = new FormData();
    formdata.append("request", JSON.stringify(requestData));

    if (questionImage) {
      formdata.append("questionImages", questionImage);
    }

    options.forEach((opt) => {
      if (opt.image) {
        formdata.append(`option${opt.id}Image`, opt.image);
      }
    });

    if (solutionImage) {
      formdata.append("solutionImage", solutionImage);
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    try {
      const apiUrl = isEditing
        ? `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/updateQuestion`
        : `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/addQuestion`;

      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();
      console.log(result);

      if (result.status && result.data) {
        setTestData(result.data);

        setQuestionText("");
        setQuestionImage(null);
        setExistingQuestionImageUrls([]);
        setSolution("");
        setSolutionImage(null);
        setExistingSolutionImageUrl(null);
        setOptions([
          { id: "A", text: "", image: null, imageUrl: null },
          { id: "B", text: "", image: null, imageUrl: null },
          { id: "C", text: "", image: null, imageUrl: null },
          { id: "D", text: "", image: null, imageUrl: null },
        ]);
        setCorrectOption("");
        setCorrectOptions([]);
        setEditingQuestion(null);

        console.log(isEditing ? "Question updated successfully" : "Question added successfully");
      } else {
        console.error("Failed to add question:", result.message);
      }
    } catch (error) {
      console.error("Error adding question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async (questionId: string, sectionName: string) => {
    if (!user?.phoneNumber || !testSeriesId) return;

    // Fetch question details from API to get image URLs
    const token = localStorage.getItem("jwt");
    if (!token) return;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Accept", "application/json");

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/getQuestionByIdForCounsellor?counsellorId=${user.phoneNumber}&testSeriesId=${testSeriesId}&sectionName=${sectionName}&questionId=${questionId}`,
        requestOptions
      );
      const result = await response.json();

      if (result.status && result.data?.question) {
        const question = result.data.question;

        // Populate form with question data
        setEditingQuestion({ questionId, sectionName });
        setQuestionText(question.questionText);
        setSelectedCategory(sectionName);
        // Check both field names as API uses inconsistent naming (multipleAnswer vs isMultipleAnswer)
        const isMulti = question.isMultipleAnswer || question.multipleAnswer || false;
        setResponseType(isMulti ? "multi" : "single");
        setCorrectOptions(question.correctAnswerIds || []);
        if (!isMulti && question.correctAnswerIds?.length > 0) {
          setCorrectOption(question.correctAnswerIds[0]);
        }

        // Set existing question images
        setExistingQuestionImageUrls(question.questionImageUrls || []);
        setQuestionImage(null);

        // Set options with image URLs
        if (question.options && question.options.length > 0) {
          setSelectedType("objective");
          const formattedOptions = question.options.map((opt: any) => ({
            id: opt.optionId,
            text: opt.value,
            image: null as File | null,
            imageUrl: opt.imageUrl || null,
          }));
          // Pad to 4 options if less
          while (formattedOptions.length < 4) {
            const nextId = String.fromCharCode(65 + formattedOptions.length);
            formattedOptions.push({ id: nextId, text: "", image: null, imageUrl: null });
          }
          setOptions(formattedOptions);
        } else {
          setSelectedType("subjective");
        }

        // Set solution and solution image
        setSolution(question.solution || "");
        setExistingSolutionImageUrl(question.solutionImageUrl || null);
        setSolutionImage(null);

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error fetching question details:", error);
    }
  };

  const handleViewQuestion = async (questionId: string, sectionName: string) => {
    if (!user?.phoneNumber || !testSeriesId) return;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Accept", "application/json");

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/getQuestionByIdForCounsellor?counsellorId=${user.phoneNumber}&testSeriesId=${testSeriesId}&sectionName=${sectionName}&questionId=${questionId}`,
        requestOptions
      );
      const result = await response.json();

      if (result.status && result.data?.question) {
        setPreviewQuestion({
          question: result.data.question,
          sectionName: sectionName,
        });
      } else {
        toast.error("Failed to load question preview");
      }
    } catch (error) {
      console.error("Error fetching question details:", error);
      toast.error("Error loading question preview");
    }
  };

  const handleDeleteQuestion = async (questionId: string, sectionName: string) => {
    if (!user?.phoneNumber || !testSeriesId) return;

    setIsDeleting(true);
    const counsellorId = user.phoneNumber;

    const requestData = {
      counsellorId,
      testSeriesId,
      sectionName,
      questionId,
    };

    const myHeaders = new Headers();
    const token = localStorage.getItem("jwt");
    if (!token) {
      setIsDeleting(false);
      return;
    }

    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestData),
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/deleteQuestion`,
        requestOptions
      );
      const result = await response.json();

      if (result.status && result.data) {
        toast.success("Question deleted successfully!");
        setTestData(result.data);

        // Refetch questions to update the list smoothly
        const refetchHeaders = new Headers();
        refetchHeaders.append("Authorization", `Bearer ${token}`);
        refetchHeaders.append("Accept", "application/json");

        fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/getAllQuestionsForCounsellorOfAllSection?counsellorId=${counsellorId}&testSeriesId=${testSeriesId}`,
          { method: "GET", headers: refetchHeaders }
        )
          .then((res) => res.json())
          .then((res) => {
            if (res.status && res.data) {
              const updatedSections = res.data.map((section: Section) => {
                const matchingSection = testData?.listOfSection?.find(
                  (s) => s.sectionName === section.sectionName
                );
                return {
                  ...section,
                  totalQuestionsSupposedToBeAdded: matchingSection?.totalQuestionsSupposedToBeAdded,
                  sectionDurationInMinutes: matchingSection?.sectionDurationInMinutes,
                  pointsForCorrectAnswer: matchingSection?.pointsForCorrectAnswer ?? null,
                  negativeMarks: matchingSection?.negativeMarks ?? null,
                  totalQuestionsAdded: section.totalQuestions || 0,
                };
              });
              setSections(updatedSections);
            }
          })
          .finally(() => setIsDeleting(false));
      } else {
        toast.error(result.message || "Failed to delete question");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("An error occurred while deleting the question");
      setIsDeleting(false);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const getAllQuestions = () => {
    if (!sections || sections.length === 0) return [];

    let allQuestions: any[] = [];
    sections.forEach((section) => {
      section.questions.forEach((q: Question) => {
        // Check both field names as API uses inconsistent naming
        const isMulti = (q as any).isMultipleAnswer || (q as any).multipleAnswer || false;
        allQuestions.push({
          ...q,
          sectionName: section.sectionName,
          type: isMulti ? "Multi Select" : "Single Select",
        });
      });
    });

    let filtered = allQuestions;

    if (questionType !== "all") {
      filtered = filtered.filter((q) => {
        if (questionType === "objective") {
          return q.type.includes("Select");
        } else if (questionType === "subjective") {
          return q.type === "Subjective";
        }
        return true;
      });
    }

    if (category !== "all") {
      filtered = filtered.filter((q) => q.sectionName === category);
    }

    return filtered;
  };

  const handlePublishTestSeries = async () => {
    if (!user?.phoneNumber || !testSeriesId) {
      console.error("Missing required fields");
      return;
    }

    setIsPublishing(true);

    const token = localStorage.getItem("jwt");
    if (!token) {
      setIsPublishing(false);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      counsellorId: user.phoneNumber,
      testSeriesId: testSeriesId,
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/publishTestSeries`,
        requestOptions
      );
      const result = await response.json();

      if (result.status) {
        toast.success("Test Series published successfully!");
        setTimeout(() => {
          navigate("/counsellor-dashboard", {
            state: { activeTab: "courses" }
          });
        }, 600);
      } else {
        toast.error(result.message || "Failed to publish test series");
      }
    } catch (error) {
      console.error("Error publishing test series:", error);
      toast.error("Error publishing test series. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (loadingTestData) {
    return (
      <div className="pt-4 pb-8 max-w-7xl min-h-screen mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-[#13097D] border-gray-200 rounded-full animate-spin"></div>
          <p className="text-(--text-muted) text-lg">Loading test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-8 max-w-7xl min-h-screen mx-auto flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={() => {
          if (testData?.testGroupId) {
            navigate(`/counselor/test-groups/${testData.testGroupId}`, { replace: true });
          } else {
            navigate("/counsellor-dashboard", {
              state: { activeTab: "courses" },
              replace: true
            });
          }
        }}
        className="flex items-center gap-2 text-(--text-app-primary) hover:text-(--btn-primary) transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">{testData?.testGroupId ? "Back to Test Group" : "Back to Test Groups"}</span>
      </button>

      <div className="grid grid-cols-2 gap-4">
        {/* creation side  */}
        <div className="shadow-[0px_0px_4px_0px_#00000026] rounded-2xl">
          <div className="bg-[#F9FAFB] w-full min-h-[72px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-(--text-app-primary) font-medium text-2xl">
                Question Type
              </h1>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedType("objective")}
                  className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg font-medium text-base transition-all w-[149px] h-[39px] cursor-pointer ${selectedType === "objective"
                    ? "bg-(--btn-primary) text-white border border-(--btn-primary)"
                    : "bg-transparent text-(--text-app-primary) border border-[#E9EBEC]"
                    }`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full border font-bold ${selectedType === "objective"
                    ? "bg-white text-(--btn-primary) border-white"
                    : "bg-transparent border-[#E9EBEC]"
                    }`}>
                    {selectedType === "objective" && "✓"}
                  </span>
                  Objective
                </button>

                <button
                  disabled
                  className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg font-medium text-base transition-all w-[149px] h-[39px] bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-60"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full border font-bold bg-transparent border-gray-300">
                  </span>
                  Subjective
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 flex flex-col gap-6">
            {/* Question Field */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                Question
              </label>
              <div className="relative border border-[#E8EAED] rounded-xl p-4 pb-12">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text/plain');
                    // Clean and normalize the pasted text
                    const cleanedText = pastedText
                      .normalize('NFC') // Normalize Unicode
                      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters except newline/tab
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newText = questionText.substring(0, start) + cleanedText + questionText.substring(end);
                    setQuestionText(newText);
                    // Set cursor position after paste
                    setTimeout(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + cleanedText.length;
                    }, 0);
                  }}
                  placeholder="Enter your question here"
                  className="w-full min-h-[100px] resize-none text-base placeholder:text-gray-400 outline-none"
                />
                {/* Show existing images from API */}
                {existingQuestionImageUrls.length > 0 && !questionImage && (
                  <div className="mt-3 mb-2 flex flex-wrap gap-2">
                    {existingQuestionImageUrls.map((url, index) => (
                      <div key={index} className="max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                        <img loading="lazy" decoding="async"
                          src={url}
                          alt={`Question ${index + 1}`}
                          className="max-w-full h-auto max-h-[400px] object-contain"
                        />
                        <button
                          onClick={() => {
                            setExistingQuestionImageUrls(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Show new uploaded image */}
                {questionImage && (
                  <div className="mt-3 mb-2 max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                    <img loading="lazy" decoding="async"
                      src={URL.createObjectURL(questionImage)}
                      alt="Question"
                      className="max-w-full h-auto max-h-[400px] object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuestionImage(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
                <label htmlFor="question-image" className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <img loading="lazy" decoding="async" src="/image.svg" alt="Add image" className="w-6 h-6" />
                  <input
                    id="question-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQuestionImage(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Select Category */}
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                Select Category
              </label>
              <div className="flex gap-3 flex-wrap">
                {sections.length > 0 ? (
                  sections.map((section) => {
                    const addedCount = section.questions?.length || 0;
                    const requiredCount = section.totalQuestionsSupposedToBeAdded || 0;
                    const isComplete = addedCount >= requiredCount && addedCount > 0;

                    return (
                      <button
                        key={section.sectionName}
                        onClick={() => setSelectedCategory(section.sectionName)}
                        className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg font-medium text-base transition-all capitalize cursor-pointer ${selectedCategory === section.sectionName
                          ? "bg-(--btn-primary) text-white border border-(--btn-primary)"
                          : "bg-transparent text-(--text-app-primary) border border-[#E9EBEC]"
                          }`}
                      >
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full border font-bold ${selectedCategory === section.sectionName
                          ? "bg-white text-(--btn-primary) border-white"
                          : "bg-transparent border-[#E9EBEC]"
                          }`}>
                          {selectedCategory === section.sectionName && "✓"}
                        </span>
                        {section.sectionName}
                        <span className={`text-xs ml-1 ${isComplete ? 'text-green-500' : 'text-red-500'}`}>
                          ({addedCount}/{requiredCount})
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-sm">No sections available. Please create a test first.</p>
                )}
              </div>
            </div>

            {/* Response Type - Only for Objective */}
            {selectedType === "objective" && (
              <>
                <div className="flex flex-col gap-3">
                  <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                    Response Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setResponseType("single")}
                      className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg font-medium text-base transition-all cursor-pointer ${responseType === "single"
                        ? "bg-(--btn-primary) text-white border border-(--btn-primary)"
                        : "bg-transparent text-(--text-app-primary) border border-[#E9EBEC]"
                        }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full border font-bold ${responseType === "single"
                        ? "bg-white text-(--btn-primary) border-white"
                        : "bg-transparent border-[#E9EBEC]"
                        }`}>
                        {responseType === "single" && "✓"}
                      </span>
                      Single select
                    </button>

                    <button
                      onClick={() => setResponseType("multi")}
                      className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg font-medium text-base transition-all cursor-pointer ${responseType === "multi"
                        ? "bg-(--btn-primary) text-white border border-(--btn-primary)"
                        : "bg-transparent text-(--text-app-primary) border border-[#E9EBEC]"
                        }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full border font-bold ${responseType === "multi"
                        ? "bg-white text-(--btn-primary) border-white"
                        : "bg-transparent border-[#E9EBEC]"
                        }`}>
                        {responseType === "multi" && "✓"}
                      </span>
                      Multi select
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-4">
                  <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                    Options
                  </label>
                  {options.map((option, index) => (
                    <div key={option.id} className="p-4 border border-[#E8EAED] rounded-xl bg-white">
                      <div className="flex items-center gap-3">
                        <input
                          type={responseType === "single" ? "radio" : "checkbox"}
                          name={responseType === "single" ? "correctOption" : undefined}
                          checked={correctOptions.includes(option.id)}
                          onChange={() => toggleCorrectOption(option.id)}
                          style={{
                            width: '33.33px',
                            height: '33.33px',
                            borderRadius: '6px',
                            border: '2px solid #6B7280',
                            accentColor: 'var(--btn-primary)'
                          }}
                          className="cursor-pointer shrink-0"
                        />
                        <span className="text-lg font-normal leading-[100%] text-[#6B7280]">
                          {option.id}.
                        </span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index].text = e.target.value;
                            setOptions(newOptions);
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text/plain');
                            // Clean and normalize the pasted text
                            const cleanedText = pastedText
                              .normalize('NFC') // Normalize Unicode
                              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                              .replace(/\n/g, ' '); // Replace newlines with space for single-line input
                            const start = e.currentTarget.selectionStart || 0;
                            const end = e.currentTarget.selectionEnd || 0;
                            const currentText = option.text;
                            const newText = currentText.substring(0, start) + cleanedText + currentText.substring(end);
                            const newOptions = [...options];
                            newOptions[index].text = newText;
                            setOptions(newOptions);
                          }}
                          placeholder="Write option here"
                          className="flex-1 text-lg font-normal leading-[100%] text-(--text-app-primary) outline-none placeholder:text-gray-400"
                        />
                        <label className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <img loading="lazy" decoding="async" src="/image.svg" alt="Add image" className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const newOptions = [...options];
                                newOptions[index].image = e.target.files[0];
                                setOptions(newOptions);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Show option images inside the same box */}
                      {(option.imageUrl || option.image) && (
                        <div className="mt-3 mb-2 flex flex-wrap gap-2">
                          {/* Show existing image from API */}
                          {option.imageUrl && (
                            <div className="max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                              <img loading="lazy" decoding="async"
                                src={option.imageUrl}
                                alt={`Option ${option.id} (existing)`}
                                className="max-w-full h-auto max-h-[300px] object-contain"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = [...options];
                                  newOptions[index].imageUrl = null;
                                  setOptions(newOptions);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* Show newly uploaded image */}
                          {option.image && (
                            <div className="max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                              <img loading="lazy" decoding="async"
                                src={URL.createObjectURL(option.image)}
                                alt={`Option ${option.id} (new)`}
                                className="max-w-full h-auto max-h-[300px] object-contain"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = [...options];
                                  newOptions[index].image = null;
                                  setOptions(newOptions);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Correct Option - Show for both Single and Multi Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                    Correct Option{responseType === "multi" ? "s" : ""}
                  </label>
                  {responseType === "single" ? (
                    <Select value={correctOption} onValueChange={(value) => {
                      setCorrectOption(value);
                      setCorrectOptions([value]);
                    }}>
                      <SelectTrigger className="border border-[#E8EAED] rounded-xl p-3 text-base">
                        <SelectValue placeholder="Option A" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id} className="text-base">
                            Option {opt.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 border border-[#E8EAED] rounded-xl bg-gray-50">
                      <p className="text-sm text-(--text-muted)">
                        {correctOptions.length > 0
                          ? `Selected: ${correctOptions.map(id => `Option ${id}`).join(", ")}`
                          : "Select correct options using checkboxes above"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Solution Field */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium leading-[125%] text-(--text-app-primary)">
                Solution (Optional)
              </label>
              <div className="relative border border-[#E8EAED] rounded-xl p-4 pb-12">
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text/plain');
                    const cleanedText = pastedText
                      .normalize('NFC')
                      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newText = solution.substring(0, start) + cleanedText + solution.substring(end);
                    setSolution(newText);
                    setTimeout(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + cleanedText.length;
                    }, 0);
                  }}
                  placeholder="Enter solution explanation here"
                  className="w-full min-h-[80px] resize-none text-base placeholder:text-gray-400 outline-none"
                />
                {/* Show existing solution image from API */}
                {existingSolutionImageUrl && !solutionImage && (
                  <div className="mt-3 mb-2 max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                    <img loading="lazy" decoding="async"
                      src={existingSolutionImageUrl}
                      alt="Solution"
                      className="max-w-full h-auto max-h-[400px] object-contain"
                    />
                    <button
                      onClick={() => setExistingSolutionImageUrl(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
                {/* Show new uploaded solution image */}
                {solutionImage && (
                  <div className="mt-3 mb-2 max-w-full h-auto rounded-2xl border border-[#E8EAED] bg-[#F9FAFB] p-2 relative">
                    <img loading="lazy" decoding="async"
                      src={URL.createObjectURL(solutionImage)}
                      alt="Solution"
                      className="max-w-full h-auto max-h-[400px] object-contain"
                    />
                    <button
                      onClick={() => setSolutionImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
                <label htmlFor="solution-image" className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <img loading="lazy" decoding="async" src="/image.svg" alt="Add image" className="w-6 h-6" />
                  <input
                    id="solution-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSolutionImage(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center gap-3 mt-4">
              {editingQuestion && (
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setQuestionText("");
                    setQuestionImage(null);
                    setExistingQuestionImageUrls([]);
                    setSolution("");
                    setSolutionImage(null);
                    setExistingSolutionImageUrl(null);
                    setOptions([
                      { id: "A", text: "", image: null, imageUrl: null },
                      { id: "B", text: "", image: null, imageUrl: null },
                      { id: "C", text: "", image: null, imageUrl: null },
                      { id: "D", text: "", image: null, imageUrl: null },
                    ]);
                    setCorrectOption("");
                    setCorrectOptions([]);
                  }}
                  className="py-3 px-8 bg-gray-500 text-white font-medium text-base rounded-xl hover:bg-gray-600 transition-colors shadow-md cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <div className="relative group">
                <button
                  onClick={() => {
                    // Check if section limit is reached
                    const section = sections.find(s => s.sectionName === selectedCategory);
                    if (!editingQuestion && section) {
                      const added = section.questions?.length || 0;
                      const limit = section.totalQuestionsSupposedToBeAdded || 0;
                      if (added >= limit) {
                        toast.error(`Section "${section.sectionName}" is full. You cannot add more questions.`);
                        return;
                      }
                    }
                    handleSubmitQuestion();
                  }}
                  disabled={isSubmitting || !questionText || !selectedCategory || (selectedType === "objective" && correctOptions.length === 0) || (!editingQuestion && (() => {
                    const section = sections.find(s => s.sectionName === selectedCategory);
                    return section && (section.questions?.length || 0) >= (section.totalQuestionsSupposedToBeAdded || 0);
                  })())}
                  className="py-3 px-8 bg-[#00C853] text-white font-medium text-base rounded-xl hover:bg-[#00B04A] transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? (editingQuestion ? "Updating..." : "Submitting...") : (editingQuestion ? "Update Question" : "Submit Question")}
                </button>
                {/* Tooltip for full section */}
                {(!editingQuestion && selectedCategory && (() => {
                  const section = sections.find(s => s.sectionName === selectedCategory);
                  return section && (section.questions?.length || 0) >= (section.totalQuestionsSupposedToBeAdded || 0);
                })()) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Section limit reached
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* listing side */}
        <div className="shadow-[0px_0px_4px_0px_#00000026] rounded-2xl flex  flex-col gap-4">
          <div className="bg-(--bg-second) w-full h-[72px] flex items-center justify-between px-3">
            <h1 className="text-(--text-app-primary) font-medium text-2xl">
              My Uploaded Questions
            </h1>
            <div className="relative group">
              <button
                onClick={() => {
                  const validationErrors = sections.map(section => {
                    const added = section.questions?.length || 0;
                    const required = section.totalQuestionsSupposedToBeAdded || 0;
                    if (added === 0) return `${section.sectionName}: Empty`;
                    if (added < required) return `${section.sectionName}: Need ${required}, has ${added}`;
                    return null;
                  }).filter(Boolean);

                  if (validationErrors.length > 0) {
                    console.log("Validation blocked publish:", validationErrors);
                    toast.error("Please add all required questions before publishing.");
                    return;
                  }
                  handlePublishTestSeries();
                }}
                disabled={isPublishing || sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0) === 0 || (() => {
                  const errors = sections.map(section => {
                    const added = section.questions?.length || 0;
                    const required = section.totalQuestionsSupposedToBeAdded || 0;
                    if (added === 0) return true;
                    if (added < required) return true;
                    return false;
                  });
                  return errors.some(e => e);
                })()}
                className="py-2 px-6 bg-(--btn-primary) text-white font-medium text-base rounded-xl hover:opacity-90 transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isPublishing && <Loader2 className="w-5 h-5 animate-spin" />}
                {isPublishing ? "Publishing..." : "Publish Test Series"}
              </button>

              {/* Custom Tooltip for Validation Errors */}
              {(sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0) === 0 || sections.some(s => {
                const added = s.questions?.length || 0;
                const required = s.totalQuestionsSupposedToBeAdded || 0;
                return added === 0 || added < required;
              })) && (
                  <div className="absolute right-0 top-full mt-2 w-max max-w-xs p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <ul className="list-disc pl-4 space-y-1">
                      {sections.map((section, idx) => {
                        const added = section.questions?.length || 0;
                        const required = section.totalQuestionsSupposedToBeAdded || 0;

                        if (added === 0) {
                          return <li key={idx}><span className="font-semibold">{section.sectionName}</span> is empty.</li>;
                        }
                        if (added < required) {
                          return <li key={idx}><span className="font-semibold">{section.sectionName}</span>: {required - added} more required.</li>;
                        }
                        return null;
                      })}
                      {sections.length === 0 && <li>No sections found.</li>}
                    </ul>
                  </div>
                )}
            </div>
          </div>
          <div className="flex gap-4 px-3">
            <div className="flex flex-col justify-between items-start p-4 bg-(--bg-second) rounded-2xl border border-[#E8EAED] w-[151px] h-[70px]">
              <h1 className="text-xs font-normal text-(--text-muted)">Total</h1>
              <p className="text-[1.125rem] font-medium text-(--text-app-primary)">
                {sections.reduce((acc, s) => acc + (s.totalQuestions || s.totalQuestionsAdded || 0), 0)}
              </p>
            </div>
            <div className="flex flex-col justify-between items-start p-4 bg-(--bg-second) rounded-2xl border border-[#E8EAED] w-[151px] h-[70px]">
              <h1 className="text-xs font-normal text-(--text-muted)">
                Objective
              </h1>
              <p className="text-[1.125rem] font-medium text-(--text-app-primary)">
                {sections.reduce((acc, s) => acc + s.questions.filter((q: Question) => q.options?.length > 0).length, 0)}
              </p>
            </div>
            <div className="flex flex-col justify-between items-start p-4 bg-(--bg-second) rounded-2xl border border-[#E8EAED] w-[151px] h-[70px]">
              <h1 className="text-xs font-normal text-(--text-muted)">
                Subjective
              </h1>
              <p className="text-[1.125rem] font-medium text-(--text-app-primary)">
                {sections.reduce((acc, s) => acc + s.questions.filter((q: Question) => !q.options || q.options.length === 0).length, 0)}
              </p>
            </div>
            <div className="flex flex-col justify-between items-start p-4 bg-(--bg-second) rounded-2xl border border-[#E8EAED] w-[151px] h-[70px]">
              <h1 className="text-xs font-normal text-(--text-muted)">
                Categories
              </h1>
              <p className="text-[1.125rem] font-medium text-(--text-app-primary)">
                {sections.length}
              </p>
            </div>
          </div>

          {/* filters  */}
          <div className="flex gap-6 border-b border-t border-[#E9EBEC] p-3">
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger className="w-[227px] h-9 border border-[#E8EAED] rounded-[12px] text-xs font-medium text-(--text-app-primary) leading-[125%] cursor-pointer">
                <SelectValue placeholder="All Questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Questions
                </SelectItem>
                <SelectItem value="objective" className="text-xs font-medium">
                  Objective
                </SelectItem>
                <SelectItem value="subjective" className="text-xs font-medium">
                  Subjective
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[227px] h-9 border border-[#E8EAED] rounded-[12px] text-xs font-medium text-(--text-app-primary) leading-[125%] cursor-pointer">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Categories
                </SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.sectionName} value={section.sectionName} className="text-xs font-medium capitalize">
                    {section.sectionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* questions table  */}
          <QuestionTable
            data={getAllQuestions()}
            onEdit={(questionId, sectionName) => {
              handleEditQuestion(questionId, sectionName);
            }}
            onDelete={(questionId, sectionName) => {
              setDeleteConfirmation({ questionId, sectionName });
            }}
            onView={(questionId) => {
              // Find the question to get its section name
              const allQ = getAllQuestions();
              const q = allQ.find((question: any) => question.questionId === questionId);
              if (q) {
                handleViewQuestion(questionId, q.sectionName);
              }
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-semibold text-(--text-app-primary) mb-4">
              Delete Question
            </h2>
            <p className="text-(--text-muted) mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-[#E9EBEC] text-(--text-app-primary) hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuestion(deleteConfirmation.questionId, deleteConfirmation.sectionName)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      <QuestionPreviewModal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        question={previewQuestion?.question || null}
        sectionName={previewQuestion?.sectionName}
      />
    </div>
  );
}
