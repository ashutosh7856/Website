import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square, Timer } from 'lucide-react';
import { VOICE_MAX_SECONDS, VOICE_MIN_SECONDS, type Delivery } from '@/api/mbaGdpi';

/** Formats the browser can record that the API accepts, best first (Safari only does mp4). */
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const canRecord = () =>
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

type Recording = { blob: Blob; seconds: number; url: string };

/** Microphone recorder: everything stays in this tab until the student chooses to send it. */
function useRecorder(maxSeconds: number) {
  const [state, setState] = useState<'idle' | 'starting' | 'recording' | 'recorded'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const tick = useRef<number | null>(null);

  const release = useCallback(() => {
    if (tick.current !== null) window.clearInterval(tick.current);
    tick.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState('starting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(media, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        const seconds = (performance.now() - startedAt.current) / 1000;
        release();
        const blob = new Blob(chunks, {
          type: (rec.mimeType || mimeType || 'audio/webm').split(';')[0],
        });
        setRecording({ blob, seconds, url: URL.createObjectURL(blob) });
        setState('recorded');
      };
      recorder.current = rec;
      startedAt.current = performance.now();
      setElapsed(0);
      rec.start(1000);
      setState('recording');
      tick.current = window.setInterval(() => {
        const s = (performance.now() - startedAt.current) / 1000;
        setElapsed(s);
        if (s >= maxSeconds) stop();
      }, 250);
    } catch (err) {
      release();
      setState('idle');
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser settings, or type your answer instead.'
          : name === 'NotFoundError'
            ? 'No microphone found. Plug one in, or type your answer instead.'
            : "Couldn't start recording. Type your answer instead, or try another browser.",
      );
    }
  }, [maxSeconds, release, stop]);

  const reset = useCallback(() => {
    setRecording(null); // the effect below frees the old clip's URL
    setElapsed(0);
    setState('idle');
  }, []);

  // Leaving the question mid-recording turns the microphone off and frees the clip.
  useEffect(
    () => () => {
      if (recorder.current && recorder.current.state !== 'inactive') {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      release();
    },
    [release],
  );
  useEffect(
    () => () => {
      if (recording) URL.revokeObjectURL(recording.url);
    },
    [recording],
  );

  return { state, elapsed, recording, error, start, stop, reset };
}

/** Record → listen back → send. The clip is transcribed once and then deleted; only the transcript is kept. */
export function VoiceAnswer({
  pending,
  disabled,
  onSend,
}: {
  pending: boolean;
  disabled: boolean;
  onSend: (audio: Blob, seconds: number) => void;
}) {
  const { state, elapsed, recording, error, start, stop, reset } = useRecorder(VOICE_MAX_SECONDS);
  const tooShort = !!recording && recording.seconds < VOICE_MIN_SECONDS;

  if (!canRecord())
    return (
      <p className="rounded-xl bg-[var(--neutral-50)] p-3 font-[Poppins] text-[12.5px] text-[var(--neutral-600)]">
        Voice answers need a browser that can record audio. Type your answer instead.
      </p>
    );

  return (
    <div className="space-y-3 rounded-xl border border-[var(--borders-default)] bg-white p-3.5">
      {state === 'recording' ? (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex items-center gap-2 font-[Poppins] text-[13px] font-semibold text-[var(--red-500)]"
            role="status"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--red-500)]" aria-hidden />
            Recording {clock(elapsed)} / {clock(VOICE_MAX_SECONDS)}
          </span>
          <button
            type="button"
            onClick={stop}
            className="btn-primary ml-auto inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 font-[Poppins] text-[13px] font-semibold"
          >
            <Square className="h-3.5 w-3.5" aria-hidden /> Stop
          </button>
        </div>
      ) : recording ? (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
            <Timer className="h-3.5 w-3.5" aria-hidden /> Your recording · {clock(recording.seconds)}
          </p>
          <audio controls src={recording.url} className="w-full" aria-label="Listen to your recording" />
          {tooShort && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
              That was very short. Record a full answer before sending.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || disabled || tooShort}
              onClick={() => onSend(recording.blob, recording.seconds)}
              className="btn-primary cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? 'Transcribing and reviewing…' : 'Send for feedback'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={reset}
              className="btn-secondary inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 font-[Poppins] text-[13px] font-semibold disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Record again
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || state === 'starting'}
          onClick={() => void start()}
          className="btn-primary inline-flex cursor-pointer items-center gap-1.5 px-5 py-2.5 font-[Poppins] text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mic className="h-4 w-4" aria-hidden /> {state === 'starting' ? 'Starting…' : 'Start recording'}
        </button>
      )}
      {error && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {error}
        </p>
      )}
      <p className="font-[Poppins] text-[11px] leading-relaxed text-[var(--neutral-500)]">
        Speak as you would to the panel, up to 3 minutes. When you send it, your recording is turned into text and then
        deleted. We keep only the transcript and the feedback. It uses one of your daily AI feedbacks.
      </p>
    </div>
  );
}

const PACE_TEXT: Record<Delivery['pace'], string> = {
  slow: 'A little slow',
  steady: 'Easy to follow',
  fast: 'Quite fast',
};

/** Delivery stats for a spoken answer (worked out from the transcript, not from the audio). */
export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  return (
    <section className="rounded-2xl border border-[var(--borders-default)] bg-white p-4">
      <h3 className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">How you said it</h3>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        {[
          ['Length', clock(delivery.durationSeconds)],
          ['Pace', `${delivery.wordsPerMinute} wpm`],
          ['Filler words', String(delivery.fillerCount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--neutral-50)] p-2.5">
            <dt className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{label}</dt>
            <dd className="ss-data text-[16px] text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
        {PACE_TEXT[delivery.pace]}
        {delivery.fillers.length > 0 && ` · ${delivery.fillers.map((f) => `“${f.word}” ×${f.count}`).join(', ')}`}
      </p>
      {delivery.notes.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 font-[Poppins] text-[12.5px] text-[var(--neutral-700)]">
          {delivery.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
