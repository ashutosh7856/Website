import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User2,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Square,
  Menu,
  Loader2,
} from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { Button } from "../ui";
import toast from "react-hot-toast";
import ChatInput, { type ChatInputRef } from "./components/ChatInput";
import { encodeCounselorId } from "@/lib/utils";
import Sidear from "./components/Sidear";
import ChatMessage from "./components/ChatMessage";
import { ChatbotCounselorCard } from "./components/ChatbotCounselorCard";
import { useChatStore } from "@/store/ChatStore";
import { useAuthStore } from "@/store/AuthStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SuggestionChips = ({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
}) => (
  <div className="flex flex-wrap gap-2.5 mt-4 animate-in fade-in slide-in-from-bottom-3 duration-700 pl-1 md:pl-4">
    {suggestions.map((text, idx) => (
      <button
        key={idx}
        onClick={() => onSelect(text)}
        className="relative px-4 py-2 text-xs md:text-sm font-semibold tracking-wide text-[#FF660F] bg-[#FF660F]/5 border border-[#FF660F]/30 rounded-xl hover:bg-[#FF660F]/10 hover:border-[#FF660F] hover:text-white hover:shadow-[0_0_15px_rgba(255,102,15,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
      >
        {text}
      </button>
    ))}
  </div>
);

// Small reusable UI pieces
const TypingIndicator = () => (
  <div className="flex items-end gap-2.5">
    <div className="rounded-2xl px-4 py-3 bg-[#2a2a2a] shadow-sm">
      <div className="flex items-center justify-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></span>
      </div>
    </div>
  </div>
);

const WelcomeMessage = () => (
  <div className="text-center p-8">
    <div className="inline-block p-3 bg-[#2a2a2a] rounded-full">
      <Sparkles className="h-8 w-8 text-[#FA660F]" />
    </div>
    <h2 className="mt-4 text-2xl font-semibold text-white font-sans">
      ProCounsel GPT
    </h2>
    <p className="mt-2 text-gray-400 font-sans">
      Your personal guide to colleges and exams in India.
      <br />
      How can I help you today?
    </p>
  </div>
);

