import { Textarea } from "@/components/ui/textarea";
import { MathText } from "@/components/common/MathText";

interface Option {
    multipleAnswer: boolean,
    subjective: boolean,
    option?: option[],
    selectedAnswers?: string[],
    onAnswerChange?: (answers: string[]) => void
}

interface option {
    optionId: string,
    value: string,
    imageUrl?: string | null
}
export function Option({ multipleAnswer, subjective, option, selectedAnswers = [], onAnswerChange }: Option) {

    const handleOptionChange = (optionId: string) => {
        if (!onAnswerChange) return;

        if (multipleAnswer) {
            const newAnswers = selectedAnswers.includes(optionId)
                ? selectedAnswers.filter(id => id !== optionId)
                : [...selectedAnswers, optionId];
            onAnswerChange(newAnswers);
        } else {
            onAnswerChange([optionId]);
        }
    };

    return (
        <div className="flex flex-col gap-3 md:gap-4">
            {subjective ? (
                <div className="w-full">
                    <Textarea placeholder="Write your answer here..." className="min-h-[150px] md:min-h-[200px]" />
                </div>
            ) : (
                option?.map((opt) => {
                    const isSelected = selectedAnswers.includes(opt.optionId);
                    return (
                        <div
                            key={opt.optionId}
                            className={`p-3 md:p-4 rounded-xl transition-all cursor-pointer ${isSelected
                                ? 'border-2 border-(--btn-primary) bg-[#FFF5ED]'
                                : 'border border-[#D6D6D6] bg-transparent hover:border-[#13097D]'
                                }`}
                            onClick={() => handleOptionChange(opt.optionId)}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type={multipleAnswer ? "checkbox" : "radio"}
                                    name={multipleAnswer ? `multi-${opt.optionId}` : "answer-option"}
                                    checked={isSelected}
                                    readOnly
                                    style={{
                                        width: '33.33px',
                                        height: '33.33px',
                                        minWidth: '33.33px',
                                        borderRadius: multipleAnswer ? '4px' : '50%',
                                        border: '2px solid #6B7280',
                                        accentColor: 'var(--btn-primary)',
                                        pointerEvents: 'none'
                                    }}
                                    className="cursor-pointer shrink-0"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm md:text-[1.125rem] font-normal text-(--text-muted) shrink-0">
                                            {opt.optionId}.
                                        </span>
                                        <p className="text-sm md:text-[1.125rem] font-medium text-(--text-app-primary)">
                                            <MathText>{opt.value}</MathText>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {opt.imageUrl && (
                                <div className="mt-3">
                                    <div className="border border-[#D8D8D8] rounded-[16px] overflow-hidden bg-gray-50 p-2 inline-block">
                                        <img loading="lazy" decoding="async"
                                            src={opt.imageUrl}
                                            alt={`Option ${opt.optionId}`}
                                            className="max-w-full h-auto max-h-[250px] md:max-h-[300px] object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}