import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { compareAnswers } from "@/api/userTestSeries";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { MathText } from "@/components/common/MathText";


interface Option {
    optionId: string;
    value: string;
    imageUrl: string | null;
    isSelectedByUser: boolean;
    isCorrect: boolean;
}

interface Question {
    questionId: string;
    questionText: string;
    questionImageUrls?: string[];
    options: Option[] | null;
    userAnswerIds: string[];
    correctAnswerIds: string[];
    isCorrect: boolean;
    solution: string | null;
    solutionImageUrl: string | null;
}

interface SectionData {
    sectionName: string;
    questions: Question[];
}

interface AnalysisData {
    testSeriesId: string;
    attemptId: string;
    sections: SectionData[];
    score: number;
}

export function TestAnalysisPage() {
    const { testId, attemptId } = useParams();
    const navigate = useNavigate();
    const routerAttemptId = attemptId; // Rename to avoid confusion
    const userId = localStorage.getItem("phone") || "";

    const location = useLocation();
    const testGroupId = location.state?.testGroupId;
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    useEffect(() => {
        if (userId && routerAttemptId) {
            compareAnswers(userId, routerAttemptId)
                .then((res) => {
                    if (res.status && res.data) {
                        setData(res.data);
                    } else {
                        toast.error("Failed to load analysis");
                        navigate(-1);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error loading analysis");
                })
                .finally(() => setLoading(false));
        }
    }, [userId, routerAttemptId, navigate]);

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentSection = data.sections[currentSectionIndex];
    const currentQuestion = currentSection.questions[currentQuestionIndex];

    const handlePrev = () => {
        if (!data) return;
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (currentSectionIndex > 0) {
            const prevSectionIdx = currentSectionIndex - 1;
            const prevSection = data.sections[prevSectionIdx];
            setCurrentSectionIndex(prevSectionIdx);
            setCurrentQuestionIndex((prevSection.questions.length || 1) - 1);
        }
    };

    const handleNext = () => {
        if (!data) return;
        const currentSection = data.sections[currentSectionIndex];
        const isLastQuestionInSection = currentQuestionIndex >= (currentSection.questions.length || 0) - 1;

        if (!isLastQuestionInSection) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (currentSectionIndex < (data.sections.length || 0) - 1) {
            setCurrentSectionIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
                <button onClick={() => navigate(-1)} className="p-2">
                    <ArrowLeft size={20} />
                </button>
                <span className="font-semibold text-lg max-w-[200px] truncate">Analysis</span>
                <button onClick={() => setShowMobileSidebar(true)} className="p-2">
                    <Menu size={20} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 pb-[80px] md:pb-0 md:mr-[350px] p-4 md:p-6 overflow-y-auto h-screen">
                <div className="max-w-4xl mx-auto">
                    {/* Desktop Back Button */}
                    <button
                        onClick={() => navigate(`/test-info/${testId}`, { state: { testGroupId } })}
                        className="hidden md:flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Info</span>
                    </button>

                    {currentQuestion ? (
                        <div className="space-y-6">
                            {/* Question Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-medium text-gray-500">
                                        Question {currentQuestionIndex + 1}
                                    </span>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${currentQuestion.isCorrect
                                        ? 'bg-green-100 text-green-700'
                                        : currentQuestion.userAnswerIds.length === 0
                                            ? 'bg-gray-100 text-gray-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {currentQuestion.isCorrect
                                            ? <><CheckCircle2 size={16} /> Correct</>
                                            : currentQuestion.userAnswerIds.length === 0
                                                ? <><MinusCircle size={16} /> Unattempted</>
                                                : <><XCircle size={16} /> Incorrect</>
                                        }
                                    </div>
                                </div>

                                <p className="text-lg text-[#242645] font-medium mb-4 whitespace-pre-wrap">
                                    <MathText>{currentQuestion.questionText}</MathText>
                                </p>

                                {/* Question Images */}
                                {currentQuestion.questionImageUrls && currentQuestion.questionImageUrls.length > 0 && (
                                    <div className="flex flex-col md:flex-row justify-start gap-3 mb-6">
                                        {currentQuestion.questionImageUrls.map((url, index) => (
                                            <div key={index} className="border border-[#D8D8D8] rounded-[16px] overflow-hidden bg-gray-50 p-2 max-w-fit">
                                                <img loading="lazy" decoding="async"
                                                    src={url}
                                                    alt={`Question image ${index + 1}`}
                                                    className="max-w-full h-auto max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((opt) => (
                                        <div
                                            key={opt.optionId}
                                            className={`p-4 rounded-xl border flex items-start gap-3 ${opt.isCorrect
                                                ? 'bg-green-50 border-green-200'
                                                : opt.isSelectedByUser
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${opt.isCorrect
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : opt.isSelectedByUser
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'border-gray-300'
                                                }`}>
                                                {(opt.isCorrect || opt.isSelectedByUser) && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        {opt.isCorrect ? <polyline points="20 6 9 17 4 12" /> : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-base text-[#242645]"><MathText>{opt.value}</MathText></div>
                                                {opt.imageUrl && (
                                                    <img loading="lazy" decoding="async" src={opt.imageUrl} alt="Option" className="mt-2 max-h-40 object-contain rounded-lg" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Solution Card */}
                            {(currentQuestion.solution || currentQuestion.solutionImageUrl) && (
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Solution</h3>
                                    {currentQuestion.solution && (
                                        <p className="text-gray-700 whitespace-pre-wrap mb-4">
                                            <MathText>{currentQuestion.solution}</MathText>
                                        </p>
                                    )}
                                    {currentQuestion.solutionImageUrl && (
                                        <img loading="lazy" decoding="async"
                                            src={currentQuestion.solutionImageUrl}
                                            alt="Solution"
                                            className="max-h-60 object-contain rounded-xl border border-gray-200"
                                        />
                                    )}
                                </div>
                            )}
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
                                    className="px-6 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!data || (currentQuestionIndex >= (currentSection.questions.length || 0) - 1 && currentSectionIndex >= (data.sections.length || 0) - 1)}
                                    className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No questions in this section.
                        </div>
                    )}
                </div>

                {/* Mobile Navigation Footer */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between gap-4 z-50 safe-area-bottom">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-medium disabled:opacity-50 text-gray-700 active:bg-gray-200 cursor-pointer"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentQuestionIndex >= (currentSection.questions.length || 0) - 1 && currentSectionIndex >= (data.sections.length || 0) - 1}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 shadow-sm cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Sidebar (Desktop & Mobile) */}
            <div className={`fixed inset-y-0 right-0 w-[350px] bg-white border-l border-gray-200 transform transition-transform duration-300 z-[60] ${showMobileSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                }`}>
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Question Palette</h2>
                        <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-2">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>Correct</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>Incorrect</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                <span>Unattempted</span>
                            </div>
                        </div>

                        {data.sections.map((section, sIdx) => (
                            <div key={sIdx}>
                                <h3 className="font-medium text-gray-900 mb-3 bg-gray-50 p-2 rounded-lg">
                                    {section.sectionName}
                                </h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {section.questions.map((q, qIdx) => {
                                        let bgColor = "bg-gray-100 text-gray-600 border-gray-200"; // Unattempted
                                        if (q.userAnswerIds.length > 0) {
                                            if (q.isCorrect) bgColor = "bg-green-500 text-white border-green-500"; // Correct
                                            else bgColor = "bg-red-500 text-white border-red-500"; // Incorrect
                                        }

                                        const isCurrent = sIdx === currentSectionIndex && qIdx === currentQuestionIndex;

                                        return (
                                            <button
                                                key={q.questionId}
                                                onClick={() => {
                                                    setCurrentSectionIndex(sIdx);
                                                    setCurrentQuestionIndex(qIdx);
                                                    setShowMobileSidebar(false);
                                                }}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium border transition-all cursor-pointer ${bgColor} ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                                    }`}
                                            >
                                                {qIdx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {showMobileSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}
        </div>
    );
}
