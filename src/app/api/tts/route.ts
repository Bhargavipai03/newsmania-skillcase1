import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts
 * Body: { text: string, language: "de" | "en" }
 *
 * Priority:
 *   1. ElevenLabs  — eleven_multilingual_v2, best quality for German & English
 *   2. Google Cloud TTS Neural2 — excellent fallback
 *
 * The API keys stay server-side, never exposed to the browser.
 *
 * ElevenLabs voices used:
 *   German & English: Adam  (pNInz6obpgDQGcFmaJgB)
 *   — multilingual model handles the language switch automatically
 */

// ── ElevenLabs ────────────────────────────────────────────────────────────
const EL_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
// Adam voice — deep, clear, works perfectly in German with multilingual_v2
const EL_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

async function tryElevenLabs(
  text: string,
  _language: string
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
  if (!apiKey || apiKey.startsWith('your_') || apiKey.length < 20) return null;

  const res = await fetch(`${EL_BASE}/${EL_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 4500),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.80,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    console.error('ElevenLabs TTS failed:', res.status, await res.text());
    return null;
  }
  return res.arrayBuffer();
}

// ── Google Cloud TTS ──────────────────────────────────────────────────────
const GCLOUD_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const GCLOUD_VOICES: Record<string, { languageCode: string; name: string; ssmlGender: string }> = {
  de: { languageCode: 'de-DE', name: 'de-DE-Neural2-B', ssmlGender: 'MALE' },
  en: { languageCode: 'en-GB', name: 'en-GB-Neural2-B', ssmlGender: 'MALE' },
};

async function tryGoogleCloud(
  text: string,
  language: string
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY ?? '';
  if (!apiKey || apiKey.startsWith('your_') || apiKey.length < 10) return null;

  const voice = GCLOUD_VOICES[language] ?? GCLOUD_VOICES.en;
  const res = await fetch(`${GCLOUD_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: text.slice(0, 4500) },
      voice,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        effectsProfileId: ['headphone-class-device'],
      },
    }),
  });

  if (!res.ok) {
    console.error('Google Cloud TTS failed:', res.status, await res.text());
    return null;
  }

  const json = await res.json();
  const base64: string = json.audioContent;
  return Buffer.from(base64, 'base64').buffer as ArrayBuffer;
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { text?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { text, language = 'en' } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required.' }, { status: 400 });
  }

  // Try ElevenLabs first
  let audio = await tryElevenLabs(text, language).catch(() => null);

  // Fall back to Google Cloud TTS
  if (!audio) {
    audio = await tryGoogleCloud(text, language).catch(() => null);
  }

  if (!audio) {
    return NextResponse.json(
      { error: 'No TTS provider available. Check ELEVENLABS_API_KEY or GOOGLE_CLOUD_TTS_KEY in .env.local.' },
      { status: 503 }
    );
  }

  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
