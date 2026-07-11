import { Lock, ChevronRight, Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Settings, Gauge } from "lucide-react";
// import { useAuthStore } from "@/store/AuthStore";
import type { CourseContent } from "@/api/course";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

// YouTube IFrame API types
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  getAvailableQualityLevels: () => string[];
  getPlaybackQuality: () => string;
  setPlaybackQuality: (quality: string) => void;
  getPlaybackRate: () => number;
  setPlaybackRate: (rate: number) => void;
  getAvailablePlaybackRates: () => number[];
}

interface YTPlayerEvent {
  target: YTPlayer;
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
        onError?: (event: any) => void;
      };
    }
  ) => YTPlayer;
};

type ContentCardProps = {
  courseContents?: CourseContent[];
  currentPath?: string[];
  setCurrentPath?: (path: string[]) => void;
  isPurchased?: boolean;
  userRole?: string;
  /** When true, outer chrome matches an embedded block inside a parent card */
  embedded?: boolean;
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'folder':
      return <img loading="lazy" decoding="async" src="/folder.svg" alt="" />;
    case 'video':
      return <img loading="lazy" decoding="async" src="/video.svg" alt="" />;
    case 'link':
      return <img loading="lazy" decoding="async" src="/video.svg" alt="" />; // YouTube/video link with blue icon
    case 'doc':
    case 'pdf':
      return <img loading="lazy" decoding="async" src="/pdf.svg" alt="" />;
    case 'image':
      return <img loading="lazy" decoding="async" src="/pdf.svg" alt="" />;
    default:
      return <img loading="lazy" decoding="async" src="/pdf.svg" alt="" />;
  }
};

// Helper to extract YouTube video ID
const extractYouTubeVideoId = (urlOrId: string): string => {
  if (!urlOrId) return '';

  // If it's already just an ID (11 characters), return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  // Extract from various YouTube URL formats
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

  return urlOrId;
};

