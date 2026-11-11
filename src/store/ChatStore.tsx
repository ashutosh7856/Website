import { create } from "zustand";
import type { AllCounselor } from "@/types/academic";
import { API_CONFIG } from "@/api/config";
import {
  getSessionData,
  createNewSession,
  type SessionData,
} from "@/lib/sessionManager";
import { fetchChatSessions, fetchChatHistory, type ChatSession } from "@/api/chatbot";

// 1. UPDATE INTERFACE
export interface Message {
  text: string;
  isUser: boolean;
  counsellors?: AllCounselor[];
  followup?: string;
  streamingRaw?: string;
  suggestions?: string[]; // <--- ADD THIS
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

type ChatState = {
  messages: Message[];
  isChatbotOpen: boolean;
  abortController: AbortController | null;
  loading: boolean;
  currentSessionId: string | null;
  chatSessions: ChatSession[];
  visitorMessageCount: number;
  isLoginOpenFromChatbot: boolean;
  isLoadingSessions: boolean;
  isLoadingHistory: boolean;
  sessionsFetched: boolean;
  toggleChatbot: () => void;
  sendMessage: (question: string, userId?: string | null, userRole?: string | null, token?: string | null) => Promise<void>;
  stopGenerating: () => void;
  loadMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  startNewChat: () => void;
  loadChatSessions: (userId: string, force?: boolean) => Promise<void>;
  loadChatHistoryBySessionId: (sessionId: string) => Promise<void>;
  setCurrentSessionId: (sessionId: string | null) => void;
  incrementVisitorMessageCount: () => number;
  resetVisitorMessageCount: () => void;
  setLoginOpenFromChatbot: (isOpen: boolean) => void;
  resetChatState: () => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  renameChatSession: (sessionId: string, newTitle: string, userId: string) => Promise<void>;
  deleteChatSession: (sessionId: string, userId: string) => Promise<void>;
  bookmarkChatSession: (sessionId: string, userId: string, bookmarked: boolean) => Promise<void>;
};

/** Counsellor payload as emitted by the chatbot backend (stream events and stored history). */
interface ChatbotCounselorPayload {
  counsellorId: string;
  fullName?: string;
  photo?: string;
  rating?: number;
  plusAmount?: number;
  experience?: string | number;
  languagesKnow?: string[];
  languagesKnown?: string;
  city?: string;
  reviewCount?: number | string;
  expertise?: string[];
  description?: string;
  organisationName?: string;
  email?: string;
  fullOfficeAddress?: AllCounselor["fullOfficeAddress"];
  stateOfCounsellor?: string[];
  workingDays?: string[];
  officeStartTime?: string;
  officeEndTime?: string;
}

const transformCounselorData = (apiCounselor: ChatbotCounselorPayload): AllCounselor => {
  const [firstName, ...lastName] = (apiCounselor.fullName || "N/A").split(" ");
  return {
    counsellorId: apiCounselor.counsellorId,
    firstName: firstName,
    lastName: lastName.join(" "),
    photoUrlSmall: apiCounselor.photo || "/default-avatar.jpg",
    rating: apiCounselor.rating || 0,
    ratePerYear: apiCounselor.plusAmount || 5000,
    experience: `${apiCounselor.experience || 0}`,
    languagesKnow: Array.isArray(apiCounselor.languagesKnow)
      ? apiCounselor.languagesKnow
      : (apiCounselor.languagesKnown || "English").split(", "),
    city: apiCounselor.city || "N/A",
    numberOfRatings: `${apiCounselor.reviewCount || 0}`,
    expertise: apiCounselor.expertise || [],
    description: apiCounselor.description,
    organisationName: apiCounselor.organisationName,
    email: apiCounselor.email,
    fullOfficeAddress: apiCounselor.fullOfficeAddress || {},
    states: apiCounselor.stateOfCounsellor || [],
    workingDays: apiCounselor.workingDays || [],
    officeStartTime: apiCounselor.officeStartTime,
    officeEndTime: apiCounselor.officeEndTime,
  };
};

export const useChatStore = create<ChatState>((set, get) => ({
  abortController: null,
  messages: [],
  isChatbotOpen: false,
  loading: false,
  currentSessionId: null,
  chatSessions: [],
  visitorMessageCount: 0,
  isLoginOpenFromChatbot: false,
  isLoadingSessions: false,
  isLoadingHistory: false,
  sessionsFetched: false,

  toggleChatbot: () => {
    set((state) => ({ isChatbotOpen: !state.isChatbotOpen }));
  },

  setLoginOpenFromChatbot: (isOpen: boolean) => {
    set({ isLoginOpenFromChatbot: isOpen });
  },

  stopGenerating: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ loading: false, abortController: null });
    }
  },

  loadMessages: (newMessages: Message[]) => {
    set({ messages: newMessages });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  startNewChat: () => {
    const newSessionId = createNewSession();
    set({ messages: [], currentSessionId: newSessionId });
    get().updateSessionTitle(newSessionId, "New Chat");
    console.log("🆕 New chat session started:", newSessionId);
  },

  setCurrentSessionId: (sessionId: string | null) => {
    set({ currentSessionId: sessionId });
  },

  loadChatSessions: async (userId: string, force: boolean = false) => {
    if (get().sessionsFetched && !force) {
      console.log("📋 Using cached chat sessions");
      return;
    }
    set({ isLoadingSessions: true });
    try {
      const sessions = await fetchChatSessions(userId);
      set({ chatSessions: sessions, isLoadingSessions: false, sessionsFetched: true });
      console.log("📋 Loaded chat sessions:", sessions);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      set({ chatSessions: [], isLoadingSessions: false });
    }
  },

  updateSessionTitle: (sessionId: string, title: string) => {
    set((state) => {
      const existingSession = state.chatSessions.find(s => s.sessionId === sessionId);
      if (existingSession) {
        return {
          chatSessions: state.chatSessions.map(s =>
            s.sessionId === sessionId ? { ...s, title } : s
          )
        };
      } else {
        return {
          chatSessions: [
            { sessionId, title, updatedAt: new Date().toISOString() },
            ...state.chatSessions
          ]
        };
      }
    });
  },

  renameChatSession: async (sessionId: string, newTitle: string, userId: string) => {
    get().updateSessionTitle(sessionId, newTitle);
    const { renameSession } = await import("@/api/chatbot");
    const success = await renameSession(userId, sessionId, newTitle);
    if (!success) {
      console.error("Rename failed");
    }
  },

  deleteChatSession: async (sessionId: string, userId: string) => {
    const { deleteSession } = await import("@/api/chatbot");
    set((state) => ({
      chatSessions: state.chatSessions.filter((s) => s.sessionId !== sessionId)
    }));
    if (get().currentSessionId === sessionId) {
      get().startNewChat();
    }
    await deleteSession(userId, sessionId);
  },

  bookmarkChatSession: async (sessionId: string, userId: string, bookmarked: boolean) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.sessionId === sessionId ? { ...s, isBookmarked: bookmarked } : s
      ),
    }));
    const { bookmarkSession } = await import("@/api/chatbot");
    const success = await bookmarkSession(userId, sessionId, bookmarked);
    if (!success) {
      set((state) => ({
        chatSessions: state.chatSessions.map((s) =>
          s.sessionId === sessionId ? { ...s, isBookmarked: !bookmarked } : s
        ),
      }));
      console.error("Failed to update bookmark");
    }
  },

  loadChatHistoryBySessionId: async (sessionId: string) => {
    set({ isLoadingHistory: true });
    try {
      const history = await fetchChatHistory(sessionId);
      const transformedMessages: Message[] = history.map((msg) => {
        // Parse counsellors from the API message if present
        let counsellors: AllCounselor[] | undefined = undefined;

        // Check if the message object has counsellors field (from backend)
        const msgData = msg as typeof msg & { counsellors?: ChatbotCounselorPayload[] };
        if (msgData.counsellors && Array.isArray(msgData.counsellors) && msgData.counsellors.length > 0) {
          // Transform raw counsellor data to frontend format
          counsellors = msgData.counsellors.map(transformCounselorData);
          if (counsellors) {
            console.log(`📋 Found ${counsellors.length} counsellors in loaded message`);
          }
        }

        return {
          text: msg.content,
          isUser: msg.role === "user",
          counsellors,
          followup: undefined, // Could also parse followup if backend sends it
        };
      });

      set({
        messages: transformedMessages,
        currentSessionId: sessionId,
        isLoadingHistory: false
      });
      console.log('💬 Loaded chat history for session:', sessionId);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      set({ messages: [], isLoadingHistory: false });
    }
  },

  incrementVisitorMessageCount: () => {
    const newCount = get().visitorMessageCount + 1;
    set({ visitorMessageCount: newCount });
    return newCount;
  },

  resetVisitorMessageCount: () => {
    set({ visitorMessageCount: 0 });
  },

  resetChatState: () => {
    get().abortController?.abort();
    set({
      messages: [],
      currentSessionId: null,
      chatSessions: [],
      visitorMessageCount: 0,
      loading: false,
      abortController: null,
      isLoadingSessions: false,
      isLoadingHistory: false,
      sessionsFetched: false,
    });
    console.log("🔄 Chat state reset");
  },

  sendMessage: async (question: string, userId?: string | null, userRole?: string | null, token?: string | null) => {
    get().abortController?.abort();
    const userMessage: Message = { text: question, isUser: true };
    const currentHistory = get().messages;
    const controller = new AbortController();
    const botPlaceholder: Message = { text: "", isUser: false, counsellors: [], followup: "" };

    const sessionData: SessionData = getSessionData(userId, userRole, token);
    const isFirstMessageInSession = currentHistory.length === 0;

    if (!get().currentSessionId) {
      set({ currentSessionId: sessionData.sessionId });
    }

    set((state) => ({
      messages: [...state.messages, userMessage, botPlaceholder],
      loading: true,
      abortController: controller,
    }));

    try {
      const historyForAPI = [...currentHistory, userMessage];

      const formattedHistory = historyForAPI.map((msg) => {
        let content = msg.text;
        if (!msg.isUser && msg.followup) {
          content = `${content}\n\n[Followup Question Asked: ${msg.followup}]`;
        }
        if (!msg.isUser && msg.counsellors && msg.counsellors.length > 0) {
          // simplified context logic for brevity
          content = `${content}\n\n[CONTEXT_DATA: Counsellors shown]`;
        }
        return {
          role: msg.isUser ? 'user' : 'assistant',
          content: content,
        };
      });

      const response = await fetch(
        `${API_CONFIG.chatbotUrl}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionData.token ? { "Authorization": `Bearer ${sessionData.token}` } : {})
          },
          body: JSON.stringify({
            formattedHistory,
            sessionId: sessionData.sessionId,
            userId: sessionData.userId,
            userType: sessionData.userType,
            source: sessionData.source,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (get().abortController?.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonString = line.substring(6);
            try {
              const eventData = JSON.parse(jsonString);
              await new Promise(resolve => setTimeout(resolve, 10));

              set((state) => {
                const lastMessageIndex = state.messages.length - 1;
                const newMessages = JSON.parse(JSON.stringify(state.messages));

                switch (eventData.type) {
                  case "text_chunk": {
                    if (!newMessages[lastMessageIndex].streamingRaw) {
                      newMessages[lastMessageIndex].streamingRaw = "";
                    }
                    newMessages[lastMessageIndex].streamingRaw += eventData.content;
                    let cleanText = newMessages[lastMessageIndex].streamingRaw;
                    cleanText = cleanText.replace(/\[CONTEXT_DATA:[\s\S]*?\]/g, "");
                    cleanText = cleanText.replace(/\[Followup Question Asked:[\s\S]*?\]/g, "");
                    cleanText = cleanText.replace(/\[\s*\{"name":[\s\S]*?\}\s*\]/g, "");
                    newMessages[lastMessageIndex].text = cleanText;
                    break;
                  }

                  case "counsellors":
                    newMessages[lastMessageIndex].counsellors = eventData.data.map(transformCounselorData);
                    break;

                  case "followup":
                    newMessages[lastMessageIndex].followup = eventData.data;
                    break;
                  case "suggestions":
                    newMessages[lastMessageIndex].suggestions = eventData.data;
                    break;

                  // ... inside switch(eventData.type) ...
                  case "token_usage": {
                    const { input, output, total } = eventData.data;

                    // GPT-4o-mini Pricing
                    const inputCostUSD = (input / 1000000) * 0.15;
                    const outputCostUSD = (output / 1000000) * 0.60;
                    const totalCostUSD = inputCostUSD + outputCostUSD;

                    // Current Exchange Rate (approx)
                    const conversionRate = 90;
                    const totalCostINR = totalCostUSD * conversionRate;

                    console.group("🇮🇳 Cost Analysis (Rupees)");
                    console.log(`Tokens: ${total} (In: ${input}, Out: ${output})`);
                    console.log(`USD Cost: $${totalCostUSD.toFixed(7)}`);
                    console.log(`%cINR Cost: ₹${totalCostINR.toFixed(5)}`, "color: green; font-weight: bold; font-size: 14px;");
                    console.groupEnd();
                    break;
                  }

                  case "error":
                    newMessages[lastMessageIndex].text = eventData.content;
                    break;
                }
                return { messages: newMessages };
              });
            } catch {
              console.error("Failed to parse stream JSON:", jsonString);
            }
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') {
        console.log("Fetch aborted by user.");
      } else {
        console.error("Streaming failed:", err);
        const errorMessage: Message = { text: "Sorry, I couldn't connect to the server.", isUser: false };
        set((state) => ({
          messages: [...state.messages.slice(0, -1), errorMessage],
        }));
      }
    } finally {
      set({ loading: false, abortController: null });
      if (isFirstMessageInSession && sessionData.sessionId) {
        const title = question.length > 50 ? question.substring(0, 50) + "..." : question;
        get().updateSessionTitle(sessionData.sessionId, title);
      }
    }
  },
}));