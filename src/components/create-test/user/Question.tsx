import { MathText } from "@/components/common/MathText";

interface Question {
    sectionName: string
    questionId: string,
    questionText: string,
    questionImageUrls?: string[],
    section?: string,
    questionNumber?: string
}


export function Question({ questionId: _questionId, questionText, questionImageUrls, sectionName, questionNumber }: Question
) {
    return (
        <div className="max-w-[994px] flex flex-col gap-1 md:gap-4 p-5">
            <h1
                className="text-(--text-app-primary) font-semibold text-sm md:text-lg"
            >{sectionName} - Question {questionNumber} </h1>

            <p
                className="font-medium text-(--text-muted) text-sm md:text-lg"
            ><MathText>{questionText}</MathText></p>
            <div className="flex flex-col md:flex-row justify-start gap-3 mt-2">
                {questionImageUrls?.map((image, index) => (
                    <div key={index} className="border border-[#D8D8D8] rounded-[16px] overflow-hidden bg-gray-50 p-2">
                        <img loading="lazy" decoding="async"
                            src={image}
                            alt={`Question image ${index + 1}`}
                            className="max-w-full h-auto max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                        />
                    </div>
                ))}
            </div>

        </div>
    );
}