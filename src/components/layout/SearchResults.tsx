import { useNavigate } from "react-router-dom";
import { useSearchStore } from "@/store/SearchStore";
import type { SearchResult } from "@/store/SearchStore";
import { BookOpen, ClipboardList, Loader2, Users } from "lucide-react";
import { encodeCounselorId } from "@/lib/utils";

interface SearchResultsProps {
  onResultClick?: () => void;
}

const typeIcons = {
  course: BookOpen,
  test: ClipboardList,
  counsellor: Users,
};

const typeColors = {
  course: "text-purple-600 bg-purple-50",
  test: "text-indigo-600 bg-indigo-50",
  counsellor: "text-orange-600 bg-orange-50",
};

export function SearchResults({ onResultClick }: SearchResultsProps) {
  const { results, isSearching, query } = useSearchStore();
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    switch(result.type) {
      case 'counsellor': {
        navigate(`/counsellor/${encodeCounselorId(result.id)}`);
        break;
      }
      case 'course': {
        navigate(`/courses/detail/${result.id}/user`);
        break;
      }
      case 'test': {
        navigate(`/courses/test-group/${result.id}`);
        break;
      }
      default: {
        const baseRoute = result.type === 'counsellor' ? '/counselors' : `/${result.type}s`;
        navigate(baseRoute);
        break;
      }
    }
    onResultClick?.();
  };

  if (!query) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
        </div>
        <p className="text-sm">Start typing to search for courses, tests, or counsellors...</p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF660F]" />
        <p className="text-sm text-gray-500">Searching...</p>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
        </div>
        <p className="text-sm">No results found for "{query}"</p>
        <p className="text-xs text-gray-400 mt-1">Try different keywords or check the spelling</p>
      </div>
    );
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="max-h-96 overflow-y-auto">
      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} className="p-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
            {type}s ({typeResults.length})
          </h3>
          <div className="space-y-1">
            {typeResults.map((result) => {
              const IconComponent = typeIcons[result.type as keyof typeof typeIcons];
              const colorClass = typeColors[result.type as keyof typeof typeColors];
              
              return (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full hover:cursor-pointer text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {result.imageUrl ? (
                      <img loading="lazy" decoding="async"
                        src={result.imageUrl}
                        alt={result.name}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} ${result.imageUrl ? 'hidden' : ''}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-[#FF660F] transition-colors truncate">
                        {result.name}
                      </p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
