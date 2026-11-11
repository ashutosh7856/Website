import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { searchQuestionsList } from '@/api/community';
import WriteAnswerModal from './WriteAnswerModal';
import type { AnswerModalDetails } from './WriteAnswerModal';

interface SearchQuestionItem {
  questionId: string;
  subject: string;
  question: string;
  userIdQuestionAsked: string;
  userFullName: string;
  userPhotoUrl: string | null;
  timestamp: {
    seconds: number;
    nanos: number;
  };
  anonymous: boolean;
  myQuestion: boolean;
}

export default function QuestionFilterBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchQuestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AnswerModalDetails | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const { userId, toggleLogin } = useAuthStore();
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 3 && userId && token) {
        setIsSearching(true);
        setShowDropdown(true);
        try {

          const response = await searchQuestionsList(userId, searchTerm, token);
          
          if (response.status === 'Success') {
            // The search endpoint returns `subject` too, which CommunityQuestion doesn't declare.
            setSearchResults(response.data as unknown as SearchQuestionItem[]);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Search failed", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else if (searchTerm.trim().length < 3) {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, userId, token]);

  const handleQuestionClick = (item: SearchQuestionItem) => {
    if (!userId) {
      toggleLogin();
      return;
    }

    const modalDetails: AnswerModalDetails = {
      questionId: item.questionId,
      questionText: item.question,
      userFullName: item.userFullName,
      userPhotoUrl: item.userPhotoUrl,
      askerInterestedCourse: 'Student',
      questionTimestamp: item.timestamp,
      anonymous: item.anonymous,
    };

    setSelectedQuestion(modalDetails);
    setIsModalOpen(true);
    setShowDropdown(false);
  };

  return (
    <>
      <div 
        ref={searchContainerRef}
        className="w-full max-w-[900px] bg-white rounded-lg p-4 md:p-5 border border-gray-100 shadow-sm relative z-20"
      >
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 flex items-center gap-3 md:gap-4 relative">
            <Search size={24} className="text-[#13097D]" />
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions"
              className="w-full h-[42px] md:h-[46px] bg-[#F5F5F7] rounded-md px-3 py-2 md:py-3
                        text-sm text-[#13097D] font-medium
                        placeholder:text-[#2F43F2] placeholder:opacity-70 placeholder:font-normal
                        focus:outline-none focus:ring-2 focus:ring-[#13097D]"
            />

            {searchTerm && (
               <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 text-gray-400 cursor-pointer hover:text-gray-600"
               >
                  <X size={18} />
               </button>
            )}

            {showDropdown && searchTerm.length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-[400px] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul>
                    {searchResults.map((item) => (
                      <li 
                        key={item.questionId}
                        onClick={() => handleQuestionClick(item)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                      >
                        <p className="text-sm font-medium text-[#242645] line-clamp-2">
                          {item.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.subject || 'General'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No questions found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <WriteAnswerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        questionDetails={selectedQuestion}
      />
    </>
  );
}