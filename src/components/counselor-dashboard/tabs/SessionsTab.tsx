import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Users, Radio } from 'lucide-react';
import type { User } from "@/types/user";
import { listenToChatMessages } from '@/lib/firebase';

interface SessionsTabProps {
  user: User | null;
  token: string;
}

interface ChatMessage {
  messageId: string;
  userId: string;
  fullName: string;
  message: string;
  timestamp: number;
  userPhotoUrl?: string;
}

interface SessionInfo {
  liveSessionId: string;
  title: string;
  startedAt: unknown;
}

export default function SessionsTab({ user }: SessionsTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);

  // Listen to Firebase messages - NO DELAY, instant display
  useEffect(() => {
    if (!user?.userName) return;

    const unsubscribe = listenToChatMessages(
      user.userName,
      (msgs) => {
        // Simply set all messages immediately, no queue
        if (msgs.length > previousMessageCountRef.current) {
          // Mark ONLY the latest message for highlighting
          const newMessages = msgs.slice(previousMessageCountRef.current);
          const latestMsg = newMessages[newMessages.length - 1];
          setLatestMessageId(latestMsg?.messageId || null);
          
          // Remove "new" indicator after 8 seconds
          setTimeout(() => {
            setLatestMessageId(null);
          }, 8000);
          
          previousMessageCountRef.current = msgs.length;
        } else if (msgs.length < previousMessageCountRef.current) {
          // Session restarted - reset count
          previousMessageCountRef.current = msgs.length;
        }
        
        // Always set messages immediately
        setMessages(msgs);
      },
      (info) => setSessionInfo(info)
    );

    return () => unsubscribe();
  }, [user?.userName]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Full screen chat view
  const FullScreenChatView = () => (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFullScreen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors hover:cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-bold text-base">LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="text-base">{messages.length} messages</span>
          </div>
        </div>
      </div>

      {/* Chat Messages - Newest on top */}
      <div 
        ref={chatContainerRef}
        className="h-[calc(100vh-80px)] overflow-y-auto px-8 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No messages yet</p>
              <p className="text-base mt-2">Messages will appear here in real-time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {[...messages].reverse().map((msg) => {
              const isNew = msg.messageId === latestMessageId;
              return (
                <div 
                  key={msg.messageId}
                  className={`flex gap-4 px-4 py-4 border-b border-gray-100 transition-colors ${
                    isNew ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#FF660F] to-orange-600 flex items-center justify-center text-white text-base font-semibold shrink-0 relative">
                    {getAvatarInitials(msg.fullName)}
                    {isNew && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-semibold text-gray-900 text-lg">{msg.fullName}</span>
                      <span className="text-gray-500 text-sm">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Main SessionsTab view
  if (showFullScreen) {
    return <FullScreenChatView />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {!sessionInfo || messages.length === 0 ? (
        // No live session
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4">
            <Radio className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Live Session</h3>
          <p className="text-gray-500">Start a live session to see chat messages here</p>
        </div>
      ) : (
        // Active live session - Chat messages
        <div>
          {/* Header with fullscreen button */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h2 className="text-lg font-semibold text-gray-800">Live Session Chat</h2>
              <span className="text-sm text-gray-500">({messages.length})</span>
            </div>
            <button
              onClick={() => setShowFullScreen(true)}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:cursor-pointer hover:text-gray-900 transition-colors"
              title="Open fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {/* Messages list - scrollable, newest on top */}
          <div 
            ref={chatContainerRef}
            className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...messages].reverse().map((msg) => {
              const isNew = msg.messageId === latestMessageId;
              return (
                <div 
                  key={msg.messageId} 
                  className={`flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300 py-2 ${isNew ? 'bg-orange-50 rounded-lg px-3' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FF660F] to-orange-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 relative">
                    {getAvatarInitials(msg.fullName)}
                    {isNew && (
                      <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-semibold text-gray-900 text-base">{msg.fullName}</span>
                      <span className="text-gray-500 text-sm">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 text-base leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