export default function ContentCard({
  courseContents = [],
  currentPath = ['root'],
  setCurrentPath,
  isPurchased = false,
  userRole,
  embedded = false,
}: ContentCardProps) {
  // const { role } = useAuthStore();
  const shouldBlurContent = !isPurchased && (userRole === 'user' || userRole === 'student');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CourseContent | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [availableSpeeds, setAvailableSpeeds] = useState<number[]>([0.25, 0.5, 1, 1.25, 1.5, 2]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenPlayerRef = useRef<YTPlayer | null>(null);

  // Content protection: Prevent screenshots and screen recording
  useEffect(() => {
    if (!showFilePreview || !selectedFile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect screenshot shortcuts
      const isPrintScreen = e.key === 'PrintScreen';
      const isMacScreenshot = (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));
      const isWindowsSnip = (e.metaKey && e.shiftKey && e.key === 's');
      const isWindowsScreenRecording = (e.metaKey && e.altKey && e.key === 'r');

      if (isPrintScreen || isMacScreenshot || isWindowsSnip || isWindowsScreenRecording) {
        e.preventDefault();
        toast.error('Screenshots and screen recording are not allowed for this content', {
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
  }, [showFilePreview, selectedFile]);

  // Initialize YouTube player when a link/video is selected
  useEffect(() => {
    if (!selectedFile || (selectedFile.type !== 'link' && selectedFile.type !== 'video')) {
      return;
    }

    const playerId = `player-${selectedFile.courseContentId}`;

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer(playerId, playerRef);
      };
    } else {
      initializePlayer(playerId, playerRef);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [selectedFile]);

  // Initialize fullscreen player when entering fullscreen
  useEffect(() => {
    if (isFullscreen && selectedFile && window.YT) {
      const playerId = `player-fs-${selectedFile.courseContentId}`;

      // Get current state from normal player BEFORE switching
      const wasPlaying = isPlaying;
      const currentPos = currentTime;

      // Pause normal player to prevent audio overlap
      if (playerRef.current) {
        const normalPlayer = playerRef.current as any;
        if (normalPlayer.pauseVideo) {
          normalPlayer.pauseVideo();
        }
      }

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlayer(playerId, fullscreenPlayerRef);

        // After fullscreen player initializes, seek to position and play if needed
        setTimeout(() => {
          if (fullscreenPlayerRef.current) {
            const fsPlayer = fullscreenPlayerRef.current as any;
            if (fsPlayer.seekTo) {
              fsPlayer.seekTo(currentPos, true);
              if (wasPlaying && fsPlayer.playVideo) {
                fsPlayer.playVideo();
              }
            }
          }
        }, 500);
      }, 100);
    } else if (!isFullscreen && fullscreenPlayerRef.current) {
      // Exiting fullscreen - get state from fullscreen player
      const fsPlayer = fullscreenPlayerRef.current as any;
      const wasPlaying = isPlaying;
      const currentPos = fsPlayer.getCurrentTime ? fsPlayer.getCurrentTime() : currentTime;

      // Destroy fullscreen player
      fullscreenPlayerRef.current.destroy();
      fullscreenPlayerRef.current = null;

      // Resume normal player at same position
      setTimeout(() => {
        if (playerRef.current) {
          const normalPlayer = playerRef.current as any;
          if (normalPlayer.seekTo) {
            normalPlayer.seekTo(currentPos, true);
            if (wasPlaying && normalPlayer.playVideo) {
              normalPlayer.playVideo();
            }
          }
        }
      }, 100);
    }

    return () => {
      if (fullscreenPlayerRef.current && !isFullscreen) {
        fullscreenPlayerRef.current.destroy();
        fullscreenPlayerRef.current = null;
      }
    };
  }, [isFullscreen, selectedFile]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video is selected
      if (!selectedFile || (selectedFile.type !== 'link' && selectedFile.type !== 'video')) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'f':
          e.preventDefault();
          setIsFullscreen(!isFullscreen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, isFullscreen, isPlaying, currentTime, duration]);

  // Track video progress
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        // Get current time from active player
        const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
        const player = activePlayer as any;
        if (player && player.getCurrentTime) {
          const newTime = player.getCurrentTime();
          setCurrentTime(newTime);
        }
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, isFullscreen]);

  const initializePlayer = (playerId: string, targetPlayerRef: React.MutableRefObject<YTPlayer | null>) => {
    if (!selectedFile) return;

    const videoId = selectedFile.type === 'link'
      ? extractYouTubeVideoId(selectedFile.documentUrl || '')
      : '';

    if (!videoId && selectedFile.type === 'link') return;

    try {
      targetPlayerRef.current = new YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // Disable YouTube controls - we have custom ones
          disablekb: 1, // Disable keyboard shortcuts (prevents YouTube shortcuts)
          modestbranding: 1, // Minimal YouTube branding
          rel: 0, // Don't show related videos
          fs: 0, // Disable fullscreen button (prevents going to YouTube)
          playsinline: 1, // Play inline on mobile
          iv_load_policy: 3, // Disable video annotations
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (import.meta.env.DEV) {
              console.log('YouTube player ready');
            }
            try {
              const videoDuration = event.target.getDuration();
              // YouTube live streams return 0 for duration, handle gracefully
              if (videoDuration && videoDuration > 0) {
                setDuration(videoDuration);
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn('Could not get video duration:', error);
              }
            }

            // Get available quality levels with error handling
            try {
              const qualities = event.target.getAvailableQualityLevels();
              if (qualities && qualities.length > 0) {
                setAvailableQualities(qualities);
                const currentQual = event.target.getPlaybackQuality();
                if (currentQual) {
                  setCurrentQuality(currentQual);
                }
              } else {
                // Fallback: provide standard quality options
                setAvailableQualities(['hd1080', 'hd720', 'large', 'medium']);
                setCurrentQuality('hd720');
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn('Could not get quality levels:', error);
              }
              // Still provide basic quality options as fallback
              setAvailableQualities(['hd1080', 'hd720', 'large', 'medium']);
              setCurrentQuality('hd720');
            }

            // Get available playback rates and apply saved speed
            try {
              const speeds = event.target.getAvailablePlaybackRates();
              if (speeds && speeds.length > 0) {
                setAvailableSpeeds(speeds);
                if (import.meta.env.DEV) {
                  console.log('📊 Available playback speeds:', speeds);
                }
              }

              // Apply saved playback speed (important for fullscreen transitions)
              if (playbackSpeed !== 1 && event.target.setPlaybackRate) {
                event.target.setPlaybackRate(playbackSpeed);
                if (import.meta.env.DEV) {
                  console.log('🔄 Applied saved playback speed:', playbackSpeed);
                }
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn('Could not get playback rates:', error);
              }
            }

            // Sync fullscreen player with main player
            if (targetPlayerRef === fullscreenPlayerRef && playerRef.current) {
              const mainPlayer = playerRef.current as any;
              if (mainPlayer.getCurrentTime) {
                const currentPos = mainPlayer.getCurrentTime();
                event.target.seekTo(currentPos, true);
                if (isPlaying) {
                  event.target.playVideo();
                }
              }
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
            setIsPlaying(event.data === 1);
          },
          onError: (event: any) => {
            // Handle YouTube player errors gracefully
            if (import.meta.env.DEV) {
              console.error('YouTube player error:', event.data);
            }
            toast.error('Video playback error. Please try refreshing.');
          },
        },
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error initializing YouTube player:', error);
      }
    }
  };

  const handlePlayPause = () => {
    const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
    if (activePlayer) {
      if (isPlaying) {
        activePlayer.pauseVideo();
      } else {
        activePlayer.playVideo();
      }
    }
  };

  const handleSeek = (newTime: number) => {
    const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
    if (activePlayer) {
      const player = activePlayer as any;
      if (player.seekTo) {
        player.seekTo(newTime, true);
        setCurrentTime(newTime);
      }
    }
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const handleQualityChange = (quality: string) => {
    const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
    if (activePlayer) {
      try {
        if (import.meta.env.DEV) {
          console.log('🎬 Quality Change Request:', {
            requestedQuality: quality,
            currentQuality: currentQuality,
            availableQualities: availableQualities
          });
        }

        // Check if setPlaybackQuality method exists
        if (typeof activePlayer.setPlaybackQuality === 'function') {
          activePlayer.setPlaybackQuality(quality);

          // Verify the quality actually changed (dev mode only)
          if (import.meta.env.DEV) {
            setTimeout(() => {
              const player = activePlayer as any;
              if (player.getPlaybackQuality) {
                const actualQuality = player.getPlaybackQuality();
                console.log('✅ Quality Change Result:', {
                  requestedQuality: quality,
                  actualQuality: actualQuality,
                  changeSuccessful: actualQuality === quality
                });

                if (actualQuality !== quality) {
                  console.warn('⚠️ Quality change partially applied. Requested:', quality, 'Got:', actualQuality);
                }
              }
            }, 500);
          }

          setCurrentQuality(quality);
          setShowQualityMenu(false);
          toast.success(`Quality changed to ${getQualityLabel(quality)}`);
        } else {
          throw new Error('Quality change not supported');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Failed to change quality:', error);
        }
        toast.error('Could not change quality. Feature may not be available for this video.');
        setShowQualityMenu(false);
      }
    }
  };

  const getQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      'highres': '4K',
      'hd1440': '1440p',
      'hd1080': '1080p',
      'hd720': '720p',
      'large': '480p',
      'medium': '360p',
      'small': '240p',
      'tiny': '144p',
      'auto': 'Auto'
    };
    return labels[quality] || quality;
  };

  const handleSpeedChange = (speed: number) => {
    const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
    if (activePlayer) {
      try {
        if (import.meta.env.DEV) {
          console.log('⚡ Speed Change Request:', {
            requestedSpeed: speed,
            currentSpeed: playbackSpeed
          });
        }

        // Check if setPlaybackRate method exists
        if (typeof activePlayer.setPlaybackRate === 'function') {
          activePlayer.setPlaybackRate(speed);

          // Verify the speed actually changed (dev mode only)
          if (import.meta.env.DEV) {
            setTimeout(() => {
              const player = activePlayer as any;
              if (player.getPlaybackRate) {
                const actualSpeed = player.getPlaybackRate();
                console.log('✅ Speed Change Result:', {
                  requestedSpeed: speed,
                  actualSpeed: actualSpeed,
                  changeSuccessful: Math.abs(actualSpeed - speed) < 0.01
                });
              }
            }, 200);
          }

          setPlaybackSpeed(speed);
          setShowSpeedMenu(false);
          toast.success(`Playback speed: ${getSpeedLabel(speed)}`);
        } else {
          throw new Error('Speed change not supported');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Failed to change speed:', error);
        }
        toast.error('Could not change playback speed.');
        setShowSpeedMenu(false);
      }
    }
  };

  const getSpeedLabel = (speed: number) => {
    if (speed === 1) return 'Normal';
    return `${speed}x`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPathString = () => {
    // Remove 'Contents' from path for data filtering since it's UI-only
    // E.g., ['root', 'Contents', 'Live Sessions'] -> 'root/Live Sessions'
    const pathWithoutContents = currentPath.filter(p => p !== 'Contents');
    return pathWithoutContents.join('/');
  };

  // Show items at current path
  const currentItems = courseContents.filter(item => item.parentPath === getCurrentPathString());

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Helper to format upload date/time
  const formatUploadDateTime = (uploadedAt?: string) => {
    if (!uploadedAt) return null;
    try {
      const date = new Date(uploadedAt);
      // Format as "Dec 18, 2025, 7:30 PM"
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return null;
    }
  };

  const getItemDescription = (item: CourseContent) => {
    if (item.type === 'folder') {
      // Count only direct children (not grandchildren)
      const directChildren = courseContents.filter(c => c.parentPath === item.path);

      const folders = directChildren.filter(c => c.type === 'folder').length;
      const videos = directChildren.filter(c => c.type === 'video' || c.type === 'link').length;
      const files = directChildren.filter(c => c.type === 'doc' || c.type === 'pdf' || c.type === 'image').length;

      const parts = [];
      if (folders > 0) parts.push(`${folders} folder(s)`);
      if (videos > 0) parts.push(`${videos} video(s)`);
      if (files > 0) parts.push(`${files} file(s)`);

      return parts.length > 0 ? parts.join(', ') : '0 items';
    }
    // Show date/time for videos in Live Sessions folder
    if ((item.type === 'link' || item.type === 'video') && item.parentPath.includes('Live Sessions')) {
      const dateTime = formatUploadDateTime(item.uploadedAt);
      return dateTime || 'Video link';
    }
    // Show descriptive text for other links
    if (item.type === 'link') {
      return 'Video link';
    }
    return formatFileSize(item.fileSize);
  };


  const handleItemClick = (item: CourseContent) => {
    if (item.type === 'folder') {
      // Navigate into folder by using its actual path
      // Convert item.path to array format, e.g., "root/Live Sessions" -> ['root', 'Contents', 'Live Sessions']
      const pathParts = item.path.split('/');
      // Insert 'Contents' after 'root' for UI consistency
      const newPath = ['root', 'Contents', ...pathParts.slice(1)];
      if (setCurrentPath) {
        setCurrentPath(newPath);
      }
    } else if (item.type === 'video' || item.type === 'link' || item.type === 'image' || item.type === 'doc' || item.type === 'pdf') {
      // Open file preview for all file types (videos, images, PDFs)
      setSelectedFile(item);
      setShowFilePreview(true);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (setCurrentPath && index < currentPath.length - 1) {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const shellClass = embedded
    ? "relative overflow-hidden"
    : "bg-white rounded-2xl border p-4 relative overflow-hidden";

  return (
    <div className={shellClass}>
      <div className={`flex items-center justify-between gap-3 ${embedded ? "mb-3" : "mb-3"}`}>
        <h1 className="text-[14px] md:text-[20px] font-semibold text-[#0E1629] shrink-0">
          Content
        </h1>
        {currentPath.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs md:text-sm overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
            {currentPath.map((folder, index) => (
              <div key={index} className="flex items-center gap-1.5 shrink-0">
                {index > 0 && <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`cursor-pointer whitespace-nowrap ${index === currentPath.length - 1
                    ? 'text-[#13097D] font-semibold'
                    : 'text-gray-500 hover:text-[#13097D]'
                    }`}
                >
                  {folder === 'root' ? 'Home' : folder === 'Contents' ? 'Contents' : folder}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show single "Contents" folder if we're at root */}
      {currentPath.length === 1 && currentPath[0] === 'root' ? (
        courseContents.filter(item => item.parentPath === 'root').length === 0 ? (
          <p className="text-[#8C8CA1] text-center py-8">No content available</p>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${shouldBlurContent ? "blur-md pointer-events-none" : ""}`}>
            <div
              className="relative group h-14 bg-[#F5F5F5] rounded-[12px] flex justify-between items-center p-4 cursor-pointer hover:bg-gray-200 w-full"
              onClick={() => setCurrentPath && setCurrentPath(['root', 'Contents'])}
            >
              <div className="flex gap-3 flex-1 min-w-0">
                <img loading="lazy" decoding="async" src="/folder.svg" alt="" className="w-6 h-6" />
                <div className="flex flex-col min-w-0">
                  <h1 className="text-xs md:text-[1rem] font-semibold text-[#242645] truncate">
                    Contents
                  </h1>
                  <p className="text-[0.625rem] md:text-[0.875rem] font-normal text-[#8C8CA1] truncate">
                    {courseContents.filter(item => item.parentPath === 'root').length} item(s)
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {shouldBlurContent && (
                  <Lock className="h-4 w-4 text-[#226CBD]" aria-hidden />
                )}
                <ChevronRight className="text-gray-400" />
              </div>
            </div>
          </div>
        )
      ) : currentPath.length === 2 && currentPath[1] === 'Contents' ? (
        /* Show only root-level content when inside "Contents" folder */
        courseContents.filter(item => item.parentPath === 'root').length === 0 ? (
          <p className="text-[#8C8CA1] text-center py-8">No content available</p>
        ) : (
          <div className={`flex gap-4 flex-wrap ${shouldBlurContent ? "blur-md pointer-events-none" : ""}`}>
            {courseContents.filter(item => item.parentPath === 'root').map((item) => (
              <div
                key={item.courseContentId}
                className={`relative group h-14 bg-[#F5F5F5] w-90 rounded-[12px] flex justify-between items-center p-4 cursor-pointer hover:bg-gray-200`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  {getFileIcon(item.type)}
                  <div className="flex flex-col min-w-0">
                    <h1 className="text-xs md:text-[1rem] font-semibold text-[#242645] truncate" title={item.name}>
                      {item.name}
                    </h1>
                    <p className="text-[0.625rem] md:text-[0.875rem] font-normal text-[#8C8CA1] truncate" title={getItemDescription(item)}>
                      {getItemDescription(item)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {shouldBlurContent && (
                    <Lock className="h-4 w-4 text-[#226CBD]" aria-hidden />
                  )}
                  {item.type === 'folder' && <ChevronRight className="text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Show items at current path for deeper navigation */
        currentItems.length === 0 ? (
          <p className="text-[#8C8CA1] text-center py-8">No content in this folder</p>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${shouldBlurContent ? "blur-md pointer-events-none" : ""}`}>
            {currentItems.map((item) => (
              <div
                key={item.courseContentId}
                className={`relative group h-14 bg-[#F5F5F5] rounded-[12px] flex justify-between items-center p-4 cursor-pointer hover:bg-gray-200 w-full`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  {getFileIcon(item.type)}
                  <div className="flex flex-col min-w-0">
                    <h1 className="text-xs md:text-[1rem] font-semibold text-[#242645] truncate" title={item.name}>
                      {item.name}
                    </h1>
                    <p className="text-[0.625rem] md:text-[0.875rem] font-normal text-[#8C8CA1] truncate" title={getItemDescription(item)}>
                      {getItemDescription(item)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {shouldBlurContent && (
                    <Lock className="h-4 w-4 text-[#226CBD]" aria-hidden />
                  )}
                  {item.type === 'folder' && <ChevronRight className="text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {shouldBlurContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
          <Lock className="w-8 h-8 md:w-12 md:h-12 text-[#343C6A] mb-2 md:mb-3" />
          <h3 className="text-sm md:text-lg font-semibold text-[#343C6A] mb-1">
            Content Locked
          </h3>
          <p className="text-xs md:text-sm text-[#8C8CA1] mb-3 md:mb-4">
            Purchase this course to access all content
          </p>
        </div>
      )}

      {/* Inline Video/Image Player - Shows instead of file list when selected */}
      {showFilePreview && selectedFile && (
        <div className="mt-4 select-none" onContextMenu={(e) => e.preventDefault()}>
          {/* Close Button */}
          <button
            onClick={() => {
              setShowFilePreview(false);
              setSelectedFile(null);
            }}
            className="flex items-center gap-2 mb-4 px-4 py-2 text-[#13097D] hover:bg-[#13097D]/10 rounded-lg transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            <span className="text-sm md:text-base font-semibold">Close</span>
          </button>

          {/* Content Title */}
          <h2 className="text-base md:text-xl font-bold text-[#343C6A] mb-4">{selectedFile.name}</h2>

          {/* Content Player/Viewer */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
            {selectedFile.type === 'link' || selectedFile.type === 'video' ? (
              <div
                className="relative"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Video Player - with conditional rotation */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <div
                    id={`player-${selectedFile.courseContentId}`}
                    className="absolute"
                    style={
                      selectedFile.source === 'youtube'
                        ? {
                          // YouTube videos: no rotation, normal display
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }
                        : {
                          // Live streams/other videos: apply rotation for mobile recordings
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'center center',
                          width: '177.78%',
                          height: '177.78%',
                          left: '-38.89%',
                          top: '-38.89%'
                        }
                    }
                  />

                  {/* Custom Controls Overlay */}
                  <div
                    className={`absolute inset-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    {/* Center Play/Pause Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause();
                        }}
                        className="pointer-events-auto w-16 h-16 md:w-20 md:h-20 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition cursor-pointer shadow-2xl backdrop-blur-sm border-2 border-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" />
                        ) : (
                          <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="absolute bottom-0 left-0 right-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-2 md:space-y-3">
                        {/* Progress Bar */}
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="w-full h-1 md:h-1.5 rounded-lg cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #FA660F 0%, #FA660F ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`
                          }}
                        />

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-3">
                            {/* Play/Pause */}
                            <button
                              onClick={handlePlayPause}
                              className="w-10 h-10 md:w-12 md:h-12 bg-[#FA660F] hover:bg-[#e55e0e] rounded-full flex items-center justify-center transition cursor-pointer shadow-lg"
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                              ) : (
                                <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                              )}
                            </button>

                            {/* Skip Back 10s */}
                            <button
                              onClick={() => handleSkip(-10)}
                              className="hidden sm:flex px-2 md:px-3 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs md:text-sm font-semibold transition cursor-pointer items-center gap-1"
                            >
                              <SkipBack className="w-3 h-3 md:w-4 md:h-4" />
                              <span>10s</span>
                            </button>

                            {/* Skip Forward 10s */}
                            <button
                              onClick={() => handleSkip(10)}
                              className="hidden sm:flex px-2 md:px-3 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs md:text-sm font-semibold transition cursor-pointer items-center gap-1"
                            >
                              <span>10s</span>
                              <SkipForward className="w-3 h-3 md:w-4 md:h-4" />
                            </button>

                            {/* Time Display */}
                            <span className="text-white text-xs md:text-sm font-medium hidden md:inline">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Speed Selector */}
                            <div className="relative">
                              <button
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                              >
                                <Gauge className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              </button>

                              {/* Speed Menu */}
                              {showSpeedMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[120px]">
                                  <div className="px-3 py-2 text-white text-xs font-semibold border-b border-white/20">
                                    Speed
                                  </div>
                                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                    {availableSpeeds.map((speed) => (
                                      <button
                                        key={speed}
                                        onClick={() => handleSpeedChange(speed)}
                                        className={`w-full px-3 py-2 text-left text-xs md:text-sm hover:bg-white/20 transition ${playbackSpeed === speed ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'
                                          }`}
                                      >
                                        {getSpeedLabel(speed)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Quality Selector */}
                            {availableQualities.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                                  className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                                >
                                  <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </button>

                                {/* Quality Menu */}
                                {showQualityMenu && (
                                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[120px]">
                                    <div className="px-3 py-2 text-white text-xs font-semibold border-b border-white/20">
                                      Quality
                                    </div>
                                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                      {availableQualities.map((quality) => (
                                        <button
                                          key={quality}
                                          onClick={() => handleQualityChange(quality)}
                                          className={`w-full px-3 py-2 text-left text-xs md:text-sm hover:bg-white/20 transition ${currentQuality === quality ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'
                                            }`}
                                        >
                                          {getQualityLabel(quality)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fullscreen Button */}
                            <button
                              onClick={() => setIsFullscreen(!isFullscreen)}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                            >
                              {isFullscreen ? (
                                <Minimize className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              ) : (
                                <Maximize className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block YouTube clicks */}
                  <div
                    className="absolute inset-0 z-10 cursor-default"
                    style={{ pointerEvents: showControls ? 'none' : 'auto' }}
                    onClick={handlePlayPause}
                  />
                </div>
              </div>
            ) : selectedFile.type === 'image' ? (
              /* Image Viewer - inline display with fullscreen option */
              <div className="relative">
                <img loading="lazy" decoding="async"
                  src={selectedFile.documentUrl || ''}
                  alt={selectedFile.name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setPdfFullscreen(true)}
                  className="absolute top-4 right-4 px-4 py-2 bg-[#13097D] text-white rounded-lg font-semibold hover:bg-[#0d0659] transition cursor-pointer inline-flex items-center gap-2 shadow-lg"
                >
                  <Maximize className="w-4 h-4" />
                  <span className="hidden md:inline">Fullscreen</span>
                </button>
              </div>
            ) : (selectedFile.type === 'doc' || selectedFile.type === 'pdf') ? (
              /* PDF Viewer - inline preview with fullscreen option, toolbar disabled */
              <div className="relative">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedFile.documentUrl || '')}&embedded=true`}
                  className="w-full h-[70vh] border-0 rounded-lg bg-white"
                  title={selectedFile.name}
                  allow="autoplay"
                />
                <button
                  onClick={() => setPdfFullscreen(true)}
                  className="absolute top-4 right-4 px-4 py-2 bg-[#13097D] text-white rounded-lg font-semibold hover:bg-[#0d0659] transition cursor-pointer inline-flex items-center gap-2 shadow-lg"
                >
                  <Maximize className="w-4 h-4" />
                  <span className="hidden md:inline">Fullscreen</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">
              {selectedFile.type === 'link' || selectedFile.type === 'video'
                ? 'Video is optimized for learning. Use the controls to play/pause and navigate.'
                : selectedFile.type === 'image'
                  ? 'Image displayed above. Use browser zoom if needed.'
                  : (selectedFile.type === 'doc' || selectedFile.type === 'pdf')
                    ? 'PDF document displayed above. Scroll to read all pages.'
                    : ''}
            </p>
          </div>
        </div>
      )}

      {/* Custom Fullscreen Modal */}
      {isFullscreen && selectedFile && (selectedFile.type === 'link' || selectedFile.type === 'video') && (
        <div
          className="fixed inset-0 z-[100] bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onTouchStart={() => setShowControls(true)}
          onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
        >
          {/* Full Screen Video - FILLS ENTIRE SCREEN WITH CONDITIONAL ROTATION */}
          <div className="absolute inset-0 bg-black overflow-hidden">
            {/* Video player */}
            <div
              id={`player-fs-${selectedFile.courseContentId}`}
              style={
                selectedFile.source === 'youtube'
                  ? {
                    // YouTube videos: no rotation, normal fullscreen
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }
                  : {
                    // Live streams/other videos: apply rotation for mobile recordings
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: window.innerWidth < 768 ? '100vw' : '100vh',
                    height: window.innerWidth < 768 ? '100vh' : '100vw',
                    transform: window.innerWidth < 768
                      ? 'translate(-50%, -50%)'
                      : 'translate(-50%, -50%) rotate(-90deg)',
                  }
              }
            />

            {/* Transparent overlay to block YouTube UI */}
            <div
              className="absolute inset-0 z-[5]"
              style={{
                pointerEvents: showControls ? 'none' : 'auto',
                background: 'transparent',
              }}
              onClick={handlePlayPause}
              onTouchEnd={(e) => { e.preventDefault(); handlePlayPause(); }}
            />
          </div>

          {/* Controls Overlay - NOT rotated, always horizontal */}
          <div
            className={`absolute inset-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 md:h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FA660F 0%, #FA660F ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`
                }}
              />

              {/* Control Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 md:gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 md:w-14 md:h-14 bg-[#FA660F] hover:bg-[#e55e0e] rounded-full flex items-center justify-center transition cursor-pointer shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 md:w-7 md:h-7 text-white fill-white" />
                    ) : (
                      <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Skip Back */}
                  <button
                    onClick={() => handleSkip(-10)}
                    className="hidden sm:flex px-3 md:px-4 py-2 md:py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm md:text-base font-semibold transition cursor-pointer items-center gap-2"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                    <span>10s</span>
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={() => handleSkip(10)}
                    className="hidden sm:flex px-3 md:px-4 py-2 md:py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm md:text-base font-semibold transition cursor-pointer items-center gap-2"
                  >
                    <span>10s</span>
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  {/* Time */}
                  <span className="text-white text-sm md:text-lg font-medium hidden md:inline">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-3 md:px-4 py-2 md:py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition cursor-pointer"
                    >
                      <Gauge className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      <span className="text-white text-xs md:text-base font-semibold hidden sm:inline">{getSpeedLabel(playbackSpeed)}</span>
                    </button>

                    {/* Speed Menu */}
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[140px]">
                        <div className="px-4 py-2 text-white text-sm font-semibold border-b border-white/20">
                          Speed
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                          {availableSpeeds.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`w-full px-4 py-3 text-left text-sm md:text-base hover:bg-white/20 transition ${playbackSpeed === speed ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'
                                }`}
                            >
                              {getSpeedLabel(speed)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quality Selector */}
                  {availableQualities.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="px-3 md:px-4 py-2 md:py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        <span className="text-white text-xs md:text-base font-semibold hidden sm:inline">{getQualityLabel(currentQuality)}</span>
                      </button>

                      {/* Quality Menu */}
                      {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[140px]">
                          <div className="px-4 py-2 text-white text-sm font-semibold border-b border-white/20">
                            Quality
                          </div>
                          <div className="max-h-80 overflow-y-auto scrollbar-hide">
                            {availableQualities.map((quality) => (
                              <button
                                key={quality}
                                onClick={() => handleQualityChange(quality)}
                                className={`w-full px-4 py-3 text-left text-sm md:text-base hover:bg-white/20 transition ${currentQuality === quality ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'
                                  }`}
                              >
                                {getQualityLabel(quality)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exit Fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-3 md:px-4 py-2 md:py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition cursor-pointer"
                  >
                    <Minimize className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    <span className="text-white text-xs md:text-base font-semibold">Exit</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Hints */}
              <div className="hidden md:flex items-center gap-4 text-white/60 text-xs">
                <span>Space: Play/Pause</span>
                <span>← →: Skip 10s</span>
                <span>F: Fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Fullscreen Viewer for PDF and Images */}
      {pdfFullscreen && selectedFile && (selectedFile.type === 'doc' || selectedFile.type === 'pdf' || selectedFile.type === 'image') && (
        <div className="fixed inset-0 z-[100] bg-black select-none" onContextMenu={(e) => e.preventDefault()}>
          <div className="absolute inset-0 flex flex-col">
            {/* Header with close button */}
            <div className="bg-[#13097D] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm md:text-base truncate">{selectedFile.name}</h3>
              <button
                onClick={() => setPdfFullscreen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <Minimize className="w-5 h-5" />
              </button>
            </div>

            {/* Content Viewer */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto">
              {(selectedFile.type === 'doc' || selectedFile.type === 'pdf') ? (
                /* PDF Viewer - direct link with toolbar disabled */
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedFile.documentUrl || '')}&embedded=true`}
                  className="w-full h-full border-0"
                  title={selectedFile.name}
                  allow="autoplay"
                />
              ) : (
                /* Image Viewer */
                <img loading="lazy" decoding="async"
                  src={selectedFile.documentUrl || ''}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
