import { API_CONFIG } from './config';
import { useAuthStore } from '@/store/AuthStore';

export interface LiveSession {
    liveSessionId: string;
    counsellorId: string;
    counsellorFullName: string;
    counsellorPhotoUrl: string | null;
    liveSince: string | null;
    title: string;
    description: string;
    playbackId: string;
    forWhom: 'COURSE' | 'GENERAL' | 'OTHER';
}

interface OngoingSessionsResponse {
    success: boolean;
    message: string;
    data: LiveSession[];
}

export interface DetailedLiveSession {
    liveSessionId: string;
    counsellorId: string;
    type: 'DIRECT_LIVE' | 'SCHEDULED';
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    title: string;
    forWhom: string;
    description: string;
    broadcastId: string;
    youtubeVideoId: string;
    playbackId: string;
    createdAt: { seconds: number; nanos: number };
}

export async function getAllOngoingLiveSessions(): Promise<LiveSession[]> {
    const { userId } = useAuthStore.getState();
    const token = localStorage.getItem('jwt');

    if (!userId || !token) {
        console.error("Authentication check failed: userId or token missing.");
        return [];
    }

    const url = `${API_CONFIG.baseUrl}/api/counsellorLiveSession/getAllOngoingCourseLiveSessionsForUser?userId=${userId}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json', 
                'Authorization': `Bearer ${token}`,
                'Content-Type' : 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: Failed to fetch live sessions. Details: ${errorBody}`);
        }
        
        const data: OngoingSessionsResponse = await response.json();

        if (data.success && data.data) {
            return data.data;
        } else {
            throw new Error(data.message || "Failed to fetch ongoing live sessions.");
        }

    } catch (error) {
        console.error("Error fetching ongoing sessions:", error);
        return [];
    }
}

/**
 * Get counselor's own ongoing live session
 */
export async function getCounselorOngoingSession(counsellorId: string): Promise<LiveSession | null> {
    const token = localStorage.getItem('jwt');

    if (!counsellorId || !token) {
        console.error("Authentication check failed: counsellorId or token missing.");
        return null;
    }

    const url = `${API_CONFIG.baseUrl}/api/counsellorLiveSession/getCounsellorOwnOngoingLiveSession?counsellorId=${counsellorId}`;
    
    console.log('Fetching counselor ongoing session:', { url, counsellorId });
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Counselor session response:', response.status, response.ok);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Counselor session error:', errorBody);
            return null;
        }
        
        const data = await response.json();
        console.log('Counselor session data:', data);

        if (data.success && data.data) {
            return data.data;
        } else {
            return null;
        }

    } catch (error) {
        console.error("Error fetching counselor session:", error);
        return null;
    }
}

export async function getLiveSessionById(counsellorId: string, liveSessionId: string): Promise<DetailedLiveSession | null> {
    const { userId } = useAuthStore.getState();
    const token = localStorage.getItem('jwt');

    if (!userId || !token || !counsellorId || !liveSessionId) {
        console.error("Missing required identifiers for live session detail.");
        return null;
    }

    const url = `${API_CONFIG.baseUrl}/api/counsellorLiveSession/getLiveSessionByIdForUser?counsellorId=${counsellorId}&liveSessionId=${liveSessionId}&userId=${userId}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type' : 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: Failed to fetch session details. Details: ${errorBody}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
            return data.data;
        } else {
            throw new Error(data.message || "Server returned failure message for session details.");
        }

    } catch (error) {
        console.error("Error fetching session details:", error);
        return null;
    }
}

export async function getAllUpcomingLiveSessions(): Promise<LiveSession[]> {
    const { userId } = useAuthStore.getState();
    const token = localStorage.getItem('jwt');

    if (!userId || !token) {
        return [];
    }

    const url = `${API_CONFIG.baseUrl}/api/counsellorLiveSession/getAllUpcomingCourseLiveSessionsForUser?userId=${userId}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json', 
                'Authorization': `Bearer ${token}`,
                'Content-Type' : 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP ${response.status}: Failed to fetch upcoming sessions. Details: ${errorBody}`);
            return [];
        }
        
        const data = await response.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data.map((session: LiveSession & { date?: string; startTime?: string }) => ({
                ...session,
                date: session.date, 
                startTime: session.startTime,
            })) as LiveSession[];
        } else {
            return [];
        }

    } catch (error) {
        console.error("Error fetching upcoming sessions:", error);
        return [];
    }
}

/**
 * Send a message in a live session chat
 */
export async function sendMessageInLiveSession(
    counsellorId: string, 
    userId: string, 
    message: string
): Promise<void> {
    const token = localStorage.getItem('jwt');

    if (!token || !counsellorId || !userId || !message) {
        throw new Error("Missing required parameters for sending message.");
    }

    const url = `${API_CONFIG.baseUrl}/api/counsellorLiveSession/sendMessageInLiveSession?userId=${userId}&counsellorId=${counsellorId}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: Failed to send message. Details: ${errorBody}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || "Failed to send message.");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}