import { useEffect, useRef, useState, useCallback } from 'react';

export interface ChatMessage {
    id: string;
    user: string;
    message: string;
    timestamp: string;
    avatar?: string;
    isHost?: boolean;
}

interface UseWebSocketChatProps {
    counselorId: string;
    userName: string;
    role: 'counselor' | 'user';
    wsUrl?: string;
}

interface WebSocketChatReturn {
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    isConnected: boolean;
    error: string | null;
}

export function useWebSocketChat({
    counselorId,
    userName,
    role,
    wsUrl = 'ws://localhost:4000'
}: UseWebSocketChatProps): WebSocketChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);

                // Join the chat for this counselor
                ws.send(JSON.stringify({
                    type: 'join',
                    counselorId,
                    userName,
                    role,
                    avatar: userName.substring(0, 2).toUpperCase()
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'history':
                            // Received chat history
                            setMessages(data.messages.map((msg: ChatMessage) => ({
                                ...msg,
                                timestamp: msg.timestamp
                            })));
                            break;

                        case 'message':
                            // New message received
                            setMessages((prev) => [...prev, {
                                ...data.message,
                                timestamp: data.message.timestamp
                            }]);
                            break;

                        case 'stream_ended':
                            // Stream has ended
                            setError('The stream has ended');
                            break;

                        case 'error':
                            setError(data.message);
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('Connection error occurred');
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, 3000);
            };
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError('Failed to connect to chat server');
        }
    }, [counselorId, userName, role, wsUrl]);

    useEffect(() => {
        connect();

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((content: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to chat server');
            return;
        }

        if (!content.trim()) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'message',
            content: content.trim()
        }));
    }, []);

    return {
        messages,
        sendMessage,
        isConnected,
        error
    };
}
