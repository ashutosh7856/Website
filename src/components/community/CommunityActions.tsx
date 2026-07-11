import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X } from "lucide-react";
import AskQuestionModal from "@/components/community/AskQuestionModal";
import { useAuthStore } from "@/store/AuthStore";
import { searchCommunityQuestions } from "@/api/community";
import type { CommunityDashboardItem } from "@/types/community";

export default function CommunityActions() {
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CommunityDashboardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { user, toggleLogin, userId } = useAuthStore();
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 3) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const response = await searchCommunityQuestions(searchTerm, {
            sortBy: 'rating',
            sortOrder: 'desc',
            page: 0,
            pageSize: 10,
          });
          if (response.status === 'Success') {
            setSearchResults(response.data);
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

  const handleQuestionClick = (questionId: string) => {
    navigate(`/community/question/${questionId}`);
    setShowDropdown(false);
  };

  const handleAskClick = () => {
    if (!user) {
      toggleLogin();
      return;
    }
    setIsAskModalOpen(true);
  };

  const handleAnswerClick = () => {
    if (!user) {
      toggleLogin();
      return;
    }
    navigate('/community/answer');
  };

  const handleActivityClick = () => {
    if (!user) {
      toggleLogin();
      return;
    }
    navigate('/community/my-activity');
  };

  const ActionButton: React.FC<{
    iconSrc: string; 
    label: string;
    onClick: () => void;
    count?: number;
  }> = ({ iconSrc, label, onClick, count }) => {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 font-semibold text-[#2F43F2] cursor-pointer transition-colors duration-200 justify-center md:justify-start"
      >
        <img loading="lazy" decoding="async" src={iconSrc} alt={label} className="w-5 h-5" />
        <span className="text-[12px] md:text-sm leading-4.5">{label}</span>
        {count && (
          <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
            {count}
          </span>
        )}
      </button>
    );
  };

  const Separator = () => (
    <div className="hidden md:block w-px h-7.75 bg-[#13097D33]" />
  );

  return (
    <>
      <div className="max-w-225 w-full mx-auto bg-white rounded-lg p-4 md:p-5 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center gap-3">
              <Search size={24} className="text-[#343C6A] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full bg-[#F5F5F7] rounded-md p-3 text-[12px] md:text-sm placeholder-[#2F43F2] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#13097D] focus:border-transparent"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 cursor-pointer hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            {showDropdown && searchTerm.length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-100 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul>
                    {searchResults.slice(0,5).map((item) => (
                      <li 
                        key={item.questionId}
                        onClick={() => handleQuestionClick(item.questionId)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                      >
                        <p className="text-sm font-medium text-[#242645] line-clamp-2">
                          {item.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.subject || 'General'}
                          </span>
                          <span className="text-xs text-gray-400">
                            • {item.answerCount} answers
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No results found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-center md:gap-10 pl-1">
            <div className="w-full grid grid-cols-3 gap-2 md:flex md:w-auto md:gap-15 items-center">
              <ActionButton
                iconSrc="/ask.svg"
                label="Ask"
                onClick={handleAskClick}
              />
              <Separator />
              <ActionButton
                iconSrc="/answer.svg"
                label="Answer"
                onClick={handleAnswerClick}
              />
              <Separator />
              <ActionButton
                iconSrc="/my-activity.svg"
                label="My Activity"
                onClick={handleActivityClick}
              />
            </div>
          </div>
        </div>
      </div>

      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
    </>
  );
}