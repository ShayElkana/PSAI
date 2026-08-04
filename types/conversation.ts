// Messages exchanged between the browser and PSAI's relay server over the
// app's own WebSocket protocol (distinct from Gemini Live's wire protocol,
// which only the server ever speaks).

export type Language = "en" | "he" | "ru" | "ar";

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  he: "Hebrew",
  ru: "Russian",
  ar: "Arabic",
};

export type RelayState =
  | "connecting"
  | "listening"
  | "speaking"
  | "reconnecting"
  | "error";

export type Emotion = "calm" | "speaking" | "concerned" | "listening";

export type ClientToRelay =
  | { type: "audio_chunk"; data: string /* base64 PCM16 @ 16kHz mono */ }
  | { type: "audio_end" }
  | { type: "text"; text: string }
  | { type: "set_language"; language: Language };

export type RelayToClient =
  | { type: "audio_chunk"; data: string /* base64 PCM16 @ 24kHz mono */ }
  | { type: "audio_end" }
  | { type: "transcript"; role: "user" | "model"; text: string; final: boolean }
  | { type: "transcript_final"; role: "user" | "model"; text: string; translatedText?: string }
  | { type: "state"; state: RelayState }
  | { type: "emotion"; emotion: Emotion }
  | { type: "safety_notice"; text: string }
  | { type: "error"; message: string };
