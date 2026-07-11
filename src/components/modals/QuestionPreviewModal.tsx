import { X } from "lucide-react";
import { MathText } from "@/components/common/MathText";

interface Option {
    optionId: string;
    value: string;
    imageUrl: string | null;
}

interface QuestionPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    question: {
        questionId: string;
        questionText: string;
        questionImageUrls?: string[];
        options: Option[] | null;
        correctAnswerIds: string[];
        solution?: string;
        solutionImageUrl?: string | null;
        isMultipleAnswer?: boolean;
        multipleAnswer?: boolean;
    } | null;
    sectionName?: string;
}

export function QuestionPreviewModal({ isOpen, onClose, question, sectionName }: QuestionPreviewProps) {
    if (!isOpen || !question) return null;

    const isMulti = question.isMultipleAnswer || question.multipleAnswer || false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-lg font-semibold text-[#242645]">Question Preview</h2>
                        {sectionName && (
                            <span className="text-sm text-gray-500 capitalize">Section: {sectionName}</span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Question Card */}
                    <div className="bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-gray-500">
                                {isMulti ? "Multiple Select" : "Single Select"}
                            </span>
                        </div>

                        <p className="text-lg text-[#242645] font-medium mb-4 whitespace-pre-wrap">
                            <MathText>{question.questionText}</MathText>
                        </p>

                        {/* Question Images */}
                        {question.questionImageUrls && question.questionImageUrls.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {question.questionImageUrls.map((url, index) => (
                                    <img loading="lazy" decoding="async"
                                        key={index}
                                        src={url}
                                        alt={`Question ${index + 1}`}
                                        className="max-h-48 object-contain rounded-lg border border-gray-200"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3">
                            {question.options?.map((opt) => {
                                const isCorrect = question.correctAnswerIds.includes(opt.optionId);
                                return (
                                    <div
                                        key={opt.optionId}
                                        className={`p-4 rounded-xl border flex items-start gap-3 ${isCorrect
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-medium text-sm ${isCorrect
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 text-gray-600'
                                            }`}>
                                            {isCorrect ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                opt.optionId
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-base text-[#242645]">
                                                <MathText>{opt.value}</MathText>
                                            </div>
                                            {opt.imageUrl && (
                                                <img loading="lazy" decoding="async"
                                                    src={opt.imageUrl}
                                                    alt="Option"
                                                    className="mt-2 max-h-40 object-contain rounded-lg"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Solution Card */}
                    {(question.solution || question.solutionImageUrl) && (
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3">Solution</h3>
                            {question.solution && (
                                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                                    <MathText>{question.solution}</MathText>
                                </p>
                            )}
                            {question.solutionImageUrl && (
                                <img loading="lazy" decoding="async"
                                    src={question.solutionImageUrl}
                                    alt="Solution"
                                    className="max-h-60 object-contain rounded-xl border border-gray-200"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-[#13097D] text-white rounded-xl font-medium hover:bg-[#0e0668] transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
