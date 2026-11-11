import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Gauge } from "lucide-react";

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
    getPlaybackRate: () => number;
    setPlaybackRate: (rate: number) => void;
    getAvailablePlaybackRates: () => number[];
    // Present once the player is ready; checked before use.
    getCurrentTime?: () => number;
    getDuration?: () => number;
    seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
}

interface YTPlayerEvent {
    target: Required<YTPlayer>;
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
};

// Helper to extract YouTube video ID
const extractYouTubeVideoId = (urlOrId: string): string => {
    if (!urlOrId) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match && match[1]) return match[1];
    }

    return urlOrId;
};

interface VideoExplanationPlayerProps {
    videoUrl: string;
    title?: string;
}

export default function VideoExplanationPlayer({ videoUrl, title = "Video Explanation" }: VideoExplanationPlayerProps) {
    const videoId = extractYouTubeVideoId(videoUrl);
    const playerRef = useRef<YTPlayer | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fullscreenPlayerRef = useRef<YTPlayer | null>(null);
    const containerId = useRef(`yt-solution-${Math.random().toString(36).slice(2, 9)}`);
    const fsContainerId = useRef(`yt-solution-fs-${Math.random().toString(36).slice(2, 9)}`);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const availableSpeeds = [0.25, 0.5, 1, 1.25, 1.5, 2];

    const initializePlayer = (playerId: string, targetPlayerRef: React.MutableRefObject<YTPlayer | null>) => {
        if (!videoId) return;

        try {
            targetPlayerRef.current = new YT.Player(playerId, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    rel: 0,
                    fs: 0,
                    playsinline: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event: YTPlayerEvent) => {
                        try {
                            const videoDuration = event.target.getDuration();
                            if (videoDuration && videoDuration > 0) {
                                setDuration(videoDuration);
                            }
                        } catch { /* ignore */ }

                        // Start progress tracking
                        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = setInterval(() => {
                            try {
                                const player = targetPlayerRef.current;
                                if (player?.getCurrentTime && player?.getDuration) {
                                    setCurrentTime(player.getCurrentTime());
                                    const d = player.getDuration();
                                    if (d > 0) setDuration(d);
                                }
                            } catch { /* ignore */ }
                        }, 500);

                        // Apply saved speed
                        if (playbackSpeed !== 1 && event.target.setPlaybackRate) {
                            event.target.setPlaybackRate(playbackSpeed);
                        }

                        // Sync fullscreen player with main
                        if (targetPlayerRef === fullscreenPlayerRef && playerRef.current) {
                            const mainPlayer = playerRef.current;
                            if (mainPlayer.getCurrentTime) {
                                const currentPos = mainPlayer.getCurrentTime();
                                event.target.seekTo(currentPos, true);
                                if (isPlaying) event.target.playVideo();
                            }
                        }
                    },
                    onStateChange: (event: YTPlayerEvent) => {
                        setIsPlaying(event.data === 1);
                    },
                    onError: () => { /* ignore */ },
                },
            });
        } catch { /* ignore */ }
    };

    // Initialize YouTube player
    useEffect(() => {
        if (!videoId) return;

        const playerId = containerId.current;

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
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- (re)create the YouTube player only when the video changes; initializePlayer is recreated every render
    }, [videoId]);

    // Initialize fullscreen player
    useEffect(() => {
        if (isFullscreen && videoId && window.YT) {
            const timer = setTimeout(() => {
                initializePlayer(fsContainerId.current, fullscreenPlayerRef);
            }, 100);
            return () => {
                clearTimeout(timer);
                if (fullscreenPlayerRef.current) {
                    fullscreenPlayerRef.current.destroy();
                    fullscreenPlayerRef.current = null;
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- build the fullscreen player only on enter/exit or video change; initializePlayer is recreated every render
    }, [isFullscreen, videoId]);

    const handlePlayPause = () => {
        const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
        if (activePlayer) {
            if (isPlaying) activePlayer.pauseVideo();
            else activePlayer.playVideo();
        }
    };

    const handleSeek = (newTime: number) => {
        const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
        if (activePlayer) {
            const player = activePlayer;
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

    const handleSpeedChange = (speed: number) => {
        const activePlayer = isFullscreen ? fullscreenPlayerRef.current : playerRef.current;
        if (activePlayer && typeof activePlayer.setPlaybackRate === 'function') {
            activePlayer.setPlaybackRate(speed);
            setPlaybackSpeed(speed);
            setShowSpeedMenu(false);
        }
    };

    const getSpeedLabel = (speed: number) => speed === 1 ? 'Normal' : `${speed}x`;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!videoId) return null;

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Play className="w-5 h-5" />
                {title}
            </h3>

            <div
                className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {/* Video Player */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <div
                        id={containerId.current}
                        className="absolute top-0 left-0 w-full h-full"
                    />

                    {/* Controls Overlay */}
                    <div
                        className={`absolute inset-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {/* Center Play/Pause */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                                className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition cursor-pointer shadow-2xl backdrop-blur-sm border-2 border-white/20"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
                                ) : (
                                    <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white ml-1" />
                                )}
                            </button>
                        </div>

                        {/* Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-2">
                                {/* Progress Bar */}
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={(e) => handleSeek(Number(e.target.value))}
                                    className="w-full h-1 md:h-1.5 rounded-lg cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #FA660F 0%, #FA660F ${(currentTime / (duration || 1)) * 100}%, #4B5563 ${(currentTime / (duration || 1)) * 100}%, #4B5563 100%)`
                                    }}
                                />

                                {/* Control Buttons */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <button
                                            onClick={handlePlayPause}
                                            className="w-9 h-9 md:w-10 md:h-10 bg-[#FA660F] hover:bg-[#e55e0e] rounded-full flex items-center justify-center transition cursor-pointer shadow-lg"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
                                            ) : (
                                                <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white ml-0.5" />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleSkip(-10)}
                                            className="hidden sm:flex px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-semibold transition cursor-pointer items-center gap-1"
                                        >
                                            <SkipBack className="w-3 h-3" />
                                            <span>10s</span>
                                        </button>

                                        <button
                                            onClick={() => handleSkip(10)}
                                            className="hidden sm:flex px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-semibold transition cursor-pointer items-center gap-1"
                                        >
                                            <span>10s</span>
                                            <SkipForward className="w-3 h-3" />
                                        </button>

                                        <span className="text-white text-xs md:text-sm font-medium hidden md:inline">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Speed Selector */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                                className="w-8 h-8 md:w-9 md:h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                                            >
                                                <Gauge className="w-4 h-4 text-white" />
                                            </button>

                                            {showSpeedMenu && (
                                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[120px] z-30">
                                                    <div className="px-3 py-2 text-white text-xs font-semibold border-b border-white/20">Speed</div>
                                                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                                        {availableSpeeds.map((speed) => (
                                                            <button
                                                                key={speed}
                                                                onClick={() => handleSpeedChange(speed)}
                                                                className={`w-full px-3 py-2 text-left text-xs md:text-sm hover:bg-white/20 transition ${playbackSpeed === speed ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'}`}
                                                            >
                                                                {getSpeedLabel(speed)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fullscreen Button */}
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="w-8 h-8 md:w-9 md:h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                                        >
                                            {isFullscreen ? (
                                                <Minimize className="w-4 h-4 text-white" />
                                            ) : (
                                                <Maximize className="w-4 h-4 text-white" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Block YouTube UI clicks */}
                    <div
                        className="absolute inset-0 z-10 cursor-default"
                        style={{ pointerEvents: showControls ? 'none' : 'auto' }}
                        onClick={handlePlayPause}
                    />
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[100] bg-black"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                    onTouchStart={() => setShowControls(true)}
                    onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
                >
                    <div className="absolute inset-0 bg-black overflow-hidden">
                        <div
                            id={fsContainerId.current}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                        <div
                            className="absolute inset-0 z-[5]"
                            style={{ pointerEvents: showControls ? 'none' : 'auto', background: 'transparent' }}
                            onClick={handlePlayPause}
                            onTouchEnd={(e) => { e.preventDefault(); handlePlayPause(); }}
                        />
                    </div>

                    {/* Fullscreen Controls */}
                    <div
                        className={`absolute inset-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }}
                    >
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 space-y-3">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => handleSeek(Number(e.target.value))}
                                className="w-full h-1.5 md:h-2 rounded-lg cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #FA660F 0%, #FA660F ${(currentTime / (duration || 1)) * 100}%, #4B5563 ${(currentTime / (duration || 1)) * 100}%, #4B5563 100%)`
                                }}
                            />

                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2 md:gap-4">
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

                                    <button
                                        onClick={() => handleSkip(-10)}
                                        className="hidden sm:flex px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-semibold transition cursor-pointer items-center gap-2"
                                    >
                                        <SkipBack className="w-4 h-4" />
                                        <span>10s</span>
                                    </button>

                                    <button
                                        onClick={() => handleSkip(10)}
                                        className="hidden sm:flex px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-semibold transition cursor-pointer items-center gap-2"
                                    >
                                        <span>10s</span>
                                        <SkipForward className="w-4 h-4" />
                                    </button>

                                    <span className="text-white text-sm md:text-lg font-medium hidden md:inline">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition cursor-pointer"
                                        >
                                            <Gauge className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            <span className="text-white text-xs md:text-base font-semibold hidden sm:inline">{getSpeedLabel(playbackSpeed)}</span>
                                        </button>

                                        {showSpeedMenu && (
                                            <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg min-w-[140px]">
                                                <div className="px-3 py-2 text-white text-xs font-semibold border-b border-white/20">Speed</div>
                                                <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                                    {availableSpeeds.map((speed) => (
                                                        <button
                                                            key={speed}
                                                            onClick={() => handleSpeedChange(speed)}
                                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-white/20 transition ${playbackSpeed === speed ? 'text-[#FA660F] font-semibold bg-white/10' : 'text-white'}`}
                                                        >
                                                            {getSpeedLabel(speed)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setIsFullscreen(false)}
                                        className="w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition cursor-pointer"
                                    >
                                        <Minimize className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
