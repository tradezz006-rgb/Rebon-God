import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type ListenMode = 'answer' | 'doubt' | 'quick';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Two timers: one for initial silence (no speech at all), one for post-speech silence
  const initialSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const postSpeechSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listenModeRef = useRef<ListenMode>('doubt');
  const hasSpokenRef = useRef(false);

  const clearAllTimers = () => {
    if (initialSilenceTimerRef.current) clearTimeout(initialSilenceTimerRef.current);
    if (postSpeechSilenceTimerRef.current) clearTimeout(postSpeechSilenceTimerRef.current);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          hasSpokenRef.current = true;

          // Clear the "initial silence" timer — user has started speaking
          if (initialSilenceTimerRef.current) clearTimeout(initialSilenceTimerRef.current);

          // After speech detected: stop after 2.5s of silence (regardless of mode)
          if (postSpeechSilenceTimerRef.current) clearTimeout(postSpeechSilenceTimerRef.current);
          postSpeechSilenceTimerRef.current = setTimeout(() => {
            recog.stop();
          }, 2500);
        };

        recog.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setError(event.error);
          setIsListening(false);
          clearAllTimers();
        };

        recog.onend = () => {
          setIsListening(false);
          clearAllTimers();
        };

        setRecognition(recog);
      } else {
        setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      }
    }

    return () => {
      clearAllTimers();
    };
  }, []);

  /**
   * Start listening.
   * @param mode
   *   'answer' — question mode: wait up to 60s for the student to start speaking,
   *              then 2.5s of silence ends it.
   *   'doubt'  — interrupt/doubt mode: wait up to 30s for student to start, then 2.5s silence.
   *   'quick'  — quick confirm (yes/no): 10s total.
   */
  const startListening = useCallback((mode: ListenMode = 'doubt') => {
    if (recognition && !isListening) {
      setError(null);
      setTranscript('');
      hasSpokenRef.current = false;
      listenModeRef.current = mode;
      clearAllTimers();

      try {
        recognition.start();
        setIsListening(true);

        // Initial silence timeout — how long we wait for the student to BEGIN speaking
        const initialTimeout =
          mode === 'answer' ? 60_000 :  // 60 seconds for answering a question
          mode === 'doubt'  ? 30_000 :  // 30 seconds for doubts
                              10_000;   // 10 seconds for quick yes/no

        initialSilenceTimerRef.current = setTimeout(() => {
          // Student never spoke — stop
          if (!hasSpokenRef.current) {
            recognition.stop();
          }
        }, initialTimeout);

      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      clearAllTimers();
    }
  }, [recognition, isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    resetTranscript: () => setTranscript(''),
  };
};