export default function Chatbot() {
  const navigate = useNavigate();
  const {
    messages,
    toggleChatbot,
    isChatbotOpen,
    sendMessage,
    loading,
    clearMessages,
    stopGenerating,
    startNewChat,
    chatSessions,
    loadChatSessions,
    loadChatHistoryBySessionId,
    currentSessionId,
    incrementVisitorMessageCount,
    resetVisitorMessageCount,
    isLoginOpenFromChatbot,
    setLoginOpenFromChatbot,
    isLoadingHistory,
  } = useChatStore();
  const {
    user,
    toggleLogin,
    isAuthenticated,
    logout,
    userId,
    role,
    isLoginToggle,
  } = useAuthStore();

  // UI state
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleCounselorsPerMessage, setVisibleCounselorsPerMessage] =
    useState<Record<number, number>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputRef>(null);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const initializeSidebar = () => {
      const isMobile = window.innerWidth < 768;
      setIsSidebarOpen(!isMobile);
    };

    initializeSidebar();
    window.addEventListener("resize", initializeSidebar);
    return () => window.removeEventListener("resize", initializeSidebar);
  }, []);

  // Load chat sessions when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadChatSessions(userId);
      resetVisitorMessageCount();
      console.log(
        "✅ User authenticated - loaded chat sessions for userId:",
        userId
      );
    }
  }, [
    isAuthenticated,
    userId,
    isChatbotOpen,
    loadChatSessions,
    resetVisitorMessageCount,
  ]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input.trim();
    if (!messageToSend || loading) return;

    // Check if visitor has reached message limit
    if (!isAuthenticated) {
      const newCount = incrementVisitorMessageCount();
      if (newCount >= 3) {
        setShowLoginPrompt(true);
        return;
      }
    }

    setInput("");
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
    await sendMessage(messageToSend, userId, role, token);
    // Auto-focus input after sending message
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNewChat = () => {
    clearMessages();
    startNewChat();
  };

  const handleSelectChat = (sessionId: string) => {
    loadChatHistoryBySessionId(sessionId);
  };

  const handleDeleteChat = (sessionId: string) => {
    console.log("Delete session:", sessionId);
  };

  const handleLogout = () => {
    useChatStore.getState().resetChatState();
    logout();
    setIsDropdownOpen(false);
    toggleChatbot();
    navigate("/");
    toast.success("Logged out successfully!", { duration: 3000 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle login state changes to manage z-index
  useEffect(() => {
    if (isLoginToggle && isLoginOpenFromChatbot) {
      console.log("Login opened from chatbot");
    } else if (!isLoginToggle && isLoginOpenFromChatbot) {
      setLoginOpenFromChatbot(false);
    }
  }, [isLoginToggle, isLoginOpenFromChatbot, setLoginOpenFromChatbot]);

  const handleLoginFromChatbot = () => {
    setLoginOpenFromChatbot(true);
    toggleLogin();
  };

  const chatbotZIndex =
    isLoginToggle && isLoginOpenFromChatbot ? "z-[40]" : "z-[100]";

  return (
    <div
      className={`fixed inset-0 ${chatbotZIndex} flex flex-col bg-[#232323] font-sans`}
    >
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 max-w-sm border border-[#A0A0A099] shadow-2xl">
            <div className="text-center">
              <div className="inline-block p-4 bg-[#FF660F]/20 rounded-full mb-4">
                <User2 className="h-10 w-10 text-[#FF660F]" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">
                Login to Continue
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                You've reached the message limit for visitors. Please login to
                continue chatting and access your chat history.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    handleLoginFromChatbot();
                  }}
                  className="w-full bg-[#FF660F] text-white cursor-pointer font-semibold py-3 px-6 rounded-lg hover:bg-[#e55a0a] transition-colors"
                >
                  Login / Sign Up
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full text-gray-400 font-medium cursor-pointer py-2 px-6 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-14 md:h-20 bg-[#232323] border-b border-[#FFFFFF40] shadow-[0_2px_4px_0_rgba(255,255,255,0.06)] w-full">
        <div className="flex h-full items-center justify-between px-5 lg:px-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-white" />
            </button>

            <div
              className="Logo flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                toggleChatbot();
                navigate("/");
              }}
            >
              <SmartImage
                src="/logo.png"
                alt="procounsel_logo"
                className="h-7 w-7 md:w-11 md:h-12 rounded-md"
                width={44}
                height={44}
                priority
              />
              <div className="flex items-center leading-tight pl-[9px]">
                <h1 className="text-white font-semibold text-sm md:text-xl font-sans">
                  ProCounsel
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="btn relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
                    aria-label="Open user menu"
                  >
                    {user?.photoUrl && typeof user.photoUrl === "string" ? (
                      <img loading="lazy" decoding="async"
                        src={user.photoUrl}
                        alt="User profile"
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <User2 className="h-6 w-6 text-white" />
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#2a2a2a] rounded-lg shadow-xl z-50 py-1 border border-gray-700"
                    >
                      <button
                        onClick={() => {
                          navigate(role === "counselor" ? "/counsellor-dashboard" : "/dashboard-student");
                          setIsDropdownOpen(false);
                          toggleChatbot();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 cursor-pointer text-sm text-white hover:bg-gray-700"
                      >
                        <LayoutDashboard size={16} />
                        <span>{role === "counselor" ? "Dashboard" : "Profile"}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 cursor-pointer text-sm text-red-400 hover:bg-red-900/20"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  variant={"outline"}
                  className="w-full lg:w-[164px] flex items-center justify-center h-6 md:h-11 border rounded-[12px] bg-[#232323] font-semibold cursor-pointer text-white border-[#858585] text-[10px] md:text-lg hover:bg-[#FF660F] hover:text-white hover:border-[#FF660F] transition-all duration-200 font-sans"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLoginFromChatbot();
                  }}
                >
                  Login/Sign Up
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - slides from left on mobile */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-auto
            transform transition-transform duration-300 ease-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarOpen ? 'md:w-64' : 'md:w-0'}
          `}
        >
          <Sidear
            handleNewChat={handleNewChat}
            isSidebarOpen={isSidebarOpen}
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            handleSelectChat={handleSelectChat}
            handleDeleteChat={handleDeleteChat}
            setIsSidebarOpen={setIsSidebarOpen}
            isAuthenticated={isAuthenticated}
            onLoginClick={handleLoginFromChatbot}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col h-full items-center justify-center">
              <div className="w-full max-w-4xl mx-auto px-4">
                <div className="flex flex-col items-center justify-center gap-3 md:gap-5 mb-8 md:mb-12">
                  <h1 className="text-white font-semibold text-2xl md:text-[32px] text-center font-sans">
                    ProCounsel GPT
                  </h1>
                  <p className="flex flex-col text-white/50 text-base md:text-2xl font-medium text-center px-2 font-sans">
                    Your personal guide to college and exams in India.
                    <span className="mt-1">How can I help you today?</span>
                  </p>
                </div>

                <div className="mb-6 md:mb-8">
                  <ChatInput
                    ref={inputRef}
                    input={input}
                    setInput={setInput}
                    handleKeyPress={handleKeyPress}
                    handleSend={handleSend}
                    loading={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {/* Card 1: Course Guidance */}
                  <div
                    onClick={() => handleSend("Course Guidance")}
                    className="border border-[#7B7B7B] rounded-[12px] py-3 md:py-2.5 px-3 md:px-4 flex gap-3 md:gap-4 items-center cursor-pointer hover:bg-[#333333] hover:border-[#FF660F] transition-all duration-200"
                  >
                    <img loading="lazy" decoding="async"
                      src="/book.svg"
                      alt="Courses"
                      className="w-5 h-5 md:w-6 md:h-6 shrink-0"
                    />
                    <p className="text-[13px] md:text-[14px] font-medium text-white font-sans">
                      Course Guidance
                    </p>
                  </div>

                  {/* Card 2: College Guidance */}
                  <div
                    onClick={() => handleSend("College Guidance")}
                    className="border border-[#7B7B7B] rounded-[12px] py-3 md:py-2.5 px-3 md:px-4 flex gap-3 md:gap-4 items-center cursor-pointer hover:bg-[#333333] hover:border-[#FF660F] transition-all duration-200"
                  >
                    <img loading="lazy" decoding="async"
                      src="/cap.svg"
                      alt="Colleges"
                      className="w-5 h-5 md:w-6 md:h-6 shrink-0"
                    />
                    <p className="text-[13px] md:text-[14px] font-medium text-white font-sans">
                      College Guidance
                    </p>
                  </div>

                  {/* Card 3: Expert Counselling */}
                  <div
                    onClick={() => handleSend("Expert Counselling")}
                    className="border border-[#7B7B7B] rounded-[12px] py-3 md:py-2.5 px-3 md:px-4 flex gap-3 md:gap-4 items-center cursor-pointer hover:bg-[#333333] hover:border-[#FF660F] transition-all duration-200"
                  >
                    <img loading="lazy" decoding="async"
                      src="/person.svg"
                      alt="Counselors"
                      className="w-5 h-5 md:w-6 md:h-6 shrink-0"
                    />
                    <p className="text-[13px] md:text-[14px] font-medium text-white font-sans">
                      Expert Counselling
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-[#232323] mt-2 px-3 md:px-6 py-4 md:py-6 scrollbar-hide">
                <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-[#FF660F] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 && !loading && <WelcomeMessage />}

                      {messages.map((msg: any, index: number) => {
                        let formattedText = msg.text;
                        if (!msg.isUser) {
                          formattedText = msg.text.replace(
                            /\n\n(?=\d+\.)/g,
                            "\n"
                          );
                        }

                        return (
                          <div key={index} className="space-y-3 md:space-y-4">
                            {msg.isUser ? (
                              <ChatMessage text={msg.text} isUser={true} />
                            ) : (
                              // 1. Apply the styles (font, text color, spacing) to this wrapper DIV instead
                              <div className="rounded-2xl px-4 py-2 md:px-5 md:py-3 max-w-full overflow-x-hidden font-sans text-sm md:text-base leading-relaxed text-white">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  children={formattedText}
                                  // 2. Removed 'className' from here to fix the error
                                  components={{
                                    p: ({ node, ...props }) => {
                                      // @ts-ignore
                                      if (node.parent?.tagName === "li") {
                                        return <span {...props} />;
                                      }
                                      return (
                                        <p
                                          className="mb-4 last:mb-0 leading-7 tracking-wide text-gray-200"
                                          {...props}
                                        />
                                      );
                                    },
                                    h1: ({ node, ...props }) => (
                                      <h1
                                        className="text-xl font-bold text-white mb-4 mt-6"
                                        {...props}
                                      />
                                    ),
                                    h2: ({ node, ...props }) => (
                                      <h2
                                        className="text-lg font-semibold text-white mb-3 mt-5"
                                        {...props}
                                      />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3
                                        className="text-base font-semibold text-[#FF660F] mb-2 mt-4"
                                        {...props}
                                      />
                                    ),

                                    ol: ({ node, ...props }) => (
                                      <ol
                                        className="list-decimal list-outside ml-5 space-y-2 mb-4 text-gray-200"
                                        {...props}
                                      />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul
                                        className="list-disc list-outside ml-5 space-y-2 mb-4 text-gray-200 marker:text-[#FF660F]"
                                        {...props}
                                      />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li
                                        className="pl-1 leading-7"
                                        {...props}
                                      />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong
                                        className="font-semibold text-white"
                                        {...props}
                                      />
                                    ),
                                    a: ({ node, ...props }) => (
                                      <a
                                        className="text-[#FF660F] hover:underline hover:text-[#ff853c] transition-colors"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        {...props}
                                      />
                                    ),
                                    table: ({ node, ...props }) => (
                                      <div className="overflow-x-auto my-6 rounded-lg border border-[#404040] shadow-sm">
                                        <table
                                          className="w-full text-sm text-left text-gray-300"
                                          {...props}
                                        />
                                      </div>
                                    ),
                                    thead: ({ node, ...props }) => (
                                      <thead
                                        className="text-xs uppercase bg-[#333333] text-gray-100 font-semibold tracking-wider"
                                        {...props}
                                      />
                                    ),
                                    tbody: ({ node, ...props }) => (
                                      <tbody
                                        className="divide-y divide-[#404040]"
                                        {...props}
                                      />
                                    ),
                                    tr: ({ node, ...props }) => (
                                      <tr
                                        className="bg-[#2a2a2a] hover:bg-[#333333] transition-colors"
                                        {...props}
                                      />
                                    ),
                                    th: ({ node, ...props }) => (
                                      <th
                                        className="px-6 py-4 whitespace-nowrap"
                                        {...props}
                                      />
                                    ),
                                    td: ({ node, ...props }) => (
                                      <td
                                        className="px-6 py-4 leading-6"
                                        {...props}
                                      />
                                    ),
                                  }}
                                />
                              </div>
                            )}

                            {msg.followup && !msg.isUser && (
                              <p className="text-gray-400 text-xs md:text-sm italic max-w-4xl mx-auto pl-4 md:pl-12 pr-3 md:pr-6 -mt-2 font-sans">
                                {msg.followup}
                              </p>
                            )}
                            {msg.suggestions &&
                              msg.suggestions.length > 0 &&
                              !msg.isUser && (
                                <div className="max-w-4xl mx-auto md:pl-12 pr-3 md:pr-6">
                                  <SuggestionChips
                                    suggestions={msg.suggestions}
                                    onSelect={(text) => handleSend(text)}
                                  />
                                </div>
                              )}

                            {/* Counselor cards */}
                            {msg.counsellors &&
                              msg.counsellors.length > 0 &&
                              (() => {
                                const visibleCount =
                                  visibleCounselorsPerMessage[index] || 2;
                                const counsellors = msg.counsellors as any[];
                                const visibleCounsellors = counsellors.slice(
                                  0,
                                  visibleCount
                                );
                                const hasMore =
                                  counsellors.length > visibleCount;

                                return (
                                  <div className="mt-3 md:mt-4 space-y-2 md:space-y-3 pl-1 md:pl-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                      {visibleCounsellors.map((c, idx) => (
                                        <div
                                          onClick={() => {
                                            toggleChatbot();
                                            navigate(`/counsellor/${encodeCounselorId(c.counsellorId)}`);
                                          }}
                                          className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500 cursor-pointer"
                                          style={{
                                            animationDelay: `${idx * 100}ms`,
                                          }}
                                          key={c.counsellorId}
                                        >
                                          <ChatbotCounselorCard counselor={c} />
                                        </div>
                                      ))}
                                    </div>

                                    {hasMore && (
                                      <div className="flex justify-center pt-2">
                                        <button
                                          onClick={() => {
                                            setVisibleCounselorsPerMessage(
                                              (prev) => ({
                                                ...prev,
                                                [index]: (prev[index] || 3) + 3,
                                              })
                                            );
                                          }}
                                          className="px-4 md:px-6 py-2 md:py-2.5 bg-[#2a2a2a] hover:bg-[#FF660F] text-white text-sm md:text-base font-medium rounded-lg border border-[#404040] hover:border-[#FF660F] transition-all duration-300 shadow-sm hover:shadow-md font-sans"
                                        >
                                          See More (
                                          {counsellors.length - visibleCount}{" "}
                                          remaining)
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                          </div>
                        );
                      })}

                      {loading && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pb-3 md:pb-6 lg:pb-15 px-3 md:px-4 bg-transparent">
                <div className="max-w-4xl mx-auto">
                  {loading && (
                    <div className="flex justify-center mb-2 md:mb-3">
                      <button
                        onClick={stopGenerating}
                        className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-200 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-sm hover:bg-[#3b3b3b] transition-all font-sans"
                      >
                        <Square className="h-3 w-3 md:h-4 md:w-4" />
                        Stop generating
                      </button>
                    </div>
                  )}

                  <ChatInput
                    ref={inputRef}
                    input={input}
                    setInput={setInput}
                    handleKeyPress={handleKeyPress}
                    handleSend={handleSend}
                    loading={loading}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
