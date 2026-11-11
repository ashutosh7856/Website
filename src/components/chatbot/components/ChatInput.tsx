import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { SendHorizonal, Mic } from "lucide-react";
import { useVoiceChatStore } from "@/store/VoiceChatStore";

type ChatInputProps = {
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  loading: boolean;
  input: string;
  setInput: (value: string) => void;
};

export interface ChatInputRef {
  focus: () => void;
}

const isSpeechRecognitionSupported =
  typeof window !== "undefined" &&
  (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
  { handleKeyPress, handleSend, loading, input, setInput },
  ref
) {
  const { toggleVoiceChat } = useVoiceChatStore();

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const inputRef = useRef<string>(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const combined = inputRef.current ? inputRef.current + " " + finalTranscript : finalTranscript;
        setInput(combined);
      }
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: Event) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop?.();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [setInput]);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  const handleLocalSend = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (input.trim()) {
      handleSend();
    }
  };


  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;


    textarea.style.height = 'auto';

    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  return (
    <div className="max-w-[57.6rem] w-full mx-auto">
      <div className="flex gap-2 md:gap-3 items-end">
        <div className="relative flex-1 bg-[#232323] rounded-2xl md:rounded-3xl border border-[#A0A0A066] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Ask me anything..."}
            className="w-full bg-transparent text-white text-sm md:text-base p-3 md:p-4 pr-20 md:pr-24 resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-[52px] md:min-h-[56px]"
            style={{ height: '56px' }}
            disabled={loading}
          />
          <div className="absolute right-3 md:right-5 bottom-1/2 translate-y-1/2 flex gap-2 md:gap-3 items-center">
            {/* Mic button - Only show when no text input */}
            {!input.trim() && isSpeechRecognitionSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`cursor-pointer flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${isListening ? "bg-red-600 text-white shadow-lg" : "bg-gray-800 text-white/90 hover:bg-gray-700"
                  }`}
                aria-label="Use microphone for dictation"
              >
                <Mic className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                {/* subtle pulse overlay when listening */}
                {isListening && <span className="absolute inline-block w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500/30 animate-pulse" />}
              </button>
            )}

            {/* Voice Chat Toggle or Send Button */}
            {input.trim() ? (
              /* Send button - Shows when there's text */
              <button
                onClick={() => handleLocalSend()}
                disabled={loading}
                className="cursor-pointer flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-colors"
              >
                <SendHorizonal className="w-4 h-4 md:w-[18px] md:h-[18px] text-white" />
              </button>
            ) : (
              /* Voice Chat Toggle - Shows when no text */
              <button
                type="button"
                onClick={() => toggleVoiceChat()}
                className="cursor-pointer flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Toggle voice chat"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-white/90 md:w-[18px] md:h-[18px]">
                  <path d="M7.167 15.416V4.583a.75.75 0 0 1 1.5 0v10.833a.75.75 0 0 1-1.5 0Zm4.166-2.5V7.083a.75.75 0 0 1 1.5 0v5.833a.75.75 0 0 1-1.5 0ZM3 11.25V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Zm12.5 0V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatInput;