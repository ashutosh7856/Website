import { useEffect, useRef, useState } from 'react';
import { useVoiceChatStore } from '@/store/VoiceChatStore';
import { Mic, PhoneOff, X, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const BAR_COUNT = 7;
const SILENCE_TIMEOUT_MS = 1500;

// --- 1. Audio Analysis Hook ---
const useAudioAnalysis = (isListening: boolean) => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(BAR_COUNT).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isListening) {
      setFrequencyData(new Uint8Array(BAR_COUNT).fill(10));
      return;
    }

    let isMounted = true;

    const startAudio = async () => {
      try {
        const AudioCtx =
          window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            ctx.close();
            return;
        }

        streamRef.current = stream;
        if (ctx.state === 'closed') return;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const tick = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          const step = Math.floor(bufferLength / BAR_COUNT);
          const sampledData = new Uint8Array(BAR_COUNT);
          for (let i = 0; i < BAR_COUNT; i++) {
            sampledData[i] = Math.max(dataArray[i * step], 10);
          }
          setFrequencyData(sampledData);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();

      } catch (err) {
        console.error("Mic Error:", err);
      }
    };

    startAudio();

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    };
  }, [isListening]);

  return frequencyData;
};

// --- 2. Waveform Component ---
const WaveformBar = ({ value, index, state }: { value: number, index: number, state: string }) => {
  const isAiSpeaking = state === 'speaking';
  return (
    <motion.div
      layout
      initial={{ height: 24 }}
      animate={{ 
        height: isAiSpeaking ? [32, 96, 32] : Math.min(Math.max(value * 0.8, 24), 160),
        backgroundColor: state === 'listening' ? '#ffffff' : state === 'speaking' ? '#a855f7' : '#525252' 
      }}
      transition={{
        height: isAiSpeaking 
          ? { duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 } 
          : { type: "spring", stiffness: 300, damping: 20 },
        backgroundColor: { duration: 0.3 }
      }}
      className="w-4 md:w-6 rounded-full mx-1 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
    />
  );
};

// --- 3. Main Component ---
const isSpeechRecognitionSupported =
  typeof window !== 'undefined' && ('SpeechRecognition' in window || (window as Partial<Window>).webkitSpeechRecognition);

export default function VoiceChat() {
  const {
    isListening,
    isSpeaking,
    isVoiceChatOpen,
    isPlayingQueue, // <--- Key addition
    toggleVoiceChat,
    startListening,
    stopListening,
    stopSpeaking,
    processUserTranscript,
  } = useVoiceChatStore();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>("");
  
  const frequencyData = useAudioAnalysis(isListening);
  
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const wasSpeakingRef = useRef(isSpeaking);

  // --- LOGIC FIX: Bridge the Gap ---
  // If isPlayingQueue is true, we are downloading audio. Treat this as "thinking".
  const currentState = isSpeaking 
    ? 'speaking' 
    : (isAwaitingResponse || isPlayingQueue) 
    ? 'thinking' 
    : isListening 
    ? 'listening' 
    : 'idle';

  const startRecognitionSafe = () => {
    try { 
        const rec = recognitionRef.current;
        if(rec) {
            try { rec.start(); } catch { /* already started */ }
        }
        startListening(); 
    } catch (e) { console.error(e); }
  };

  const stopRecognitionSafe = () => {
    try { 
        recognitionRef.current?.stop(); 
        stopListening(); 
    } catch { /* recognition already stopped */ }
  };

  const handleFinalInput = async (text: string) => {
    if (!text.trim()) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopRecognitionSafe(); 
    setIsAwaitingResponse(true);
    setTranscriptPreview("");
    try {
      await processUserTranscript(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAwaitingResponse(false);
    }
  };

  // --- LOGIC FIX: Auto-Listen Restart ---
  useEffect(() => {
    // Only restart listening if we finished speaking AND we are not buffering new audio
    if (wasSpeakingRef.current && !isSpeaking && isVoiceChatOpen) {
       const timeoutId = setTimeout(() => {
          if (!isListening && !isAwaitingResponse && !isPlayingQueue) {
             startRecognitionSafe();
          }
       }, 500); 
       return () => clearTimeout(timeoutId);
    }
    wasSpeakingRef.current = isSpeaking;
    // startRecognitionSafe is recreated every render; including it would reset the restart timer on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, isVoiceChatOpen, isListening, isAwaitingResponse, isPlayingQueue]); // Added isPlayingQueue

  // --- SPEECH RECOGNITION SETUP ---
  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      
      setTranscriptPreview(transcript);
      finalTranscriptRef.current = transcript;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        handleFinalInput(finalTranscriptRef.current);
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      if (event.error === 'no-speech') return; 
    };

    if (isListening) {
        try { recognition.start(); } catch { /* already started */ }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognition.stop(); } catch { /* already stopped */ }
    };
    // Recognition is set up once per store action; handleFinalInput/isListening are read via the latest closure on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processUserTranscript]);

  const handleMicToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      return; 
    }
    if (isListening) {
      stopRecognitionSafe();
    } else {
      startRecognitionSafe();
    }
  };

  if (!isVoiceChatOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-zinc-950 text-white p-6 font-sans overflow-hidden"
    >
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center opacity-60">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentState === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium tracking-widest uppercase">{currentState}</span>
        </div>
        <button onClick={toggleVoiceChat} className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-12">
        <div className="h-32 flex items-center justify-center text-center px-4">
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.p 
                key="ai-speaking"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl md:text-3xl font-light text-purple-200"
              >
                AI is speaking...
              </motion.p>
            ) : transcriptPreview ? (
              <motion.p 
                key="preview"
                className="text-2xl md:text-4xl font-medium text-white leading-tight"
              >
                "{transcriptPreview}"
              </motion.p>
            ) : currentState === 'listening' ? (
              <motion.p 
                key="listening-prompt"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.5 }}
                className="text-xl text-zinc-500"
              >
                Listening...
              </motion.p>
            ) : currentState === 'thinking' ? (
                <motion.div 
                  key="thinking"
                  className="flex flex-col items-center gap-3 text-zinc-400"
                >
                  <MoreHorizontal className="animate-pulse w-10 h-10" />
                  <span className="text-sm">Processing</span>
                </motion.div>
            ) : (
              <p className="text-zinc-600">Tap the mic to start</p>
            )}
          </AnimatePresence>
        </div>

        {/* Visualizer */}
        <div className="h-40 flex items-center justify-center gap-1 md:gap-3">
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <WaveformBar 
              key={i} 
              index={i} 
              value={frequencyData[i]} 
              state={currentState}
            />
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex justify-center items-center gap-8 mb-8">
         <motion.button
          onClick={toggleVoiceChat}
          whileTap={{ scale: 0.9 }}
          className="p-4 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <PhoneOff size={24} />
        </motion.button>

        <motion.button
          onClick={handleMicToggle}
          whileTap={{ scale: 0.95 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            currentState === 'listening' 
              ? 'bg-white text-black shadow-white/20' 
              : currentState === 'speaking'
              ? 'bg-purple-600 text-white shadow-purple-500/40 animate-pulse'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          {currentState === 'speaking' ? (
            <X size={32} />
          ) : (
            <Mic size={32} />
          )}
        </motion.button>
        <div className="w-14" />
      </div>
    </motion.div>
  );
}