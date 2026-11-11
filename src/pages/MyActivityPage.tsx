import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/AuthStore';
import {
  getMyQuestions,
  getMyBookmarkedQuestions,
  getMyAnswers,
  searchMyQuestions,
  searchMyAnswers,
  searchMyBookmarkedQuestions
} from '@/api/community';
import { Loader2, Search, X } from 'lucide-react';
import MyActivityQuestionCard from '@/components/community/MyActivityQuestionCard';
import MyActivityAnswerCard from '@/components/community/MyActivityAnswerCard';
import CategorySidebar from '@/components/community/CategorySidebar';
// import RightSideAds from '@/components/community/RightSideAds';
// import CommunityBreadcrumbs from "@/components/community/CommunityBreadcrumbs";

import type {
  CommunityDashboardItem,
  MyAnswerItem
} from '@/types/community';

type TabType = 'My Questions' | 'My Answers' | 'Bookmarked Questions';

/** Fields shown for a search hit; results may be questions, answers or bookmarks. */
interface SearchResultItem {
  questionId?: string;
  myAnswerId?: string;
  question?: string;
  subject?: string;
}

export default function MyActivityPage() {
  const { userId } = useAuthStore();
  const token = localStorage.getItem("jwt");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('My Questions');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [myQuestions, setMyQuestions] = useState<CommunityDashboardItem[]>([]);
  const [myAnswers, setMyAnswers] = useState<MyAnswerItem[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<CommunityDashboardItem[]>([]);

  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const nextPageTokenRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

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
      if (searchQuery.trim().length >= 3 && userId && token) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          let response;
          
          if (activeTab === 'My Questions') {
            response = await searchMyQuestions(userId, searchQuery, token);
          } else if (activeTab === 'My Answers') {
            response = await searchMyAnswers(userId, searchQuery, token);
          } else if (activeTab === 'Bookmarked Questions') {
            response = await searchMyBookmarkedQuestions(userId, searchQuery, token);
          }

          if (response && response.status === 'Success') {
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
      } else if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userId, token, activeTab]);

  const handleSearchResultClick = (item: SearchResultItem) => {
    if (item.questionId) {
      navigate(`/community/question/${item.questionId}`,{state: { from: 'my-activity' }});
      setShowDropdown(false);
    }
  };

  const fetchQuestions = useCallback(
    async (isNextPage = false) => {
      if (!userId || !token) return;

      try {
        if (!isNextPage) {
          setIsLoading(true);
          setError(null);
        } else {
          if (!nextPageTokenRef.current) return;
          setIsFetchingMore(true);
        }

        const tokenToPass = isNextPage ? nextPageTokenRef.current : null;
        
        const response = await getMyQuestions(
          userId,
          token,
          tokenToPass
        );

        if (response.status === "Success") {
          if (isNextPage) {
            setMyQuestions(prev => [...prev, ...response.data]);
          } else {
            setMyQuestions(response.data);
          }

          const newToken = response.nextPageToken || null;
          setNextPageToken(newToken);
          nextPageTokenRef.current = newToken;
        }

      } catch (err) {
        console.error('Fetch questions error:', err);
        setError("Failed to load questions");
      }

      setIsLoading(false);
      setIsFetchingMore(false);
    },
    [userId, token]
  );

  const fetchOtherTabs = useCallback(async () => {
    if (!userId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "My Answers") {
        const res = await getMyAnswers(userId, token);
        if (res.status === "Success") setMyAnswers(res.data);
      }

      if (activeTab === "Bookmarked Questions") {
        const res = await getMyBookmarkedQuestions(userId, token);
        if (res.status === "Success") {
          // The bookmarks endpoint is typed as CommunityQuestion[] but returns dashboard items.
          setBookmarkedQuestions(res.data as unknown as CommunityDashboardItem[]);
        }
      }
    } catch {
      setError("Failed to load data");
    }

    setIsLoading(false);
  }, [activeTab, userId, token]);

  useEffect(() => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "My Questions") {
      setMyQuestions([]);
      setNextPageToken(null);
      nextPageTokenRef.current = null;
      fetchQuestions(false);
    } else {
      fetchOtherTabs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on tab switch; fetchers change with userId/token too
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "My Questions") return;
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          if (nextPageTokenRef.current) {
            fetchQuestions(true);
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [activeTab, fetchQuestions]);

  const filterData = <T,>(data: T[]): T[] => {
    return data.filter((item) => {
      if (!selectedCategory) return true;
      
      const subject = (item as { subject?: string }).subject || '';
      const mainCategories = ['Colleges', 'Courses', 'Exams'];

      if (selectedCategory === 'Other') {
        return !mainCategories.includes(subject);
      }
      
      return subject === selectedCategory;
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full bg-white rounded-lg p-20 text-center border border-gray-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#13097D]" />
          Loading...
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full bg-white rounded-lg p-20 text-center text-red-500 border border-gray-200 shadow-sm">
          {error}
        </div>
      );
    }

    if (activeTab === "My Questions") {
      const filteredQuestions = filterData(myQuestions);

      return (
        <>
          <div className="w-full bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm">
            <div className="flex flex-col space-y-4 md:space-y-5">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map(q => (
                  <MyActivityQuestionCard 
                    key={q.questionId} 
                    question={q} 
                    onQuestionUpdated={() => fetchQuestions(false)}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  {selectedCategory ? `No questions found in "${selectedCategory}"` : "You haven't asked any questions yet."}
                </div>
              )}
            </div>
          </div>

          <div ref={bottomRef} className="h-16 flex justify-center items-center mt-4">
            {isFetchingMore && (
              <Loader2 className="w-5 h-5 animate-spin text-[#13097D]" />
            )}
            {!nextPageToken && myQuestions.length > 0 && (
              <p className="text-sm text-gray-400">You have reached the end</p>
            )}
          </div>
        </>
      );
    }

    if (activeTab === "My Answers") {
      const filteredAnswers = filterData(myAnswers);

      return (
        <div className="w-full bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col space-y-4 md:space-y-5">
             {filteredAnswers.length > 0 ? (
                filteredAnswers.map(answerItem => (
                  <MyActivityAnswerCard
                    key={answerItem.myAnswerId}
                    answerItem={answerItem}
                    onAnswerUpdated={fetchOtherTabs}
                  />
                ))
             ) : (
                <div className="text-center py-10 text-gray-500">
                   {selectedCategory ? `No answers found in "${selectedCategory}"` : "You haven't answered any questions yet."}
                </div>
             )}
          </div>
        </div>
      );
    }

    if (activeTab === "Bookmarked Questions") {
      const filteredBookmarks = filterData(bookmarkedQuestions);

      return (
        <div className="w-full bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col space-y-4 md:space-y-5">
             {filteredBookmarks.length > 0 ? (
               filteredBookmarks.map((q) => (
                 <MyActivityQuestionCard 
                   key={q.questionId} 
                   question={q}
                   onQuestionUpdated={fetchOtherTabs} 
                   isBookmarkView={true}
                 />
               ))
             ) : (
               <div className="text-center py-10 text-gray-500">
                 {selectedCategory ? `No bookmarks found in "${selectedCategory}"` : "No bookmarked questions found."}
               </div>
             )}
          </div>
        </div>
      );
    }
  };

  const Separator = () => (
    <div className="md:w-px md:h-[31px] md:bg-[#13097D33]" />
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-[1440px] mx-auto flex justify-center gap-3">
        
        <div className="hidden lg:block w-[191px] shrink-0">
          <CategorySidebar 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className="flex flex-col w-full md:w-[860px] shrink-0">
          {/* 
          <CommunityBreadcrumbs 
            paths={[
              { name: "Community Dashboard", link: "/community" },
              { name: "My Activity" }
            ]} 
            showMobileBack={true} 
          />
          */}
          
          <div className="w-full bg-white rounded-lg mb-4 p-4 md:p-5 shadow-sm border border-gray-200 flex flex-col gap-4 md:gap-5 z-20 relative">
            
            <div className="relative" ref={searchContainerRef}>
              <div className="flex items-center gap-3 bg-[#F5F5F7] rounded-md px-3 border border-transparent focus-within:ring-2 focus-within:ring-[#13097D] focus-within:border-transparent">
                <Search size={24} className="text-[#343C6A] shrink-0" />
                <input
                  type="text"
                  placeholder="Search questions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent p-2.5 md:p-3 text-[11px] md:text-sm placeholder-[#2F43F2] focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                     <X size={18} />
                  </button>
                )}
              </div>

              {showDropdown && searchQuery.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-[400px] overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center text-gray-500 gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span className="text-sm">Searching in {activeTab}...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map((item) => (
                        <li 
                          key={item.questionId || item.myAnswerId}
                          onClick={() => handleSearchResultClick(item)}
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
                      No results found in {activeTab} for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pt-1">
              <div className="w-full grid grid-cols-3 gap-2 md:flex md:w-auto md:gap-[60px] items-center">
                {['My Questions', 'My Answers', 'Bookmarked Questions'].map((tab, index, arr) => (
                  <div key={tab} className="flex items-center">
                    <button
                      onClick={() => setActiveTab(tab as TabType)}
                      className={`pb-0.5 text-[12px] md:text-sm font-semibold cursor-pointer transition-all ${
                        activeTab === tab
                          ? "text-[#2F43F2] border-b-2 border-[#2F43F2]"
                          : "text-[#6B7280] hover:text-indigo-900 border-b-2 border-transparent"
                      }`}
                    >
                      {tab}
                    </button>
                    
                    {index < arr.length - 1 && (
                      <div className="ml-[60px]">
                        <Separator />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[860px] shrink-0">
            {renderContent()}
          </div>
          
        </div>

        <div className="hidden xl:block w-[250px] shrink-0">
          {/* <RightSideAds /> */}
        </div>
        
      </div>
    </div>
  );
}