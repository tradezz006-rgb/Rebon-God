import { useState, useCallback, useEffect, useRef } from 'react';
import { safeFetchJson } from '@/lib/safeFetch';
import { logger } from '@/lib/logger';

// ─── Sarvam AI Config ───────────────────────────────────────────────────────
// Calls go to /api/sarvam-tts → Vite dev server middleware → api.sarvam.ai
// (Node.js server-side call, no CORS issues ever)
const SARVAM_PROXY_ENDPOINT = '/api/sarvam-tts';

type SarvamTtsResponse = {
  audios?: string[];
};

/**
 * Sanitize text before sending to Sarvam:
 *  - Replace "AVA" / "Ava" with "Ren"
 *  - Strip any Tamil Unicode script (already romanized in JSON, just safety)
 */
function sanitizeForSarvam(text: string): string {
  return text
    .replace(/\bAVA\b/g, 'Ren')
    .replace(/\bAva\b/g, 'Ren')
    .replace(/\bava\b/g, 'ren')
    .trim();
}

/**
 * Call Sarvam AI Bulbul V3 via the Vite dev server middleware.
 * Returns a data:audio/wav;base64,... URL ready for Audio() playback.
 * Uses timeout + one retry + safe JSON parse via safeFetchJson.
 */
async function callSarvamTTS(rawText: string): Promise<string> {
  const text = sanitizeForSarvam(rawText);
  if (!text) throw new Error('Empty text after sanitization');

  // Sarvam has ~500 char limit per call
  const MAX_CHARS = 490;
  const chunks: string[] = [];

  if (text.length <= MAX_CHARS) {
    chunks.push(text);
  } else {
    // Split on sentence/clause boundaries
    const parts = text.split(/(?<=[.!?।])\s+|(?<=,)\s+/);
    let current = '';
    for (const part of parts) {
      if ((current + ' ' + part).trim().length > MAX_CHARS && current) {
        chunks.push(current.trim());
        current = part;
      } else {
        current = (current + ' ' + part).trim();
      }
    }
    if (current) chunks.push(current);
  }

  // Generate audio for all chunks and return first (most content fits in one chunk)
  const base64Parts: string[] = [];
  for (const chunk of chunks) {
    const result = await safeFetchJson<SarvamTtsResponse>(SARVAM_PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: [chunk],
        target_language_code: 'ta-IN',
        speaker: 'priya',
        model: 'bulbul:v3',
        speech_sample_rate: 22050,
        enable_preprocessing: true,
      }),
      timeoutMs: 20_000,
      retryOnce: true,
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    const audio = result.data?.audios?.[0];
    if (!audio) throw new Error('Sarvam returned no audio data');
    base64Parts.push(audio);
  }

  // Return first chunk as data URL (covers ~99% of lesson text)
  return `data:audio/wav;base64,${base64Parts[0]}`;
}

/**
 * Romanizes Tamil script to phonetic English — used only inside Chrome TTS fallback.
 */
function romanizeTamilText(text: string): string {
  if (!/[\u0B80-\u0BFF]/.test(text)) return text;
  const cMap: Record<string, string> = {
    'க': 'k', 'ங': 'ng', 'ச': 'ch', 'ஞ': 'nj', 'ட': 'd', 'ண': 'n',
    'த': 'th', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
    'ல': 'l', 'வ': 'v', 'ழ': 'zh', 'ள': 'l', 'ற': 'r', 'ன': 'n',
    'ஜ': 'j', 'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h'
  };
  const vsMap: Record<string, string> = {
    'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo',
    'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oe', 'ௌ': 'au'
  };
  const svMap: Record<string, string> = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
    'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oe', 'ஔ': 'au'
  };
  let r = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (cMap[c] !== undefined) {
      const n = text[i + 1];
      if (n === '்') { r += cMap[c]; i++; }
      else if (vsMap[n] !== undefined) { r += cMap[c] + vsMap[n]; i++; }
      else { r += cMap[c] + 'a'; }
    } else if (svMap[c] !== undefined) {
      r += svMap[c];
    } else if (c >= '\u0B80' && c <= '\u0BFF') {
      continue;
    } else {
      r += c;
    }
  }
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useAvaVoice — Ren's voice hook.
 *
 * PRIMARY:  Sarvam AI Bulbul V3 · Speaker: Priya · Language: ta-IN
 *           Called via /api/sarvam-tts (Vite Node.js middleware → no CORS)
 *
 * FALLBACK: Chrome/browser SpeechSynthesis — only if Sarvam call fails
 *
 * Pre-generated audio URLs (.mp3 / data: / http) are played directly
 * without any API call (Pillar 1 of the 3-Pillar Voice Cache strategy).
 */
