import type { WebSocket } from "ws";
import { buildSystemInstruction } from "../gemini/systemPrompt";
import { openLiveSession, type LiveSessionHandle } from "../gemini/liveSession";
import { scanForCrisisLanguage } from "../safety/crisisDetector";
import { CRISIS_RESOURCE_MESSAGE } from "../safety/resources";
import {
  endSession,
  getProfile,
  logSafetyFlag,
  saveTurn,
  startSession,
} from "../memory/store";
import { summarizeSession } from "../memory/summarizer";
import { translateToMatchLanguage } from "../gemini/translate";
import type { ClientToRelay, Language, RelayToClient } from "../../types/conversation";

function send(ws: WebSocket, message: RelayToClient) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export async function handleConnection(ws: WebSocket, initialLanguage: Language): Promise<void> {
  const sessionId = startSession();
  let live: LiveSessionHandle | null = null;
  let closed = false;
  // Set right before we intentionally tear down the live session to switch
  // language, so the onClose handler doesn't report it as a dropped
  // connection needing reconnect-with-backoff.
  let switchingLanguage = false;

  // Accumulate transcript text per turn; Gemini streams transcription in
  // fragments, we persist once a turn completes.
  let userTurnBuffer = "";
  let modelTurnBuffer = "";

  async function connectLive(language: Language, greet: boolean) {
    send(ws, { type: "state", state: "connecting" });
    try {
      const profile = getProfile();
      const systemInstruction = buildSystemInstruction(profile.summary, language);

      live = await openLiveSession(systemInstruction, language, {
        onOpen: () => send(ws, { type: "state", state: "listening" }),
        onAudio: (base64Pcm24k) => {
          send(ws, { type: "audio_chunk", data: base64Pcm24k });
          send(ws, { type: "state", state: "speaking" });
        },
        onTranscript: (role, text, final) => {
          if (role === "user") {
            userTurnBuffer += text;
          } else {
            modelTurnBuffer += text;
          }
          send(ws, { type: "transcript", role, text, final });

          const scan = scanForCrisisLanguage(role === "user" ? userTurnBuffer : text);
          if (scan.flagged) {
            logSafetyFlag(sessionId, scan.matched ?? text);
            live?.sendText(
              `[system note, not from the person: crisis language detected — remember to warmly surface real help: "${CRISIS_RESOURCE_MESSAGE}"]`
            );
            send(ws, { type: "safety_notice", text: CRISIS_RESOURCE_MESSAGE });
          }
        },
        onTurnComplete: () => {
          // Capture and clear immediately — the translation call below is
          // async, and the next turn's transcript deltas must not land on a
          // buffer that's still holding this turn's leftover text.
          const finalUserText = userTurnBuffer.trim();
          const finalModelText = modelTurnBuffer.trim();
          userTurnBuffer = "";
          modelTurnBuffer = "";
          send(ws, { type: "audio_end" });
          send(ws, { type: "state", state: "listening" });

          (async () => {
            // Match the user's transcript to whatever language PSAI's reply
            // for this same turn came out in — that's already whatever
            // language is pinned, no separate state to track here.
            let translatedText: string | undefined;
            if (finalUserText && finalModelText) {
              translatedText =
                (await translateToMatchLanguage(finalUserText, finalModelText)) ?? undefined;
            }
            if (finalUserText) {
              saveTurn(sessionId, "user", finalUserText);
              send(ws, {
                type: "transcript_final",
                role: "user",
                text: finalUserText,
                translatedText,
              });
            }
            if (finalModelText) {
              saveTurn(sessionId, "model", finalModelText);
              send(ws, { type: "transcript_final", role: "model", text: finalModelText });
            }
          })().catch((err) => console.error("[relay] turn finalize failed", err));
        },
        onClose: (reason) => {
          console.log(`[relay] Gemini Live session closed: ${reason}`);
          if (switchingLanguage) {
            switchingLanguage = false;
            return;
          }
          if (!closed) send(ws, { type: "state", state: "reconnecting" });
        },
        onError: (message) => {
          console.error(`[relay] Gemini Live error: ${message}`);
          send(ws, { type: "error", message });
        },
      });

      if (greet) {
        live.sendText(
          "[system note, not from the person: this is the start of a new session — " +
            "say a short, warm hello to open the conversation. Do not mention this note.]"
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to start Gemini Live session";
      console.error("[relay]", message);
      send(ws, { type: "error", message });
      send(ws, { type: "state", state: "error" });
    }
  }

  await connectLive(initialLanguage, true);

  ws.on("message", (raw) => {
    let msg: ClientToRelay;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "set_language") {
      switchingLanguage = true;
      userTurnBuffer = "";
      modelTurnBuffer = "";
      live?.close();
      connectLive(msg.language, false).catch((err) =>
        console.error("[relay] language switch failed", err)
      );
      return;
    }

    if (!live) return;

    if (msg.type === "audio_chunk") {
      live.sendAudioChunk(msg.data);
    } else if (msg.type === "audio_end") {
      live.sendAudioStreamEnd();
    } else if (msg.type === "text") {
      saveTurn(sessionId, "user", msg.text);
      live.sendText(msg.text);
    }
  });

  ws.on("close", () => {
    closed = true;
    live?.close();
    endSession(sessionId);
    summarizeSession(sessionId).catch((err) =>
      console.error("[relay] summarization failed", err)
    );
  });

  ws.on("error", (err) => {
    console.error("[relay] websocket error", err);
  });
}
