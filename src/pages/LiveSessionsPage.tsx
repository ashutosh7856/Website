import { useEffect, useState } from 'react';
import { unlockScroll } from '@/lib/scrollLock';
import type { LiveSession } from '@/api/liveSessions';
import { OngoingSessionModal } from '@/components/live/OngoingSessionModal';
import { useLiveStreamStore } from '@/store/LiveStreamStore';
import { listenToLiveSessionsStatus } from '@/lib/firebase';
import { getBoughtCourses } from '@/api/course';
import { useAuthStore } from '@/store/AuthStore';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '@/components/student-dashboard/EditProfileModal';
import { updateUserProfile } from '@/api/user';
import toast from 'react-hot-toast';
import MobileCourseBottomNav from '@/components/Revamp/courses/MobileCourseBottomNav';

const getAvatarUrl = (photoUrl: string | null, fullName: string) => {
    if (photoUrl && photoUrl.trim() !== "") return photoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=E0E7FF&color=4F46E5`;
};

interface OngoingSessionAvatarProps {
    session: LiveSession;
    onClick: (counsellorId: string, liveSessionId: string, counsellorName: string) => void;
}

function OngoingSessionAvatar({ session, onClick }: OngoingSessionAvatarProps) {    
    const avatarUrl = getAvatarUrl(session.counsellorPhotoUrl, session.counsellorFullName);

    const handleClick = () => {
        onClick(session.counsellorId, session.liveSessionId, session.counsellorFullName);
    };

    return (
        <div 
            onClick={handleClick}
            className="flex flex-col items-center gap-3 shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105"
            style={{ width: '120px' }}
        >
            <div className="relative w-[120px] h-[120px]">
                <div 
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{
                        padding: '3.24px',
                        background: 'linear-gradient(90deg, #FA660F 0%, #13097D 100%)',
                    }}
                >
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img loading="lazy" decoding="async"
                            src={avatarUrl}
                            alt={session.counsellorFullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.counsellorFullName)}&background=E0E7FF&color=4F46E5`;
                            }}
                        />
                    </div>
                </div>
                
                <div 
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#FA660F] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap"
                >
                    LIVE
                </div>
            </div>

            <span className="text-sm font-medium text-[#13097D] text-center line-clamp-2 leading-tight w-full">
                {session.counsellorFullName}
            </span>
        </div>
    );
}

