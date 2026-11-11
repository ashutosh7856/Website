import { create } from "zustand";
import { transformCounselorData } from "@/api/chatbot";
import type { AllCounselor } from "@/types/academic";
import { API_CONFIG } from "@/api/config";
// 1. Import Session Helper to fix the "user_temp" blocking issue
import { getSessionData } from "@/lib/sessionManager"; 

export interface VoiceMessage {
  text: string;
  isUser: boolean;
  counsellors?: AllCounselor[];
  followup?: string;
}

const splitIntoSentences = (text: string): { sentence: string; remaining: string } | null => {
  const sentenceMatch = text.match(/^(.+?([.?!]+["')\]]*))(\s+|$)/);
  if (sentenceMatch) {
    return { sentence: sentenceMatch[1].trim(), remaining: text.slice(sentenceMatch[0].length) };
  }
  if (text.length > 60) {
    const commaMatch = text.match(/^(.+?([,]+))(\s+|$)/);
    if (commaMatch) {
        return { sentence: commaMatch[1].trim(), remaining: text.slice(commaMatch[0].length) };
    }
  }
  return null;
};

type VoiceChatState = {
  messages: VoiceMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceChatOpen: boolean;
  audioQueue: Promise<string>[]; 
  isPlayingQueue: boolean; 
  currentAudio: HTMLAudioElement | null;
  currentChatStreamController: AbortController | null;
  toggleVoiceChat: () => void;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  processUserTranscript: (transcript: string) => Promise<void>;
  queueAudio: (text: string) => void;
  processAudioQueue: () => Promise<void>;
};

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  messages: [],
  isListening: false,
  isSpeaking: false,
  isVoiceChatOpen: false,
  audioQueue: [],
  isPlayingQueue: false,
  currentAudio: null,
  currentChatStreamController: null,

  toggleVoiceChat: () => {
    get().stopSpeaking();
    set((state) => ({
      isVoiceChatOpen: !state.isVoiceChatOpen,
      messages: !state.isVoiceChatOpen ? [] : state.messages,
    }));
  },

  startListening: () => set({ isListening: true }),
  stopListening: () => set({ isListening: false }),

  stopSpeaking: () => {
    const { currentAudio, currentChatStreamController } = get();
    if (currentChatStreamController) currentChatStreamController.abort();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    set({
      isSpeaking: false,
      isPlayingQueue: false,
      audioQueue: [],
      currentAudio: null,
      currentChatStreamController: null,
    });
  },

  queueAudio: (text: string) => {
    if (!text || !/[a-zA-Z0-9]/.test(text)) return;

    const audioPromise = (async () => {
      try {
        const response = await fetch(`${API_CONFIG.chatbotUrl}/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error("TTS Failed");
        const blob = await response.blob();
        return URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
      } catch (e) {
        console.error("TTS Error:", e);
        return ""; 
      }
    })();

    set((state) => ({ audioQueue: [...state.audioQueue, audioPromise] }));
    
    if (!get().isPlayingQueue) {
      get().processAudioQueue();
    }
  },

  processAudioQueue: async () => {
    set({ isPlayingQueue: true });

    while (get().audioQueue.length > 0) {
      const nextAudioPromise = get().audioQueue[0];
      
      try {
        const audioUrl = await nextAudioPromise;
        set((state) => ({ audioQueue: state.audioQueue.slice(1) }));

        if (audioUrl) {
          await new Promise<void>((resolve) => {
            const audio = new Audio(audioUrl);
            set({ currentAudio: audio });
            
            const nextInLine = get().audioQueue[0];
            if (nextInLine) {
                 nextInLine.then(url => { if(url) new Audio(url); });
            }

            audio.onended = () => {
              URL.revokeObjectURL(audioUrl); 
              resolve();
            };
            
            audio.onerror = () => {
              URL.revokeObjectURL(audioUrl);
              resolve(); 
            };

            audio.onplay = () => {
                 set({ isSpeaking: true });
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => resolve());
            }
          });
        }
      } catch (e) {
        console.error("Queue processing error:", e);
        set((state) => ({ audioQueue: state.audioQueue.slice(1) }));
      }
      
      if (!get().isPlayingQueue) break; 
    }

    set({ isPlayingQueue: false, isSpeaking: false, currentAudio: null });
  },

  processUserTranscript: async (transcript: string) => {
    if (!transcript) return;
    get().stopSpeaking();

    const userMessage: VoiceMessage = { text: transcript, isUser: true };
    set((state) => ({ messages: [...state.messages, userMessage] }));

    const currentHistory = get().messages.map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text + (msg.followup ? " " + msg.followup : ""),
    }));

    const chatController = new AbortController();
    set({ currentChatStreamController: chatController });

    let sentenceBuffer = ""; 

    try {
      // 2. FIX: Get REAL Session Data (Fixes the "Limit Reached" bug)
      // Pass null/undefined for userId/role to rely on localStorage defaults if not logged in
      const sessionData = getSessionData(null, null); 

      const payload = {
        formattedHistory: currentHistory,
        userId: sessionData.userId,     // <--- Uses real ID or persistent Visitor ID
        sessionId: sessionData.sessionId, // <--- Uses real Session ID
        userType: sessionData.userType,
        source: "voice_chat"
      };

      const response = await fetch(`${API_CONFIG.chatbotUrl}/ask?question=${encodeURIComponent(transcript)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: chatController.signal,
      });

      const botMessageId = get().messages.length;
      set((state) => ({
        messages: [...state.messages, { text: "", isUser: false, followup: "", counsellors: [] }],
      }));

      if (!response.body) throw new Error("No body");
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value.split("\n\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          try {
            const jsonString = line.substring(6);
            if (!jsonString.trim()) continue; // Skip empty lines
            
            const event = JSON.parse(jsonString);

            set((state) => {
              const messages = [...state.messages];
              const target = messages[botMessageId];
              if (!target) return { messages };

              // 3. FIX: Handle ALL event types to prevent crashes
              if (event.type === "text_chunk") {
                target.text += event.content;
                sentenceBuffer += event.content;
                
                let extraction;
                while ((extraction = splitIntoSentences(sentenceBuffer))) {
                  if (extraction.sentence.trim().length > 0) { 
                      get().queueAudio(extraction.sentence);
                  }
                  sentenceBuffer = extraction.remaining;
                }
              } 
              else if (event.type === "followup") {
                target.followup = event.data;
                // Speak the follow-up too!
                get().queueAudio(event.data);
              } 
              else if (event.type === "counsellors") {
                target.counsellors = event.data.map(transformCounselorData);
              }
              // 4. FIX: Handle Errors (Speak them)
              else if (event.type === "error") {
                target.text = event.content;
                get().queueAudio(event.content); // "You have reached the limit..."
              }
              // Ignore 'suggestions' and 'token_usage' in voice mode to avoid errors
              
              return { messages };
            });
          } catch { /* ignore */ }
        }
      }

      if (sentenceBuffer.trim()) {
        get().queueAudio(sentenceBuffer);
      }

    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        const errorMsg = "Sorry, I am having trouble connecting.";
        set((state) => ({ messages: [...state.messages, { text: errorMsg, isUser: false }] }));
        get().queueAudio(errorMsg);
      }
    } finally {
      set({ currentChatStreamController: null });
    }
  },
}));