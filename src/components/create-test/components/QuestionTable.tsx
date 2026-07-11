interface QuestionTableProps {
  data: any[];
  onView?: (questionId: string) => void;
  onEdit?: (questionId: string, sectionName: string) => void;
  onDelete?: (questionId: string, sectionName: string) => void;
}

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MathText } from "@/components/common/MathText";

export function QuestionTable({ data, onView, onEdit, onDelete }: QuestionTableProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const INITIAL_COUNT = 10;
  const INCREMENT_COUNT = 5;

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + INCREMENT_COUNT, data.length));
  };

  const handleShowLess = () => {
    setDisplayCount(INITIAL_COUNT);
  };

  const displayedData = data.slice(0, displayCount);

  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        {/* HEADER */}
        <thead>
          <tr className="bg-(--btn-primary)/10">
            <th className="px-4 py-3 text-left font-medium text-sm text-(--btn-primary) w-[50%]">
              Question
            </th>
            <th className="px-4 py-3 text-left font-medium text-sm text-(--btn-primary) w-[15%]">
              Type
            </th>
            <th className="px-4 py-3 text-left font-medium text-sm text-(--btn-primary) w-[15%]">
              Category
            </th>
            <th className="px-4 py-3 text-left font-medium text-sm text-(--btn-primary) w-[20%]">
              Actions
            </th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-(--text-muted)">
                No questions added yet. Create your first question above.
              </td>
            </tr>
          ) : (
            displayedData.map((q: any) => (
              <tr
                key={q.questionId}
                className="border-b border-[#E8EAED] hover:bg-gray-50"
              >
                {/* Question */}
                <td className="px-3 py-3 text-sm font-medium text-(--text-app-primary)">
                  <MathText>{q.questionText}</MathText>
                </td>

                {/* Type */}
                <td className="px-3 py-3 text-sm font-medium text-(--text-app-primary)">
                  {q.type}
                </td>

                {/* Category */}
                <td className="px-3 py-3 text-sm font-medium text-(--text-app-primary) capitalize">
                  {q.sectionName}
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onView?.(q.questionId)}
                      className="hover:opacity-80 cursor-pointer"
                    >
                      <img loading="lazy" decoding="async" src="/eye.svg" alt="View" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit?.(q.questionId, q.sectionName)}
                      className="hover:opacity-80 cursor-pointer"
                    >
                      <img loading="lazy" decoding="async" src="/pencil.svg" alt="Edit" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(q.questionId, q.sectionName)}
                      className="hover:opacity-80 cursor-pointer"
                    >
                      <img loading="lazy" decoding="async" src="/delete.svg" alt="Delete" className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {data.length > INITIAL_COUNT && (
        <div className="flex justify-center items-center gap-4 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {Math.min(displayCount, data.length)} of {data.length} questions
          </p>

          <div className="flex gap-2">
            {displayCount < data.length && (
              <button
                onClick={handleShowMore}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                See More <ChevronDown size={16} />
              </button>
            )}

            {displayCount > INITIAL_COUNT && (
              <button
                onClick={handleShowLess}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Show Less <ChevronUp size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