export default function LiveSessionsPage() {
    const { startStream } = useLiveStreamStore.getState();
    const navigate = useNavigate();
    const { userId, isAuthenticated, isLoginToggle, loading, toggleLogin, user, refreshUser } = useAuthStore();
    const [hasRequestedLogin, setHasRequestedLogin] = useState(false);

    const [ongoingSessions, setOngoingSessions] = useState<LiveSession[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<{ 
        id: string, 
        counsellorId: string, 
        name: string, 
        playbackId: string, 
        title: string, 
        description: string,
        liveSince: string
    } | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [error] = useState<string | null>(null);
    const [boughtCourseIds, setBoughtCourseIds] = useState<Set<string>>(new Set());
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [pendingStreamAction, setPendingStreamAction] = useState<(() => void) | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (loading || isAuthenticated) {
            return;
        }

        if (!hasRequestedLogin) {
            setHasRequestedLogin(true);
            toggleLogin();
            return;
        }

        if (!isLoginToggle) {
            navigate('/');
        }
    }, [hasRequestedLogin, isAuthenticated, isLoginToggle, loading, navigate, toggleLogin]);
    
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const fetchBoughtCourses = async () => {
            if (!userId) return;
            try {
                const response = await getBoughtCourses(userId);
                const courseIds = new Set(
                    response.data.map((course: any) => course.courseId?.toString() || '')
                );
                setBoughtCourseIds(courseIds);
            } catch (err) {
                console.error("Failed to fetch bought courses:", err);
            }
        };

        fetchBoughtCourses();
    }, [userId]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        unlockScroll();
        
        const unsubscribe = listenToLiveSessionsStatus((allLives) => {
            // const msNow = Date.now();
            const filteredSessions: LiveSession[] = [];

            Object.entries(allLives).forEach(([key, value]: [string, any]) => {
                if (!value || typeof value !== 'object') return;

                const forWhom = value.forWhom?.toString() || '';
                const courseId = value.courseId?.toString() || '';
                
                // let updatedAtMs = value.updatedAt || 0;
                // if (updatedAtMs < 10000000000) {
                //     updatedAtMs = updatedAtMs * 1000;
                // }
                
                // const timeDiff = Math.abs(msNow - updatedAtMs);
                const isLive = value.isLive  === true //&& timeDiff < 15000;

                if (!isLive) return;

                if (forWhom === 'COURSE') {
                    if (!boughtCourseIds.has(courseId)) {
                        return;
                    }
                }

                let videoId = '';
                if (value.youtubeWatchUrl) {
                    const match = value.youtubeWatchUrl.match(/[?&]v=([^&]+)/);
                    videoId = match ? match[1] : value.youtubeWatchUrl;
                }

                const photoUrl = value.counsellorPhoto || null;

                filteredSessions.push({
                    liveSessionId: value.liveSessionId || key,
                    counsellorId: value.counsellorId || key,
                    counsellorFullName: value.counsellorFullName || 'Counselor',
                    counsellorPhotoUrl: photoUrl,
                    liveSince: value.startedAt ? new Date(value.startedAt).toISOString() : new Date().toISOString(),
                    title: value.title || 'Live Session',
                    description: value.description || '',
                    playbackId: videoId,
                    forWhom: forWhom as any
                });
            });

            setOngoingSessions(filteredSessions);
            setLoadingSessions(false);
        });

        return () => {
            unsubscribe();
        };
    }, [boughtCourseIds, isAuthenticated]);

    const handleAvatarClick = (counsellorId: string, liveSessionId: string, counsellorName: string) => {
        const session = ongoingSessions.find(s => s.liveSessionId === liveSessionId);
        if (session) {
            setSelectedSession({ 
                id: liveSessionId, 
                counsellorId: counsellorId, 
                name: counsellorName,
                playbackId: session.playbackId,
                title: session.title,
                description: session.description,
                liveSince: session.liveSince || new Date().toISOString()
            });
            setIsModalOpen(true);
        }
    };

    const handleJoinStream = (playbackId: string) => {
        if (!selectedSession || isJoining) return;
        
        if (!user?.firstName?.trim()) {
            setIsJoining(true);
            setPendingStreamAction(() => () => {
                startStream(
                    'youtube', 
                    playbackId,
                    `Live Session with ${selectedSession.name}`,
                    'Join our interactive session',
                    selectedSession.id,
                    selectedSession.counsellorId
                );
                setIsModalOpen(false);
                setIsJoining(false);
            });
            setIsProfileModalOpen(true);
            setTimeout(() => setIsJoining(false), 1000);
            return;
        }
        
        setIsJoining(true);
        startStream(
            'youtube', 
            playbackId,
            `Live Session with ${selectedSession.name}`,
            'Join our interactive session',
            selectedSession.id,
            selectedSession.counsellorId
        );
        setIsModalOpen(false);
        setTimeout(() => setIsJoining(false), 500);
    };

    const handleProfileUpdate = async (updatedData: { firstName: string; lastName: string; email: string }) => {
        if (!userId) return;
        const token = localStorage.getItem('jwt');
        if (!token) return;

        try {
            await updateUserProfile(userId, updatedData, token);
            await refreshUser(true);
            toast.success('Profile updated successfully!');
            setIsProfileModalOpen(false);
            
            if (pendingStreamAction && updatedData.firstName?.trim()) {
                pendingStreamAction();
                setPendingStreamAction(null);
            } else {
                setPendingStreamAction(null);
                setIsJoining(false);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setIsJoining(false);
            throw error;
        }
    };

    const renderOngoingContent = () => {
        if (loadingSessions) {
            return <div className="p-8 text-center text-gray-600">Loading ongoing sessions...</div>;
        }

        if (error) {
            return <div className="p-8 text-center text-red-500">{error}</div>;
        }

        if (ongoingSessions.length === 0) {
            return (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm">
                    No ongoing live sessions at the moment.
                </div>
            );
        }
        
        return (
            <div className="flex overflow-x-auto pb-4 gap-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {ongoingSessions.map((session) => (
                    <OngoingSessionAvatar 
                        key={session.liveSessionId} 
                        session={session} 
                        onClick={handleAvatarClick}
                    />
                ))}
            </div>
        );
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center w-full h-screen text-gray-500">
                {loading ? 'Loading user state...' : 'Redirecting for login...'}
            </div>
        );
    }

    return (
        <div className="bg-gray-50 pt-20 md:pt-28 pb-24 md:pb-8 px-4 min-h-screen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 
                    className="text-2xl font-medium mb-6"
                    style={{ 
                        color: '#13097D',
                        fontFamily: 'Poppins', 
                        fontWeight: 500,
                        lineHeight: '125%',
                    }}
                >
                    Ongoing Sessions
                </h1>

                {renderOngoingContent()}
                
            </main>
            <OngoingSessionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                liveSessionId={selectedSession?.id ?? null}
                counsellorId={selectedSession?.counsellorId ?? null}
                counsellorName={selectedSession?.name ?? 'Counselor'}
                onJoinStream={handleJoinStream}
                initialLiveSince={selectedSession?.liveSince}
                fakeSessionData={selectedSession ? {
                    title: selectedSession.title,
                    description: selectedSession.description,
                    playbackId: selectedSession.playbackId,
                    liveSince: selectedSession.liveSince
                } : null}
            />
            
            {user && (
                <EditProfileModal
                    user={user}
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    onUpdate={handleProfileUpdate}
                    onUploadComplete={() => refreshUser(true)}
                    requireNameOnly={true}
                />
            )}

            <MobileCourseBottomNav />
        </div>
    );
}