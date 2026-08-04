import { GoogleGenAI, Modality, type Session } from "@google/genai";
import type { Language } from "../../types/conversation";

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
// "Aoede" reads as bright/breezy in practice — too upbeat for a comforting
// kids companion. "Vindemiatrix" is documented as a gentle voice, a better
// default fit. Override via GEMINI_VOICE_NAME if you want to try another.
const VOICE_NAME = process.env.GEMINI_VOICE_NAME || "Vindemiatrix";

export interface LiveSessionCallbacks {
  onAudio: (base64Pcm24k: string) => void;
  onTranscript: (role: "user" | "model", text: string, final: boolean) => void;
  onTurnComplete: () => void;
  onOpen?: () => void;
  onClose: (reason: string) => void;
  onError: (message: string) => void;
}

export interface LiveSessionHandle {
  sendAudioChunk: (base64Pcm16kMono: string) => void;
  sendAudioStreamEnd: () => void;
  sendText: (text: string) => void;
  close: () => void;
}

export async function openLiveSession(
  systemInstruction: string,
  language: Language,
  callbacks: LiveSessionCallbacks
): Promise<LiveSessionHandle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });

  const session: Session = await ai.live.connect({
    model: LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      outputAudioTranscription: {},
      // Without a language hint the ASR guesses per utterance and can
      // mis-transcribe short phrases as a completely different script
      // (e.g. Hebrew "אני" heard as Korean). Pin it to whatever language
      // is selected in the picker, same as the reply language.
      inputAudioTranscription: { languageHints: { languageCodes: [language] } },
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
      },
    },
    callbacks: {
      onopen: () => callbacks.onOpen?.(),
      onmessage: (message) => {
        const content = message.serverContent;
        if (!content) return;

        const parts = content.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            callbacks.onAudio(part.inlineData.data);
          }
        }

        if (content.inputTranscription?.text) {
          callbacks.onTranscript("user", content.inputTranscription.text, false);
        }
        if (content.outputTranscription?.text) {
          callbacks.onTranscript("model", content.outputTranscription.text, false);
        }
        if (content.turnComplete) {
          callbacks.onTurnComplete();
        }
      },
      onerror: (e) => callbacks.onError(e.message || "Gemini Live error"),
      onclose: (e) => callbacks.onClose(e.reason || "closed"),
    },
  });

  return {
    sendAudioChunk: (base64Pcm16kMono: string) => {
      session.sendRealtimeInput({
        audio: { data: base64Pcm16kMono, mimeType: "audio/pcm;rate=16000" },
      });
    },
    sendAudioStreamEnd: () => {
      session.sendRealtimeInput({ audioStreamEnd: true });
    },
    sendText: (text: string) => {
      session.sendClientContent({ turns: text, turnComplete: true });
    },
    close: () => session.close(),
  };
}
