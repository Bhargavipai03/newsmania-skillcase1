/**
 * tts.ts — Text-to-Speech utility
 *
 * Primary:  Google Cloud TTS Neural2 via /api/tts (server-side proxy, key secure)
 *           - de-DE-Neural2-B : crystal-clear German male voice
 *           - en-GB-Neural2-B : clear British English male voice
 *
 * Fallback: StreamElements TTS (no key needed, decent quality)
 * Last resort: Web Speech API (browser built-in)
 */

export type TTSLanguage = 'de' | 'en';

let currentAudio: HTMLAudioElement | null = null;
let currentSpeakId = 0; // Tracks the current active TTS request to prevent overlapping audio clutter

/**
 * Speak text using Google Cloud TTS (via secure server-side route).
 * Falls back to Web Speech if the API call fails.
 */
export async function speakWithGCloud(
  text: string,
  language: TTSLanguage = 'en',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopSpeaking();
  
  // Increment counter for this specific play request
  currentSpeakId++;
  const mySpeakId = currentSpeakId;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4500), language }),
    });

    if (!res.ok) throw new Error(`TTS API returned ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    // Check if another play request was initiated while we were downloading the audio.
    // If so, discard this audio instantly to prevent overlapping "clutter"
    if (currentSpeakId !== mySpeakId) {
       URL.revokeObjectURL(url);
       return;
    }
    
    currentAudio = audio;

    audio.onplay = () => onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      // Cascade directly to native Web Speech API
      webSpeechFallback(text, language, onStart, onEnd);
    };

    await audio.play();
  } catch (err) {
    console.warn('Google Cloud TTS failed, falling back to Web Speech API:', err);
    if (currentSpeakId === mySpeakId) {
      webSpeechFallback(text, language, onStart, onEnd);
    }
  }
}

// (Removed _freeGoogleSpeak due to poor free API character constraints)

// ── Web Speech last-resort fallback ──────────────────────────────────────
function webSpeechFallback(
  text: string,
  language: TTSLanguage,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) { onEnd?.(); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'de' ? 'de-DE' : 'en-US';
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const match = language === 'de'
    ? voices.find(v => v.lang.startsWith('de'))
    : voices.find(v => v.lang.startsWith('en') && v.localService) || voices.find(v => v.lang.startsWith('en'));
  if (match) utterance.voice = match;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ── Shared controls ───────────────────────────────────────────────────────
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeakingNow(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

// Keep backward-compat alias used by old code
export type TTSVoice = string;
export function speakWithStreamElements(
  text: string,
  voice: TTSVoice,
  onStart?: () => void,
  onEnd?: () => void
): void {
  // Map legacy voice names to language codes
  const lang: TTSLanguage = voice.startsWith('de') ? 'de' : 'en';
  speakWithGCloud(text, lang, onStart, onEnd);
}