export const useAvaVoice = () => {
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);

  // Load browser voices (only for Chrome TTS fallback)
  useEffect(() => {
    const load = () => {
      if (!window.speechSynthesis) return;
      const all = window.speechSynthesis.getVoices();
      if (!all.length) return;
      const noMale = all.filter(v => {
        const n = v.name.toLowerCase();
        return !n.includes('ravi') && !n.includes('david') && !n.includes('mark') &&
               !n.includes('male') && !n.includes('guy');
      });
      const pool = noMale.length ? noMale : all;
      const best =
        pool.find(v => v.lang.includes('en-IN') && v.name.includes('Neerja')) ||
        pool.find(v => v.lang.includes('en-IN') && v.name.includes('Google')) ||
        pool.find(v => v.lang.includes('en-IN')) ||
        pool.find(v => v.lang.includes('en-GB') && v.name.includes('Google')) ||
        pool[0];
      setActiveVoice(best ?? null);
    };
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  /** Stop all active audio immediately */
  const stopAll = useCallback(() => {
    cancelledRef.current = true;
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /** Play a data URL or CDN URL via HTML Audio element */
  const playAudioUrl = useCallback((
    url: string,
    opts?: { onStart?: (durationMs: number) => void; onEnd?: () => void }
  ) => {
    const audio = new Audio(url);
    activeAudioRef.current = audio;

    const kickOff = () => {
      const durationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.round(audio.duration * 1000)
          : 0;
      opts?.onStart?.(durationMs);
      audio.play().catch((err) => {
        logger.warn('useAvaVoice', 'Audio.play() blocked (autoplay policy)', err);
        setIsSpeaking(false);
        activeAudioRef.current = null;
        opts?.onEnd?.();
      });
    };

    audio.onended = () => {
      setIsSpeaking(false);
      activeAudioRef.current = null;
      if (!cancelledRef.current) opts?.onEnd?.();
    };
    audio.onerror = (e) => {
      logger.error('useAvaVoice', 'Audio playback error', e);
      setIsSpeaking(false);
      activeAudioRef.current = null;
      if (!cancelledRef.current) opts?.onEnd?.();
    };

    if (audio.readyState >= 1) kickOff();
    else audio.onloadedmetadata = () => kickOff();
  }, []);

  /** Chrome TTS — last-resort fallback only */
  const chromeTTSFallback = useCallback((
    text: string,
    opts?: { onStart?: (durationMs: number) => void; onEnd?: () => void }
  ) => {
    if (!window.speechSynthesis) { opts?.onEnd?.(); return; }
    const clean = sanitizeForSarvam(text);
    const romanized = romanizeTamilText(clean);
    const u = new SpeechSynthesisUtterance(romanized);
    if (activeVoice) u.voice = activeVoice;
    u.rate = 0.92;
    u.pitch = 1.0;
    const estMs = Math.min(95_000, Math.max(2_500, romanized.length * 70));
    u.onstart = () => {
      if (!cancelledRef.current) opts?.onStart?.(estMs);
    };
    u.onend = () => {
      setIsSpeaking(false);
      if (!cancelledRef.current) opts?.onEnd?.();
    };
    u.onerror = () => {
      setIsSpeaking(false);
      if (!cancelledRef.current) opts?.onEnd?.();
    };
    window.speechSynthesis.speak(u);
    logger.warn('useAvaVoice', 'Using Chrome TTS fallback (Sarvam not available)');
  }, [activeVoice]);

  type SpeakOptions = {
    onStart?: (durationMs: number) => void;
    onEnd?: () => void;
  };

  const speak = useCallback((
    text: string,
    onEndOrOpts?: (() => void) | SpeakOptions
  ) => {
    const opts: SpeakOptions =
      typeof onEndOrOpts === 'function'
        ? { onEnd: onEndOrOpts }
        : onEndOrOpts || {};

    cancelledRef.current = false;
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(true);

    if (
      text.startsWith('data:audio/') ||
      text.startsWith('http://') ||
      text.startsWith('https://') ||
      text.endsWith('.mp3') ||
      text.includes('/audio/lessons/')
    ) {
      logger.info('useAvaVoice', 'Playing pre-generated audio (Pillar 1 cache hit)');
      playAudioUrl(text, opts);
      return;
    }

    const preview = text.substring(0, 60).replace(/\n/g, ' ');
    logger.info('useAvaVoice', `Generating Sarvam voice for: "${preview}..."`);

    callSarvamTTS(text)
      .then(dataUrl => {
        if (cancelledRef.current) return;
        logger.info('useAvaVoice', 'Sarvam audio ready — playing');
        playAudioUrl(dataUrl, opts);
      })
      .catch(err => {
        if (cancelledRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        logger.error('useAvaVoice', 'Sarvam TTS failed — Chrome TTS fallback', message);
        chromeTTSFallback(text, opts);
      });

  }, [playAudioUrl, chromeTTSFallback]);

  const stop = useCallback(() => {
    stopAll();
  }, [stopAll]);

  return { speak, stop, activeVoice, isSpeaking, voices: [] };
};
