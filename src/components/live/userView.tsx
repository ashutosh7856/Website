import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, Maximize2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveStreamStore } from '@/store/LiveStreamStore';
import { useAuthStore } from '@/store/AuthStore';
import { listenToChatMessages, listenToCounselorLiveStatus, trackUserJoined, trackUserLeft } from '@/lib/firebase';
import { sendMessageInLiveSession } from '@/api/liveSessions';
import LiveEndedPopup from './LiveEndedPopup';
import { toast } from 'sonner';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

declare const YT: {
  Player: new (
    elementId: string,
    config: {
      height: string;
      width: string;
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
        onError?: (event: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

// lock() is missing from TypeScript's DOM lib and unsupported in some browsers.
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
};

interface ChatMessage {
  messageId: string;
  userId: string;
  userName?: string;
  fullName?: string;
  message: string;
  timestamp: number;
}

// Helper function to extract YouTube video ID from URL or return as-is if already an ID
const extractYouTubeVideoId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  
  // If it's already just an ID (11 characters, alphanumeric), return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If no pattern matches, return the original (might already be an ID)
  return urlOrId;
};

export default function LiveStreamView() {
  const { closeStream, videoId: rawVideoId, streamTitle, description, counsellorId } = useLiveStreamStore();
  const { userId, user } = useAuthStore();
  
  // Extract clean video ID
  const videoId = extractYouTubeVideoId(rawVideoId);
  
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [ytLoading, setYtLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{ title: string; startedAt: unknown } | null>(null);
  const [showLiveEndedPopup, setShowLiveEndedPopup] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const topBarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserInteractedRef = useRef(false); // Track if user has clicked to play

  // Track user joining the live session
  useEffect(() => {
    if (!counsellorId || !userId || !user) return;

    // Track user joined with name and photo
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';
    const userPhoto = user.photo || '';
    trackUserJoined(counsellorId, userId, userName, userPhoto);
    console.log('📍 User joined live session:', { counsellorId, userId, userName, userPhoto });

    // Cleanup: track user left when component unmounts
    return () => {
      trackUserLeft(counsellorId, userId);
      console.log('👋 User left live session:', { counsellorId, userId });
    };
  }, [counsellorId, userId, user]);

  // Content protection: Prevent screenshots and screen recording for live stream
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect screenshot shortcuts
      const isPrintScreen = e.key === 'PrintScreen';
      const isMacScreenshot = (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));
      const isWindowsSnip = (e.metaKey && e.shiftKey && e.key === 's');
      const isWindowsScreenRecording = (e.metaKey && e.altKey && e.key === 'r');
      
      if (isPrintScreen || isMacScreenshot || isWindowsSnip || isWindowsScreenRecording) {
        e.preventDefault();
        toast.error('Screenshots and screen recording are not allowed during live sessions', {
          duration: 3000,
        });
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled for this content', {
        duration: 2000,
      });
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  // Detect orientation (for mobile landscape mode)
  useEffect(() => {
    const checkOrientation = () => {
      // Check if in landscape mode on mobile/tablet (< 1024px)
      const isInLandscape = window.innerWidth < 1024 && window.innerWidth > window.innerHeight;
      setIsLandscape(isInLandscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Auto-hide top bar in landscape mode
  useEffect(() => {
    if (isLandscape) {
      // Hide top bar after 3 seconds in landscape
      const timer = setTimeout(() => {
        setShowTopBar(false);
      }, 3000);
      
      topBarTimerRef.current = timer;
      
      return () => {
        if (topBarTimerRef.current) {
          clearTimeout(topBarTimerRef.current);
        }
      };
    } else {
      // Always show top bar when not in landscape
      setShowTopBar(true);
    }
  }, [isLandscape]);

  const handleVideoClick = () => {
    if (isLandscape) {
      // Toggle top bar visibility on click in landscape mode
      setShowTopBar(prev => !prev);
      
      // If showing, auto-hide again after 3 seconds
      if (!showTopBar) {
        const timer = setTimeout(() => {
          setShowTopBar(false);
        }, 3000);
        
        if (topBarTimerRef.current) {
          clearTimeout(topBarTimerRef.current);
        }
        topBarTimerRef.current = timer;
      }
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- (re)create the YouTube player only when the video changes; initializePlayer is recreated every render
  }, [videoId]);

  const initializePlayer = () => {
    if (!videoId) return;

    try {
      playerRef.current = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0, // Disable all controls
          disablekb: 1, // Disable keyboard controls
          modestbranding: 1,
          rel: 0,
          fs: 0, // Disable fullscreen button
          playsinline: 1, // Play inline on mobile
          origin: window.location.origin,
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            setYtLoading(false);
            // Attempt autoplay
            try {
              event.target.playVideo();
            } catch (err) {
              console.log('Autoplay attempt failed:', err);
            }
            if (window.innerWidth >= 1024) {
              setTimeout(() => {
                try {
                  if (playerRef.current) {
                    playerRef.current.unMute();
                    console.log('🖥️ Desktop detected: Attempting auto-unmute');
                  }
                } catch {
                  // If browser blocks audio, it stays muted and your Smart Layer handles the click
                  console.log('Auto-unmute blocked by browser policy');
                }
              }, 500);
            }
          },
          onStateChange: (event: YTPlayerEvent) => {
            // PlayerState: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
            if (event.data === 1) {
              // Video is now playing - if user hasn't interacted yet and it's muted, we're in autoplay mode
              console.log('Video playing, muted:', event.target.isMuted());
            }
          },
          onError: (event: YTPlayerEvent) => {
            console.error('YouTube player error:', event);
            setYtLoading(false);
          }
        },
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
      setYtLoading(false);
    }
  };

  // Smart invisible overlay click handler
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Handle landscape top bar toggle first
    if (isLandscape) {
      handleVideoClick(); 
    }

    // If player not ready, do nothing
    if (!playerRef.current) {
      console.log('Player not ready yet');
      return;
    }

    try {
      // Get current player state directly from API (most reliable)
      const playerState = playerRef.current.getPlayerState();
      const isMuted = playerRef.current.isMuted();
      
      console.log('Overlay clicked - State:', playerState, 'Muted:', isMuted, 'HasInteracted:', hasUserInteractedRef.current);
      
      // PlayerState values: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
      const isNotPlaying = playerState === -1 || playerState === 2 || playerState === 5;
      
      if (isNotPlaying) {
        // Video is frozen/paused - Play it
        console.log('▶️ Playing video...');
        playerRef.current.playVideo();
        
        // Also unmute immediately (single-tap experience)
        if (isMuted) {
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.unMute();
              console.log('🔊 Unmuted on play');
            }
          }, 100); // Small delay to ensure play command registers first
        }
        
        hasUserInteractedRef.current = true;
      } else if (playerState === 1 && isMuted) {
        // Video is playing but muted - Unmute it
        console.log('🔊 Unmuting video...');
        playerRef.current.unMute();
        hasUserInteractedRef.current = true;
      } else {
        // Video is playing and unmuted - do nothing (or could pause if desired)
        console.log('✓ Video already playing with sound');
      }
    } catch (err) {
      console.error('Error handling overlay click:', err);
      // Fallback: try to play and unmute anyway
      try {
        playerRef.current.playVideo();
        playerRef.current.unMute();
        hasUserInteractedRef.current = true;
      } catch (fallbackErr) {
        console.error('Fallback play/unmute failed:', fallbackErr);
      }
    }
  };

  // Listen to Firebase chat messages
  useEffect(() => {
    if (!counsellorId) return;

    let previousMessageCount = 0;

    const unsubscribe = listenToChatMessages(
      counsellorId,
      (messages: ChatMessage[]) => {
        console.log('🔥 Firebase messages received:', messages.length, messages);
        
        // Check if we have new messages
        if (messages.length > previousMessageCount) {
          // Add only the new messages
          const newMessages = messages.slice(previousMessageCount);
          console.log('➕ Adding new messages:', newMessages);
          
          setChatMessages(prev => {
            // Remove temp messages that match the new real messages
            const filteredPrev = prev.filter(msg => 
              !msg.messageId.startsWith('temp-') || 
              !newMessages.some(newMsg => 
                newMsg.userId === msg.userId && 
                newMsg.message === msg.message &&
                Math.abs(newMsg.timestamp - msg.timestamp) < 5000 // Within 5 seconds
              )
            );
            return [...filteredPrev, ...newMessages];
          });
          
          previousMessageCount = messages.length;
        } else if (messages.length < previousMessageCount) {
          // Session restarted or messages cleared
          setChatMessages(messages);
          previousMessageCount = messages.length;
        } else if (previousMessageCount === 0) {
          // Initial load
          setChatMessages(messages);
          previousMessageCount = messages.length;
        }
      },
      (info) => {
        setSessionInfo(info);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [counsellorId]);

  // Listen to counselor's live status and auto-close if session ends
  useEffect(() => {
    if (!counsellorId) return;

    const unsubscribe = listenToCounselorLiveStatus(
      counsellorId,
      (isLive, lastUpdated) => {
        // console.log('🎥 Live status update:', { counsellorId, isLive, lastUpdated, type: typeof lastUpdated });
        
        if (!isLive) {
          if (!lastUpdated) {
            console.log('🛑 Stream ended (no data) - closing immediately');
            // No data means session was deleted, close immediately
            if (playerRef.current) {
              playerRef.current.destroy();
              playerRef.current = null;
            }
            closeStream();
            setShowLiveEndedPopup(true);
          } else {
            const now = Date.now();
            const lastUpdatedMs = typeof lastUpdated === 'number' ? lastUpdated : lastUpdated;
            const secondsSinceUpdate = (now - lastUpdatedMs) / 1000;
            
            console.log('⏰ Stream ended - now:', now, 'lastUpdated:', lastUpdatedMs, 'seconds:', secondsSinceUpdate);
            
            // If stream ended more than 15 seconds ago
            if (secondsSinceUpdate > 15) {
              console.log('🛑 Closing stream and showing popup');
              // Close stream immediately and show popup
              if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
              }
              closeStream();
              setShowLiveEndedPopup(true);
            } else {
              console.log('⏳ Waiting... only', secondsSinceUpdate.toFixed(1), 'seconds since update');
            }
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [counsellorId, closeStream]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSendingMessage || !userId) return;

    const messageText = messageInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    const currentUser = useAuthStore.getState().user;
    
    // Immediately show sender's own message
    const tempMessage: ChatMessage = {
      messageId: tempMessageId,
      userId: userId,
      fullName: (currentUser?.fullName as string) || 'You',
      message: messageText,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, tempMessage]);
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      await sendMessageInLiveSession(counsellorId, userId, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setChatMessages(prev => prev.filter(m => m.messageId !== tempMessageId));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRotateToLandscape = async () => {
    try {
      // Request fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      
      // Lock to landscape orientation if supported
      const orientation = screen.orientation as LockableScreenOrientation | undefined;
      if (orientation && orientation.lock) {
        try {
          await orientation.lock('landscape');
        } catch (err) {
          console.log('Orientation lock not supported:', err);
        }
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  const handleExitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // Unlock orientation if supported
      const orientation = screen.orientation as LockableScreenOrientation | undefined;
      if (orientation && orientation.unlock) {
        try {
          orientation.unlock();
        } catch (err) {
          console.log('Orientation unlock not supported:', err);
        }
      }
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  };

  const handleClose = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    closeStream();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (fullName: string | undefined, userName: string | undefined) => {
    const name = fullName || userName;
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Top Bar - auto-hide in landscape */}
      {showTopBar && (
        <div className="relative z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Exit</span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 bg-[#FA660F] px-3 py-1 rounded-md shadow-md">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold uppercase">Live</span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Exit fullscreen/Portrait - show only in landscape mode */}
            {isLandscape && (
              <button
                onClick={handleExitFullscreen}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Back to portrait"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            
            {/* Fullscreen - show only in portrait mode on mobile */}
            {!isLandscape && (
              <button
                onClick={handleRotateToLandscape}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium cursor-pointer",
                showChat 
                  ? "bg-[#FA660F] hover:bg-[#FA660F]/90 text-white shadow-md" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video and Info Section */}
        <div className={cn(
          "flex flex-col overflow-hidden",
          isLandscape ? "flex-1" : "flex-none lg:flex-1"
        )}>
          {/* Video Player */}
          <div 
            className={cn(
              "relative bg-black overflow-hidden",
              isLandscape ? "flex-1" : "aspect-video lg:flex-1 lg:aspect-auto"
            )}
          >
            {ytLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-[#FA660F] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-sm">Loading live stream...</p>
              </div>
            )}
            
            {/* Video Player - no rotation */}
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
              <div 
                id="youtube-player" 
                className="absolute" 
                style={{
                  width: '100%',
                  height: '100%',
                  left: '0',
                  top: '0'
                }} 
              />
              {/* Smart Invisible Overlay - handles play/unmute on tap */}
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={handleOverlayClick}
                style={{ pointerEvents: 'auto' }} 
              />
            </div>
          </div>

          {/* Video Info Section - hidden in landscape mode */}
          {!isLandscape && (
            <div className="bg-white shrink-0 lg:border-t lg:border-gray-200 border-b lg:border-b-0 border-gray-200">
              <div className="px-3 lg:px-6 py-1.5 lg:py-3">
                <h1 className="text-gray-900 text-sm lg:text-lg font-bold truncate">
                  {sessionInfo?.title || streamTitle}
                </h1>
                <p className="text-gray-600 text-xs lg:text-sm line-clamp-1 lg:line-clamp-2">
                  {description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className={cn(
            "flex flex-col border-gray-200 min-h-0",
            isLandscape 
              ? "absolute left-0 top-0 bottom-0 w-1/2 max-w-md bg-white border-r-2 border-gray-300 shadow-2xl z-20" 
              : "flex-1 lg:flex-none lg:w-[340px] xl:w-[400px] lg:border-l"
          )}>
            {/* Chat Messages */}
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-2 pt-0 pb-2 bg-white hide-scrollbar flex flex-col min-h-0"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                  <MessageCircle className="w-8 sm:w-12 h-8 sm:h-12 text-gray-300 mb-2" />
                  <p className="text-gray-600 text-xs sm:text-sm">Welcome to live chat!</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {chatMessages.map((msg) => (
                    <div key={msg.messageId} className="px-2 py-1 hover:bg-gray-50 rounded">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-linear-to-br from-[#FA660F] to-[#13097D] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold mt-1">
                          {getInitials(msg.fullName, msg.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                            <span className="text-[11px] sm:text-xs font-semibold text-gray-900">
                              {msg.fullName || msg.userName || 'Anonymous'}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-800 wrap-break-word mt-0.5">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area - aligned with title section height */}
            <div className="border-t border-gray-200 bg-white shrink-0">
              <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center">
                {userId ? (
                  <div className="flex gap-2 items-center flex-1">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Say something..."
                      disabled={isSendingMessage}
                      className="flex-1 bg-gray-50 text-gray-900 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm placeholder:text-gray-500 focus:outline-none focus:bg-gray-100 disabled:opacity-50 border border-gray-200"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSendingMessage}
                      className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-[#FA660F] hover:bg-[#FA660F]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 flex-1">
                    <p className="text-gray-500 text-xs sm:text-sm">Sign in to chat</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Ended Popup */}
      {showLiveEndedPopup && (
        <LiveEndedPopup
          onClose={() => {
            setShowLiveEndedPopup(false);
          }}
        />
      )}
    </div>
  );
}